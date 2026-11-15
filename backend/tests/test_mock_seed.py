"""Mock demo data (backend/seed/mock.py): builders are valid and every row is marked. No database needed."""

import importlib.util
import random
import re
import sys
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
sys.path.insert(0, str(SEED_DIR))
_spec = importlib.util.spec_from_file_location("seed_mock", SEED_DIR / "mock.py")
mock = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mock)
md = mock.md

REAL_ENVS = {"earth-logistics"}


def test_cargo_count_and_shares():
    cargo = mock.build_cargo()
    assert 40 <= len(cargo) <= 80
    assert len({c["slug"] for c in cargo}) == len(cargo)
    for c in cargo:
        assert c["slug"].startswith("mock-")
        assert abs(sum(k["mass_share"] for k in c["components"]) - 1) < 1e-9, c["slug"]
        for k in c["components"]:
            assert (k["material_id"] is None) == (k["identity_confidence"] == "unmatched")


def test_cargo_materials_exist():
    known = {m["id"] for m in mock.build_materials()} | {v[0] for v in md.REAL_MATERIALS.values()}
    for c in mock.build_cargo():
        for k in c["components"]:
            assert k["material_id"] is None or k["material_id"] in known, (c["slug"], k["material_id"])


def test_observations_valid_and_marked():
    rows = mock.build_observations(random.Random(mock.SEED))
    assert len(rows) >= 300
    keys = {(r["source_id"], r["locator"]) for r in rows}
    assert len(keys) == len(rows)
    sources = {s["id"] for s in mock.build_sources_and_investigations()[0]}
    accessions = {i["accession"] for i in mock.build_sources_and_investigations()[1]}
    materials = {m["id"] for m in mock.build_materials()}
    for r in rows:
        assert r["source_id"].startswith("mock-") and r["source_id"] in sources
        assert r["raw"]["mock"] is True
        assert r["investigation_accession"] is None or r["investigation_accession"] in accessions
        assert r["material_id"] is None or r["material_id"] in materials
        for p in ("o2", "pressure_kpa", "airflow_ms"):
            lo, hi = r[f"{p}_min"], r[f"{p}_max"]
            assert (lo is None) == (hi is None)
            if lo is not None:
                assert 0 <= lo <= hi
        if r["o2_max"] is not None:
            assert r["o2_max"] <= 1


def test_builders_are_deterministic():
    a = mock.build_observations(random.Random(mock.SEED))
    b = mock.build_observations(random.Random(mock.SEED))
    assert a == b


def test_environments_and_routes():
    envs, conds = mock.build_environments()
    ids = {e["id"] for e in envs}
    assert all(i.startswith("mock-") for i in ids)
    for c in conds:
        assert (c["status"] == "unknown") == (c["value_min"] is None and c["value_max"] is None)
        if c["value_min"] is not None:
            assert c["value_min"] <= c["value_max"]
    assert len({(c["environment_id"], c["space"], c["dimension"]) for c in conds}) == len(conds)
    routes, links = mock.build_routes()
    assert len(routes) >= 20
    for r in routes:
        assert re.fullmatch(r"M\d+", r["id"]) and len(r["id"]) <= 8
        assert all(e in ids or e in REAL_ENVS for e in (r["from_env"], r["to_env"])), r


def test_findings_marked_and_linked():
    findings, links, passages = mock.build_findings(random.Random(mock.SEED))
    ids = {f["id"] for f in findings}
    assert ids and all(i.startswith("mock-") for i in ids)
    assert {link["finding_id"] for link in links} == ids
    assert all(p["id"].startswith("mock-") for p in passages)


def test_every_scenario_has_environment_and_cargo():
    env_ids = {f"mock-{e[0]}" for e in md.ENVIRONMENTS}
    slugs = {c["slug"] for c in mock.build_cargo()}
    for slug, env, space, _use, route, _ov in mock.PASSPORTS:
        assert f"mock-{slug}" in slugs and env in env_ids
        assert any(r[0] == route for r in md.ROUTES)
        assert any(e[0] == env[5:] and space in e[7] for e in md.ENVIRONMENTS), (env, space)
