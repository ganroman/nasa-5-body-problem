"""Turn a cargo + scenario request into comparisons, coverage and SI inputs.

One function (`compute`) feeds the compare endpoint, the SI explanation and the passport export,
so all three always show the same numbers (build-plan section 7).
"""

from decimal import Decimal
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.enums import Dimension, Hazard
from app.logic.compare import TOLERANCES, compare_observation, coverage, effective_conditions, evidence_class, rank
from app.models import (
    CargoConfig,
    CargoItem,
    Environment,
    EnvironmentCondition,
    Finding,
    FindingLink,
    Investigation,
    MaterialLabel,
    Observation,
    ReviewStatus,
    Source,
)

# Dimensions the evidence map and comparisons use; a scenario missing any of them is incomplete.
CORE_DIMENSIONS = (Dimension.o2_fraction, Dimension.pressure_kpa, Dimension.airflow_ms)

OBSERVATION_FIELDS = (
    "id", "source_id", "investigation_accession", "locator", "test_method", "hazard", "material_id",
    "is_summary_row", "o2_min", "o2_max", "o2_raw", "pressure_kpa_min", "pressure_kpa_max", "pressure_raw",
    "airflow_ms_min", "airflow_ms_max", "airflow_raw", "flow_direction", "gravity_regime", "gravity_g",
    "geometry", "outcome", "raw",  # raw: the source row, shown next to normalized values
)


class NotFound(LookupError):
    pass


def _plain(v: Any) -> Any:
    # Numeric columns come back as Decimal; JSONB caching and the SI payload need floats.
    return float(v) if isinstance(v, Decimal) else v


def row_dict(obj: Any, fields: tuple[str, ...]) -> dict[str, Any]:
    return {f: _plain(getattr(obj, f)) for f in fields}


def seeded_cargo(session: Session, slug: str) -> dict[str, Any]:
    item = session.scalar(select(CargoItem).where(CargoItem.slug == slug))
    if item is None or not item.configs:
        raise NotFound(f"cargo '{slug}' not found")
    return cargo_from_config(item, max(item.configs, key=lambda c: c.version))


def cargo_from_config(item: CargoItem, config: CargoConfig) -> dict[str, Any]:
    return {
        "name": item.name,
        "purpose": item.purpose,
        "provenance": item.provenance,
        "origin": item.origin,
        "slug": item.slug,
        "config_version": config.version,
        "assembly_notes": config.assembly_notes,
        "supported_use_states": list(config.supported_use_states),
        "components": [
            {
                "name": c.name,
                "original_label": c.original_label,
                "material_id": c.material_id,
                "identity_confidence": c.identity_confidence,
                "mass_share": _plain(c.mass_share),
            }
            for c in config.components
        ],
    }


def suggested_conditions(session: Session, environment_id: str, space: str) -> list[dict[str, Any]]:
    rows = session.scalars(
        select(EnvironmentCondition).where(
            EnvironmentCondition.environment_id == environment_id, EnvironmentCondition.space == space
        )
    ).all()
    return [
        {
            "dimension": r.dimension,
            "suggested_min": _plain(r.value_min),
            "suggested_max": _plain(r.value_max),
            "suggested_status": r.status,
            "suggested_source_id": r.source_id,
            "locator": r.locator,
            "note": r.note,
        }
        for r in rows
    ]


