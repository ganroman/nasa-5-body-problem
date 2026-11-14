"""Deterministic scenario-vs-observation comparison, evidence classing, ranking and coverage.

Pure functions over plain dicts shaped like the ORM columns in app.models (no DB access).
Units in: O2 volume fraction, kPa, m/s. Units out (display): O2 percentage points, kPa, cm/s.

Nothing here produces a verdict, safety score or confidence. `navigation_rank` is only an
ordering aid for browsing evidence (build-plan section 7).
"""

from collections.abc import Iterable, Mapping
from typing import Any

from app.enums import AssessmentStatus, Dimension, GravityRegime, Hazard, MatchConfidence, ValueStatus

# Tolerances in internal units. Disclosed in every comparison result.
O2_TOLERANCE = 0.015  # fraction = 1.5 points, same as the dashboard mock
PRESSURE_TOLERANCE_KPA = 5.0  # ~0.05 atm, same as the dashboard mock
AIRFLOW_TOLERANCE_MS = 0.02  # 2 cm/s, finer than the 5-20 cm/s steps flame-spread tests vary over
_EPS = 1e-9  # float slack so a delta of exactly the tolerance counts as a match

# key -> (observation column prefix, scenario Dimension, tolerance, display factor, unit, label)
_NUMERIC = {
    "o2": ("o2", Dimension.o2_fraction, O2_TOLERANCE, 100.0, "points", "O2"),
    "pressure": ("pressure_kpa", Dimension.pressure_kpa, PRESSURE_TOLERANCE_KPA, 1.0, "kPa", "pressure"),
    "airflow": ("airflow_ms", Dimension.airflow_ms, AIRFLOW_TOLERANCE_MS, 100.0, "cm/s", "airflow"),
}

TOLERANCES = {
    "o2": {"value": O2_TOLERANCE * 100, "unit": "points"},
    "pressure": {"value": PRESSURE_TOLERANCE_KPA, "unit": "kPa"},
    "airflow": {"value": AIRFLOW_TOLERANCE_MS * 100, "unit": "cm/s"},
    "gravity": {"value": None, "unit": "regime", "rule": "same gravity regime"},
}

CLASS_ORDER = {"exact": 0, "related": 1, "analogue": 2}

# shortcut: ACME BRE detected by its CSV name in the locator; replace with an ingest-set
# `analogue` flag once the normalizer marks different-fuel configurations explicitly.
_ANALOGUE_LOCATOR_MARKERS = ("ACME_BRE",)


def effective_conditions(scenario_conditions: Iterable[Mapping[str, Any]]) -> dict[Dimension, dict[str, Any]]:
    """Per Dimension: override if set, else the suggestion with its status. Missing rows are unknown.

    Each value is {"min", "max", "status"}; status is a ValueStatus or the literal "override".
    """
    out = {d: {"min": None, "max": None, "status": ValueStatus.unknown} for d in Dimension}
    for row in scenario_conditions:
        dim = Dimension(row["dimension"])
        if row.get("override_value") is not None:
            v = float(row["override_value"])
            out[dim] = {"min": v, "max": v, "status": "override"}
            continue
        lo, hi = row.get("suggested_min"), row.get("suggested_max")
        if row.get("suggested_status") == ValueStatus.unknown or (lo is None and hi is None):
            continue
        lo = float(lo if lo is not None else hi)
        hi = float(hi if hi is not None else lo)
        out[dim] = {"min": lo, "max": hi, "status": ValueStatus(row["suggested_status"])}
    return out


def _interval(lo: Any, hi: Any) -> tuple[float, float] | None:
    if lo is None and hi is None:
        return None
    lo = float(lo if lo is not None else hi)
    hi = float(hi if hi is not None else lo)
    return lo, hi


def _fmt(x: float) -> str:
    return f"{round(x, 1):+g}"


