"""Load seed YAML + local PSI data into the database. Idempotent (upserts); run as a one-off:

    uv run python -m app.ingest.load [--data-dir ../data] [--seed-dir seed]
"""

import argparse
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db import get_engine
from app.enums import Origin
from app.ingest import psi
from app.ingest.seed_yaml import load_seed
from app.models import (
    CargoConfig,
    CargoItem,
    Component,
    Environment,
    EnvironmentCondition,
    Finding,
    FindingLink,
    Investigation,
    Material,
    MaterialLabel,
    Observation,
    ReferencePassage,
    Route,
    Source,
    route_sources,
)


def upsert(session: Session, model, rows: list[dict[str, Any]], keys: list[str]) -> None:
    if not rows:
        return
    table = model.__table__
    stmt = insert(table).values(rows)
    update = {c: stmt.excluded[c] for c in rows[0] if c not in keys}
    session.execute(stmt.on_conflict_do_update(index_elements=keys, set_=update) if update else stmt.on_conflict_do_nothing())


def load(session: Session, data_dir: Path, seed_dir: Path) -> dict[str, int]:
    seed = load_seed(seed_dir)
    psi_sources, investigations = psi.load_investigations(data_dir)
    labels, psi_obs = psi.load_observations(data_dir)

    upsert(session, Source, psi_sources + [s.model_dump() for s in seed.sources], ["id"])
    upsert(session, Investigation, investigations, ["accession"])
    upsert(session, Material, [m.model_dump() for m in seed.materials], ["id"])

    # PSI observations: resolve label ids after upserting labels.
    upsert(session, MaterialLabel, labels, ["raw_label", "source_id"])
    label_ids = {(r.raw_label, r.source_id): r.id for r in session.scalars(select(MaterialLabel))}
    obs_rows = []
    for o in psi_obs:
        row = {k: v for k, v in o.items() if k != "raw_label"}
        row["label_id"] = label_ids.get((o.get("raw_label"), o["source_id"]))
        obs_rows.append(row)

    # Earth standard tests (MOC/LOI) from material_tests.yaml.
    for t in seed.material_tests:
        obs_rows.append({
            "source_id": t.source_id, "investigation_accession": None, "locator": t.locator,
            "test_method": t.test_method, "hazard": "fire", "label_id": None, "material_id": t.material_id,
            "is_summary_row": False, "o2_min": t.o2_fraction, "o2_max": t.o2_fraction, "o2_raw": t.o2_raw,
            "pressure_kpa_min": t.pressure_kpa, "pressure_kpa_max": t.pressure_kpa, "pressure_raw": t.pressure_raw,
            "airflow_ms_min": None, "airflow_ms_max": None, "airflow_raw": None, "flow_direction": None,
            "gravity_regime": t.gravity_regime, "gravity_g": None, "geometry": None,
            "outcome": t.outcome.model_dump(), "raw": t.model_dump(mode="json"),
        })
    upsert(session, Observation, obs_rows, ["source_id", "locator"])

    # Environments and their per-space conditions.
    upsert(session, Environment, [e.model_dump(exclude={"conditions"}) for e in seed.environments], ["id"])
    cond_rows = [
        {"environment_id": e.id, "space": space, "dimension": dim, **c.model_dump()}
        for e in seed.environments for space, dims in e.conditions.items() for dim, c in dims.items()
    ]
    upsert(session, EnvironmentCondition, cond_rows, ["environment_id", "space", "dimension"])

    upsert(session, Route, [r.model_dump(exclude={"source_ids", "prototype_status"}) for r in seed.routes], ["id"])
    session.execute(delete(route_sources).where(route_sources.c.route_id.in_([r.id for r in seed.routes])))
    session.execute(route_sources.insert(), [{"route_id": r.id, "source_id": s} for r in seed.routes for s in r.source_ids])

    upsert(session, Finding, [f.model_dump(exclude={"material_ids"}) for f in seed.findings], ["id"])
    for f in seed.findings:
        session.execute(delete(FindingLink).where(FindingLink.finding_id == f.id))
        session.add_all(FindingLink(finding_id=f.id, material_id=m) for m in f.material_ids)
    upsert(session, ReferencePassage, [p.model_dump() for p in seed.reference_passages], ["id"])

    # Seeded cargo: replace components of the seeded config. Users edit forks, never seeded rows.
    for c in seed.cargo:
        upsert(session, CargoItem, [{"slug": c.slug, "name": c.name, "purpose": c.purpose,
                                     "provenance": c.provenance, "origin": Origin.seeded}], ["slug"])
        item_id = session.scalar(select(CargoItem.id).where(CargoItem.slug == c.slug))
        cfg = c.config
        upsert(session, CargoConfig, [{"item_id": item_id, "version": cfg.version, "assembly_notes": cfg.assembly_notes,
                                       "supported_use_states": [str(u) for u in cfg.supported_use_states]}],
               ["item_id", "version"])
        config_id = session.scalar(select(CargoConfig.id).where(CargoConfig.item_id == item_id, CargoConfig.version == cfg.version))
        session.execute(delete(Component).where(Component.config_id == config_id))
        session.add_all(Component(config_id=config_id, position=i, **comp.model_dump()) for i, comp in enumerate(cfg.components))

    session.commit()
    return {
        "sources": len(psi_sources) + len(seed.sources), "investigations": len(investigations),
        "materials": len(seed.materials), "material_labels": len(labels), "observations": len(obs_rows),
        "environments": len(seed.environments), "environment_conditions": len(cond_rows),
        "routes": len(seed.routes), "cargo_items": len(seed.cargo), "findings": len(seed.findings),
        "reference_passages": len(seed.reference_passages),
    }


def main() -> None:
    here = Path(__file__).resolve().parents[2]
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--data-dir", type=Path, default=here.parent / "data")
    ap.add_argument("--seed-dir", type=Path, default=here / "seed")
    args = ap.parse_args()
    with Session(get_engine()) as session:
        for name, n in load(session, args.data_dir, args.seed_dir).items():
            print(f"{name:24} {n}")


if __name__ == "__main__":
    main()
