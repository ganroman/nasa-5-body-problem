"""End-to-end API tests against the configured database (needs seed data loaded).

Each test runs inside a transaction that is rolled back, so nothing persists.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_session
from app.main import app

SCENARIO_ISS = {"environment_id": "iss", "use_state": "stowed"}
OWN_CARGO = {
    "name": "My instrument",
    "components": [
        {"name": "Enclosure", "original_label": "PMMA cast sheet", "material_id": "pmma-cast-sheet",
         "identity_confidence": "exact"},
        {"name": "Battery", "original_label": "Li-ion"},
    ],
}


@pytest.fixture
def client():
    engine = create_engine(get_settings().database_url)
    with engine.connect() as conn:
        trans = conn.begin()

        def session_override():
            with Session(bind=conn, join_transaction_mode="create_savepoint") as s:
                yield s

        app.dependency_overrides[get_session] = session_override
        yield TestClient(app)
        app.dependency_overrides.clear()
        trans.rollback()


def test_reference_endpoints(client):
    envs = client.get("/environments").json()
    lunar = next(e for e in envs if e["id"] == "lunar-base-nasa")
    # Lunar cabin O2 is unknown, not ISS's 21%.
    assert lunar["spaces"]["cabin"]["o2_fraction"] == {**lunar["spaces"]["cabin"]["o2_fraction"], "min": None, "status": "unknown"}
    assert len(client.get("/routes").json()) == 24
    assert len(client.get("/investigations").json()) == 24
    assert client.get("/cargo/portable-science-instrument").json()["components"][1]["material_id"] is None
    assert client.get("/cargo/nope").status_code == 404


def test_compare_portable_instrument_on_iss(client):
    d = client.post("/scenarios/compare", json={"cargo_slug": "portable-science-instrument", "scenario": SCENARIO_ISS}).json()
    assert d["incomplete_dimensions"] == ["airflow_ms"]  # ISS note gives no airflow number
    battery = next(c for c in d["components"] if c["name"] == "Battery pack")
    assert {r["evidence_class"] for r in battery["ranked"]} == {"analogue"}  # no material evidence
    fire = d["coverage"]["fire"]
    assert fire["assembly"]["status"] == "gap"
    assert d["coverage"]["toxicity"]["summary"]["unassessed"] == len(d["components"])
    for c in d["components"]:
        for r in c["ranked"]:
            assert str(r["observation_id"]) in {str(k) for k in d["observations"]}


def test_override_changes_comparison_not_observations(client):
    base = {"cargo_slug": "portable-science-instrument", "scenario": SCENARIO_ISS}
    a = client.post("/scenarios/compare", json=base).json()
    b = client.post("/scenarios/compare", json={**base, "scenario": {**SCENARIO_ISS, "overrides": {"airflow_ms": 0.2}}}).json()
    assert b["conditions"]["airflow_ms"]["effective"]["status"] == "override"
    assert b["incomplete_dimensions"] == []
    assert a["observations"] == b["observations"]  # measurements never move


def test_validation(client):
    bad_o2 = {"cargo_slug": "portable-science-instrument", "scenario": {**SCENARIO_ISS, "overrides": {"o2_fraction": 21}}}
    assert client.post("/scenarios/compare", json=bad_o2).status_code == 422
    both = {"cargo_slug": "x", "cargo": OWN_CARGO, "scenario": SCENARIO_ISS}
    assert client.post("/scenarios/compare", json=both).status_code == 422
    unknown_mat = {"cargo": {**OWN_CARGO, "components": [{**OWN_CARGO["components"][0], "material_id": "nope"}]},
                   "scenario": SCENARIO_ISS}
    assert client.post("/scenarios/compare", json=unknown_mat).status_code == 422
    no_space = {"cargo": OWN_CARGO, "scenario": {**SCENARIO_ISS, "space": "attic"}}
    assert client.post("/scenarios/compare", json=no_space).status_code == 404


def test_share_create_view_edit(client):
    body = {"cargo": OWN_CARGO, "scenario": {"environment_id": "lunar-base-nasa", "use_state": "charging",
                                             "overrides": {"o2_fraction": 0.3}},
            "forked_from_slug": "portable-science-instrument"}
    created = client.post("/shares", json=body)
    assert created.status_code == 201
    share = created.json()
    slug, token = share["slug"], share["edit_token"]
    viewed = client.get(f"/shares/{slug}").json()
    assert "edit_token" not in viewed
    assert viewed["scenario"]["overrides"] == {"o2_fraction": 0.3}
    assert client.put(f"/shares/{slug}", json=body, headers={"x-edit-token": "nope"}).status_code == 403
    edited = client.put(f"/shares/{slug}", json=body, headers={"x-edit-token": token}).json()
    assert edited["config_version"] == viewed["config_version"] + 1  # new version, old one kept


def test_explain_unavailable_without_si_config(client, monkeypatch):
    for k in ("si_base_url", "si_api_key", "si_model"):
        monkeypatch.setattr(get_settings(), k, None)
    d = client.post("/scenarios/explain", json={"cargo_slug": "portable-science-instrument", "component_index": 0,
                                                "scenario": SCENARIO_ISS}).json()
    assert d["explanation"]["status"] == "unavailable"
    assert {s["source_id"] for s in d["sources"][:2]} == {"scenario-conditions", "computed-coverage"}


def test_export_matches_compare_and_reopens(client):
    body = {"cargo_slug": "portable-science-instrument", "scenario": {**SCENARIO_ISS, "overrides": {"o2_fraction": 0.25}}}
    compared = client.post("/scenarios/compare", json=body).json()
    exported = client.post("/passports/export", json=body).json()
    passport = client.get(f"/passports/{exported['id']}").json()["passport"]
    assert passport["coverage"] == compared["coverage"]
    assert passport["conditions"]["o2_fraction"]["effective"] == compared["conditions"]["o2_fraction"]["effective"]
    assert passport["limitations"] and passport["si_disclosure"]
    assert client.get("/passports/not-a-uuid").status_code == 404


def test_si_tools_search_and_source_lookup(client):
    from app import scenario as sc
    from app.db import get_session as real_get_session

    session = next(app.dependency_overrides[real_get_session]())
    cargo = sc.seeded_cargo(session, "portable-science-instrument")
    result = sc.compute(session, cargo, SCENARIO_ISS)
    tools = {t["name"]: t["fn"] for t in sc.si_tools(session, result, cargo, 0)}
    found = tools["search_observations"](investigation="PSI-26")
    bass = found["records"]
    assert found["note"] == f"showing {len(bass)} of 121 matching records"
    assert 0 < len(bass) <= sc.MAX_TOOL_RECORDS and all(r["source_id"].startswith("obs-") for r in bass)
    assert "not linked to a material identity" in bass[0]["excerpt"]
    assert "PSI-26" in tools["get_source"]("psi-26-bass")[0]["excerpt"]
    assert tools["get_source"]("nope") == []

    moved = tools["compare_in_environment"]("lunar-base-nasa")[0]
    assert moved["source_id"] == "compare-lunar-base-nasa-cabin"
    assert "gravity lunar" in moved["excerpt"] and "o2_fraction unknown" in moved["excerpt"]
    assert "o2_fraction 0.21 (sourced) -> unknown" in moved["excerpt"] and "gravity microgravity -> lunar" in moved["excerpt"]
    summary = tools["get_cargo_summary"]()[0]["excerpt"]
    assert "Battery pack" in summary and "whole assembly: fire gap" in summary
    with pytest.raises(sc.NotFound):
        tools["compare_in_environment"]("atlantis")
    with pytest.raises(ValueError):
        tools["compare_in_environment"]("iss", overrides={"o2_fraction": 21})


def test_share_creation_is_rate_limited_per_ip(client, monkeypatch):
    from app import api

    monkeypatch.setattr(api, "SHARES_PER_IP_PER_HOUR", 2)
    body = {"cargo": OWN_CARGO, "scenario": SCENARIO_ISS}
    ip = {"x-forwarded-for": "203.0.113.7"}
    assert client.post("/shares", json=body, headers=ip).status_code == 201
    assert client.post("/shares", json=body, headers=ip).status_code == 201
    assert client.post("/shares", json=body, headers=ip).status_code == 429
    assert client.post("/shares", json=body, headers={"x-forwarded-for": "198.51.100.1"}).status_code == 201