def compute(session: Session, cargo: dict[str, Any], scenario: dict[str, Any]) -> dict[str, Any]:
    """Comparisons, ranked evidence and per-hazard coverage for every component."""
    env = session.get(Environment, scenario["environment_id"])
    if env is None:
        raise NotFound(f"environment '{scenario['environment_id']}' not found")
    space = scenario.get("space") or "cabin"
    suggested = suggested_conditions(session, env.id, space)
    if not suggested:
        raise NotFound(f"environment '{env.id}' has no space '{space}'")
    overrides = scenario.get("overrides") or {}
    cond_rows = [{**s, "override_value": overrides.get(s["dimension"])} for s in suggested]
    effective = effective_conditions(cond_rows)

    components = cargo["components"]
    material_ids = {c["material_id"] for c in components if c.get("material_id")}
    observations = [
        row_dict(o, OBSERVATION_FIELDS)
        for o in session.scalars(
            select(Observation).where(
                Observation.hazard == Hazard.fire,
                or_(Observation.material_id.in_(material_ids), Observation.locator.contains("ACME_BRE")),
            )
        )
    ]

    results = []
    for i, comp in enumerate(components):
        ranked = rank(observations, effective, env.gravity_regime, comp)
        results.append({"component_id": i, "name": comp["name"], "ranked": ranked})

    used_ids = {r["observation_id"] for cr in results for r in cr["ranked"]}
    used_obs = {o["id"]: o for o in observations if o["id"] in used_ids}
    findings = _findings_for(session, material_ids)
    source_ids = {o["source_id"] for o in used_obs.values()} | {f["source_id"] for f in findings}
    source_ids |= {s["suggested_source_id"] for s in suggested if s["suggested_source_id"]}
    if env.source_id:
        source_ids.add(env.source_id)

    return {
        "environment": {
            "id": env.id, "name": env.name, "domain": env.domain, "maturity": env.maturity,
            "gravity_regime": env.gravity_regime, "gravity_g": _plain(env.gravity_g), "space": space,
        },
        "use_state": scenario["use_state"],
        "route_id": scenario.get("route_id"),
        "conditions": {
            str(s["dimension"]): {
                **{k: s[k] for k in ("suggested_min", "suggested_max", "suggested_status", "suggested_source_id", "locator", "note")},
                "override": overrides.get(s["dimension"]),
                "effective": effective[Dimension(s["dimension"])],
            }
            for s in suggested
        },
        "incomplete_dimensions": [str(d) for d in CORE_DIMENSIONS if effective[d]["min"] is None],
        "components": [
            {**comp, "component_index": cr["component_id"], "ranked": cr["ranked"]}
            for comp, cr in zip(components, results)
        ],
        "coverage": coverage(results),
        "observations": used_obs,
        "findings": findings,
        "sources": _sources(session, source_ids),
        "tolerances": TOLERANCES,
        "limitations": LIMITATIONS,
    }


def _findings_for(session: Session, material_ids: set[str]) -> list[dict[str, Any]]:
    if not material_ids:
        return []
    rows = session.execute(
        select(Finding, FindingLink.material_id)
        .join(FindingLink)
        .where(FindingLink.material_id.in_(material_ids), Finding.review_status == ReviewStatus.verified)
    ).all()
    return [
        {"id": f.id, "material_id": m, "claim": f.claim, "excerpt": f.excerpt, "locator": f.locator,
         "source_id": f.source_id, "hazard": f.hazard, "limits": f.limits}
        for f, m in rows
    ]


def _sources(session: Session, ids: set[str]) -> dict[str, dict[str, Any]]:
    rows = session.scalars(select(Source).where(Source.id.in_(ids))).all() if ids else []
    return {s.id: {"title": s.title, "kind": s.kind, "doi": s.doi, "url": s.url, "revision": s.revision} for s in rows}


LIMITATIONS = [
    "Evidence comparison only: this is not a safety approval, certification or risk rating.",
    "Unknown values are not matches or mismatches; missing evidence is not evidence of no hazard.",
    "Component evidence does not establish assembly performance.",
    "Fire comparisons are not evidence for toxicity or biological hazards.",
    "Microgravity and 1 g results do not bound lunar or Martian behaviour.",
    "ACME BRE is a gas burner emulating solids: an analogue, not material evidence.",
    "Cargo items and mass shares are illustrative unless marked real.",
]


def _obs_excerpt(o: dict[str, Any], evidence_class: str, class_reason: str) -> str:
    """Deterministic text of what the record says, so the SI can only restate recorded values."""

    def rng(lo, hi, raw, scale, unit):
        if lo is None:
            return f"not recorded{f' (raw: {raw})' if raw else ''}"
        return f"{lo * scale:g}{unit}" if lo == hi else f"{lo * scale:g}-{hi * scale:g}{unit}"

    if evidence_class == "analogue":
        fuel = (o.get("raw") or {}).get("Fuel Bottle")
        subject = f"gas-burner analogue (fuel: {fuel or 'not recorded'}), not a solid material"
    elif o.get("material_id"):
        subject = f"material {o['material_id']}"
    else:
        subject = f"material label '{o.get('raw_label') or 'blank'}' as written in the source (not linked to a material identity)"
    parts = [
        f"evidence class {evidence_class} ({class_reason})",
        f"test method {o['test_method']}",
        subject,
        f"O2 {rng(o['o2_min'], o['o2_max'], o['o2_raw'], 100, '%')}",
        f"pressure {rng(o['pressure_kpa_min'], o['pressure_kpa_max'], o['pressure_raw'], 1, ' kPa')}",
        f"airflow {rng(o['airflow_ms_min'], o['airflow_ms_max'], o['airflow_raw'], 100, ' cm/s')}",
        f"gravity {o['gravity_regime']}",
        f"outcome {_fmt_outcome(o['outcome'])}",
    ]
    if o["is_summary_row"]:
        parts.append("summary row (several tests on one day), not an individual test")
    return "; ".join(parts) + "."