def compare_observation(
    scenario: Mapping[Dimension, Mapping[str, Any]],
    env_gravity_regime: str | None,
    observation: Mapping[str, Any],
) -> dict[str, dict[str, Any]]:
    """Compare one observation to the effective scenario (output of effective_conditions).

    Returns {"o2"|"pressure"|"airflow"|"gravity": {"result", "delta", "unit", "text", "tolerance"}}.
    `delta` is observation minus scenario in display units (0 when ranges overlap), None if unknown.
    """
    out: dict[str, dict[str, Any]] = {}
    for key, (col, dim, tol, factor, unit, label) in _NUMERIC.items():
        cond = scenario.get(dim) or {}
        s = _interval(cond.get("min"), cond.get("max"))
        o = _interval(observation.get(f"{col}_min"), observation.get(f"{col}_max"))
        base = {"unit": unit, "tolerance": TOLERANCES[key]}
        if s is None or o is None:
            missing = "scenario" if s is None else "observation"
            out[key] = {**base, "result": "unknown", "delta": None, "text": f"{label} unknown ({missing} not recorded)"}
            continue
        if o[1] < s[0]:
            delta = o[1] - s[0]
        elif o[0] > s[1]:
            delta = o[0] - s[1]
        else:
            delta = 0.0  # ranges overlap
        shown = delta * factor
        if abs(delta) <= tol + _EPS:
            text = f"{label} within ±{TOLERANCES[key]['value']:g} {unit}"
            out[key] = {**base, "result": "match", "delta": round(shown, 3), "text": text}
        else:
            out[key] = {**base, "result": "differs", "delta": round(shown, 3), "text": f"{label} {_fmt(shown)} {unit}"}

    s_g, o_g = env_gravity_regime, observation.get("gravity_regime")
    base = {"unit": "regime", "tolerance": TOLERANCES["gravity"], "delta": None}
    if s_g in (None, GravityRegime.unknown) or o_g in (None, GravityRegime.unknown):
        out["gravity"] = {**base, "result": "unknown", "text": "gravity unknown"}
    elif s_g == o_g:
        out["gravity"] = {**base, "result": "match", "text": f"gravity {o_g}"}
    else:
        out["gravity"] = {**base, "result": "differs", "text": f"gravity {o_g} vs scenario {s_g}"}
    return out


def evidence_class(
    component: Mapping[str, Any],
    observation: Mapping[str, Any],
    related_material_ids: Iterable[str] = (),
) -> tuple[str, str]:
    """Return (class, reason); class is exact | related | analogue | unrelated.

    `related_material_ids` are curator-declared related specimens for this component's material.
    Observation may carry `analogue` (bool) and `label_match_confidence` (the label row's value).
    """
    locator = observation.get("locator") or ""
    if observation.get("analogue") or any(m in locator for m in _ANALOGUE_LOCATOR_MARKERS):
        return "analogue", "different fuel configuration; not material-specific evidence"
    c_mat, o_mat = component.get("material_id"), observation.get("material_id")
    if c_mat is None:
        return "unrelated", "component material identity unmatched; no exact evidence possible"
    if o_mat is None:
        return "unrelated", "observation has no material identity"
    if c_mat == o_mat:
        label_conf = observation.get("label_match_confidence", MatchConfidence.exact)
        if component.get("identity_confidence") == MatchConfidence.exact and label_conf == MatchConfidence.exact:
            return "exact", f"same material identity ({c_mat})"
        return "related", f"same material id ({c_mat}) but identity or label match is only related"
    if o_mat in set(related_material_ids):
        return "related", f"related material ({o_mat}) declared for {c_mat}"
    return "unrelated", f"different material ({o_mat})"


