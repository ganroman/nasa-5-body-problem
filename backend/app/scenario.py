"""Turn a cargo + scenario request into comparisons, coverage and SI inputs.

One function (`compute`) feeds the compare endpoint, the SI explanation and the passport export,
so all three always show the same numbers (build-plan section 7).
"""

from decimal import Decimal
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.enums import Dimension, Hazard
from app.logic.compare import TOLERANCES, coverage, effective_conditions, rank
from app.models import (
    CargoConfig,
    CargoItem,
    Environment,
    EnvironmentCondition,
    Finding,
    FindingLink,
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
    "geometry", "outcome",
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


def _obs_excerpt(o: dict[str, Any], material: str | None) -> str:
    """Deterministic text of what the record says, so the SI can only restate recorded values."""

    def rng(lo, hi, raw, scale, unit):
        if lo is None:
            return f"not recorded{f' (raw: {raw})' if raw else ''}"
        return f"{lo * scale:g}{unit}" if lo == hi else f"{lo * scale:g}-{hi * scale:g}{unit}"

    parts = [
        f"test method {o['test_method']}",
        f"material {material or 'not identified'}",
        f"O2 {rng(o['o2_min'], o['o2_max'], o['o2_raw'], 100, '%')}",
        f"pressure {rng(o['pressure_kpa_min'], o['pressure_kpa_max'], o['pressure_raw'], 1, ' kPa')}",
        f"airflow {rng(o['airflow_ms_min'], o['airflow_ms_max'], o['airflow_raw'], 100, ' cm/s')}",
        f"gravity {o['gravity_regime']}",
        f"outcome {o['outcome'] if o['outcome'] else 'not recorded'}",
    ]
    if o["is_summary_row"]:
        parts.append("summary row, not an individual test")
    return "; ".join(parts) + "."


def si_inputs(result: dict[str, Any], cargo: dict[str, Any], component_index: int, hazard: str,
              question: str | None, max_records: int = 8) -> dict[str, Any]:
    """Evidence bundle for app.si.explain: only computed comparisons and recorded/curated text."""
    comp = result["components"][component_index]
    ranked = comp["ranked"][:max_records] if hazard == Hazard.fire else []
    sources = []
    for r in ranked:
        o = result["observations"][r["observation_id"]]
        src = result["sources"].get(o["source_id"], {})
        sources.append({
            "source_id": f"obs-{o['id']}",
            "excerpt": _obs_excerpt(o, o["material_id"]),
            "locator": f"{src.get('title', o['source_id'])}, {o['locator']}",
        })
    for f in result["findings"]:
        if f["material_id"] == comp.get("material_id") and f["hazard"] == hazard:
            sources.append({"source_id": f"finding-{f['id']}", "excerpt": f["excerpt"], "locator": f["locator"]})
    return {
        "cargo": {"name": cargo["name"], "provenance": cargo.get("provenance")},
        "component": {k: comp.get(k) for k in ("name", "original_label", "material_id", "identity_confidence")},
        "hazard": hazard,
        "scenario": {
            "environment": result["environment"],
            "use_state": result["use_state"],
            "conditions": {d: c["effective"] for d, c in result["conditions"].items()},
            "incomplete_dimensions": result["incomplete_dimensions"],
        },
        "comparisons": [
            {"source_id": f"obs-{r['observation_id']}", "evidence_class": r["evidence_class"], "reasons": r["reasons"]}
            for r in ranked
        ],
        "coverage": {
            "component": result["coverage"][hazard]["components"][component_index],
            "assembly": result["coverage"][hazard]["assembly"],
        },
        "sources": sources,
        **({"question": question} if question else {}),
    }