def _fmt_outcome(outcome: dict[str, Any] | None) -> str:
    if not outcome:
        return "not recorded"
    if "loi_fraction" in outcome:
        return f"limiting oxygen index (LOI, ASTM D2863) {outcome['loi_fraction'] * 100:g}% O2"
    if "passed" in outcome:
        return "passed" if outcome["passed"] else "failed"
    return ", ".join(f"{k} {v}" for k, v in outcome.items() if not k.endswith("_raw"))


def _fmt_condition(dim: str, c: dict[str, Any]) -> str:
    e = c["effective"]
    if e["min"] is None:
        return f"{dim} unknown"
    val = f"{e['min']:g}" if e["min"] == e["max"] else f"{e['min']:g}-{e['max']:g}"
    src = f", source {c['suggested_source_id']}" if c.get("suggested_source_id") and e["status"] != "override" else ""
    return f"{dim} {val} ({e['status']}{src})"


def si_inputs(result: dict[str, Any], cargo: dict[str, Any], component_index: int, hazard: str,
              question: str | None, max_records: int = 8, max_analogues: int = 3) -> dict[str, Any]:
    """Evidence bundle for app.si.explain: only computed comparisons and recorded/curated text.

    Besides test records, the scenario conditions and the computed coverage are supplied as
    citable records, so statements about them cite the right thing.
    """
    comp = result["components"][component_index]
    ranked = []
    if hazard == Hazard.fire:
        material = [r for r in comp["ranked"] if r["evidence_class"] != "analogue"]
        analogues = [r for r in comp["ranked"] if r["evidence_class"] == "analogue"]
        ranked = (material + analogues[:max_analogues])[:max_records]
    env = result["environment"]
    cov = result["coverage"][hazard]
    cov_comp = cov["components"][component_index]
    sources = [
        {
            "source_id": "scenario-conditions",
            "excerpt": f"Scenario: {env['name']} ({env['space']}), gravity {env['gravity_regime']}, use state "
                       f"{result['use_state']}; " + "; ".join(_fmt_condition(d, c) for d, c in result["conditions"].items()) + ".",
            "locator": "Computed from the selected environment's conditions and user overrides",
        },
        {
            "source_id": "computed-coverage",  # also carries component identity
            "excerpt": f"Component {comp['name']}: label '{comp['original_label']}', material "
                       f"{comp.get('material_id') or 'not identified'}, identity {comp['identity_confidence']}. "
                       f"{hazard} evidence status: {cov_comp['status']} ({cov_comp['reason']}); "
                       f"whole assembly: {cov['assembly']['status']} ({cov['assembly']['reason']}).",
            "locator": "Computed by the Cargo Passport comparison logic",
        },
    ]
    for r in ranked:
        o = result["observations"][r["observation_id"]]
        src = result["sources"].get(o["source_id"], {})
        sources.append({
            "source_id": f"obs-{o['id']}",
            "excerpt": _obs_excerpt(o, r["evidence_class"], r["reasons"][0]),
            "locator": f"{src.get('title', o['source_id'])}, {o['locator']}",
        })
    for f in result["findings"]:
        if f["material_id"] == comp.get("material_id") and f["hazard"] == hazard:
            sources.append({"source_id": f"finding-{f['id']}", "excerpt": f["excerpt"], "locator": f["locator"]})
    return {
        "cargo": {"name": cargo["name"], "provenance": cargo.get("provenance")},
        "component": {k: comp.get(k) for k in ("name", "original_label", "material_id", "identity_confidence")},
        "hazard": hazard,
        "comparisons": [
            {"source_id": f"obs-{r['observation_id']}", "evidence_class": r["evidence_class"], "reasons": r["reasons"]}
            for r in ranked
        ],
        "sources": sources,
        **({"question": question} if question else {}),
    }


MAX_TOOL_RECORDS = 10