def rank(
    observations: Iterable[Mapping[str, Any]],
    scenario: Mapping[Dimension, Mapping[str, Any]],
    env_gravity_regime: str | None,
    component: Mapping[str, Any],
    related_material_ids: Iterable[str] = (),
) -> list[dict[str, Any]]:
    """Fire observations relevant to a component, ordered for browsing.

    Order: class (exact > related > analogue), then fewer `differs`, then fewer `unknown`, then
    locator. Unrelated and non-fire observations are left out (combustion similarity is never
    applied to other hazards).
    """
    related = tuple(related_material_ids)
    rows = []
    for obs in observations:
        if obs.get("hazard", Hazard.fire) != Hazard.fire:
            continue
        cls, cls_reason = evidence_class(component, obs, related)
        if cls == "unrelated":
            continue
        comp = compare_observation(scenario, env_gravity_regime, obs)
        counts = {r: sum(1 for c in comp.values() if c["result"] == r) for r in ("match", "differs", "unknown")}
        rows.append(
            {
                "observation_id": obs.get("id"),
                "locator": obs.get("locator") or "",
                "evidence_class": cls,
                "comparison": comp,
                "counts": counts,
                "reasons": [cls_reason, *(c["text"] for c in comp.values())],
            }
        )
    rows.sort(key=lambda r: (CLASS_ORDER[r["evidence_class"]], r["counts"]["differs"], r["counts"]["unknown"], r["locator"]))
    for i, r in enumerate(rows, 1):
        r["navigation_rank"] = i
    return rows


def coverage(
    component_results: Iterable[Mapping[str, Any]],
    hazards: Iterable[str] = tuple(Hazard),
    assessments: Mapping[tuple[Any, str], str] | None = None,
    assembly_evidence: Mapping[str, int] | None = None,
) -> dict[str, dict[str, Any]]:
    """Per-hazard evidence status for each component plus the assembly. No verdicts or scores.

    component_results: [{"component_id", "name", "ranked": rank(...) output}].
    assessments: explicit curated statuses keyed (component_id, hazard); component_id None is the
      assembly. These are the only way toxicity/biological leave `unassessed`.
    assembly_evidence: {hazard: number of assembly-level evidence items}.
    """
    assessments = assessments or {}
    assembly_evidence = assembly_evidence or {}
    results = list(component_results)
    out: dict[str, dict[str, Any]] = {}
    for hazard in map(Hazard, hazards):
        comps = []
        for cr in results:
            cid = cr.get("component_id")
            counts = {k: 0 for k in CLASS_ORDER}
            if hazard == Hazard.fire:
                for r in cr.get("ranked", []):
                    counts[r["evidence_class"]] += 1
            explicit = assessments.get((cid, hazard))
            if explicit is not None:
                status, reason = AssessmentStatus(explicit), "explicit assessment input"
            elif hazard != Hazard.fire:
                status, reason = AssessmentStatus.unassessed, "fire comparisons are not evidence for this hazard"
            elif counts["exact"] or counts["related"]:
                status, reason = AssessmentStatus.evidence_found, "exact or related fire observations found"
            elif counts["analogue"]:
                status, reason = AssessmentStatus.gap, "only different-fuel analogues; no material evidence"
            else:
                status, reason = AssessmentStatus.gap, "no fire observations for this component"
            comps.append({"component_id": cid, "name": cr.get("name"), "status": status, "counts": counts, "reason": reason})

        explicit = assessments.get((None, hazard))
        n_asm = assembly_evidence.get(hazard, 0)
        if explicit is not None:
            assembly = {"status": AssessmentStatus(explicit), "evidence_count": n_asm, "reason": "explicit assessment input"}
        elif n_asm:
            assembly = {"status": AssessmentStatus.evidence_found, "evidence_count": n_asm, "reason": "assembly-level evidence supplied"}
        else:
            assembly = {
                "status": AssessmentStatus.gap,
                "evidence_count": 0,
                "reason": "component evidence does not establish assembly performance",
            }

        summary = {s.value: sum(1 for c in comps if c["status"] == s) for s in AssessmentStatus}
        out[hazard.value] = {
            "components": comps,
            "summary": {**summary, "denominator": len(comps), "denominator_label": "components in manifest"},
            "assembly": {"component_id": None, **assembly},
        }
    return out