def si_tools(session: Session, result: dict[str, Any], component_index: int) -> list[dict[str, Any]]:
    """Read-only lookups the SI may call. Each returns records in the same deterministic text
    format as the evidence bundle, so the model can only restate recorded values."""
    comp = result["components"][component_index]
    scenario = {Dimension(d): c["effective"] for d, c in result["conditions"].items()}
    gravity = result["environment"]["gravity_regime"]

    def obs_record(o: Observation, raw_label: str | None) -> dict[str, Any]:
        od = {**row_dict(o, OBSERVATION_FIELDS), "raw_label": raw_label}
        cls, reason = evidence_class(comp, od)
        texts = [c["text"] for c in compare_observation(scenario, gravity, od).values()]
        src = session.get(Source, o.source_id)
        return {
            "source_id": f"obs-{o.id}",
            "excerpt": _obs_excerpt(od, cls, reason) + " Compared with the scenario: " + "; ".join(texts) + ".",
            "locator": f"{src.title if src else o.source_id}, {o.locator}",
        }

    def search_observations(material_id: str | None = None, investigation: str | None = None,
                            o2_min_percent: float | None = None, o2_max_percent: float | None = None,
                            gravity_regime: str | None = None) -> list[dict[str, Any]]:
        q = select(Observation, MaterialLabel.raw_label).outerjoin(MaterialLabel, Observation.label_id == MaterialLabel.id)
        q = q.where(Observation.hazard == Hazard.fire)
        if material_id:
            q = q.where(Observation.material_id == material_id)
        if investigation:
            q = q.where(Observation.investigation_accession == investigation.upper())
        if o2_min_percent is not None:
            q = q.where(Observation.o2_max >= o2_min_percent / 100)
        if o2_max_percent is not None:
            q = q.where(Observation.o2_min <= o2_max_percent / 100)
        if gravity_regime:
            q = q.where(Observation.gravity_regime == gravity_regime)
        total = session.scalar(select(func.count()).select_from(q.subquery()))
        rows = session.execute(q.order_by(Observation.id).limit(MAX_TOOL_RECORDS)).all()
        records = [obs_record(o, label) for o, label in rows]
        return {"records": records, "note": f"showing {len(records)} of {total} matching records"}

    def get_source(source_id: str) -> list[dict[str, Any]]:
        src = session.get(Source, source_id)
        if src is None:
            return []
        inv = session.scalar(select(Investigation).where(Investigation.source_id == source_id))
        parts = [f"{src.kind}: {src.title}"]
        if src.doi:
            parts.append(f"DOI {src.doi}")
        if inv:
            parts += [f"investigation {inv.accession} ({inv.acronym or 'no acronym'})", f"objective: {inv.objective}",
                      f"hardware: {inv.hardware}", f"normalization: {inv.normalization_status}"]
        return [{"source_id": src.id, "excerpt": "; ".join(p for p in parts if p) + ".", "locator": src.url or src.id}]

    def list_findings(material_id: str) -> list[dict[str, Any]]:
        return [
            {"source_id": f"finding-{f['id']}", "excerpt": f"{f['excerpt']} (limits: {f['limits']})", "locator": f["locator"]}
            for f in _findings_for(session, {material_id})
        ]

    opt = lambda t: {"type": [t, "null"]}  # noqa: E731
    return [
        {
            "name": "search_observations",
            "description": "Find recorded fire test records. Filters combine with AND. Returns at most 10 records with "
                           "their recorded values and a comparison with the current scenario.",
            "parameters": {"type": "object", "properties": {
                "material_id": {**opt("string"), "description": "Material identity id, e.g. pmma-cast-sheet"},
                "investigation": {**opt("string"), "description": "PSI accession, e.g. PSI-26 (BASS), PSI-98 (Saffire-I)"},
                "o2_min_percent": {**opt("number"), "description": "Records whose O2 range reaches at least this %"},
                "o2_max_percent": {**opt("number"), "description": "Records whose O2 range starts at or below this %"},
                "gravity_regime": {**opt("string"), "enum": ["earth", "microgravity", "lunar", "martian", None]},
            }},
            "fn": search_observations,
        },
        {
            "name": "get_source",
            "description": "Details of one source by its id (e.g. psi-26-bass): title, DOI and, for PSI investigations, "
                           "objective and hardware.",
            "parameters": {"type": "object", "properties": {"source_id": {"type": "string"}}, "required": ["source_id"]},
            "fn": get_source,
        },
        {
            "name": "list_findings",
            "description": "Verified curated findings for a material id, with excerpt, locator and limits.",
            "parameters": {"type": "object", "properties": {"material_id": {"type": "string"}}, "required": ["material_id"]},
            "fn": list_findings,
        },
    ]
