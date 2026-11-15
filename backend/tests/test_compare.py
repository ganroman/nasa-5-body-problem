from app.enums import Dimension
from app.logic.compare import (
    O2_TOLERANCE,
    PRESSURE_TOLERANCE_KPA,
    compare_observation,
    coverage,
    effective_conditions,
    evidence_class,
    rank,
)

PMMA = {"material_id": "pmma-cast-sheet", "identity_confidence": "exact"}


def scen(o2=0.21, kpa=101.3, air=0.1):
    rows = []
    for dim, v in ((Dimension.o2_fraction, o2), (Dimension.pressure_kpa, kpa), (Dimension.airflow_ms, air)):
        if v is None:
            rows.append({"dimension": dim, "suggested_status": "unknown"})
        else:
            rows.append({"dimension": dim, "suggested_min": v, "suggested_max": v, "suggested_status": "sourced"})
    return effective_conditions(rows)


def obs(locator="a.csv#row=1", o2=0.21, kpa=101.3, air=0.1, g="microgravity", **kw):
    return {
        "id": locator,
        "locator": locator,
        "material_id": "pmma-cast-sheet",
        "hazard": "fire",
        "o2_min": o2,
        "o2_max": o2,
        "pressure_kpa_min": kpa,
        "pressure_kpa_max": kpa,
        "airflow_ms_min": air,
        "airflow_ms_max": air,
        "gravity_regime": g,
        **kw,
    }


def test_override_beats_suggestion_and_missing_stays_unknown():
    eff = effective_conditions(
        [{"dimension": "o2_fraction", "suggested_min": 0.21, "suggested_max": 0.21, "suggested_status": "sourced", "override_value": 0.3}]
    )
    assert eff[Dimension.o2_fraction] == {"min": 0.3, "max": 0.3, "status": "override"}
    assert eff[Dimension.pressure_kpa]["status"] == "unknown"
    assert eff[Dimension.pressure_kpa]["min"] is None


def test_unknown_is_neither_match_nor_mismatch():
    r = compare_observation(scen(kpa=None), "unknown", obs(o2=None))
    for key in ("o2", "pressure", "gravity"):
        assert r[key]["result"] == "unknown"
        assert r[key]["delta"] is None
    ranked = rank([obs(o2=None)], scen(kpa=None), "unknown", PMMA)
    assert ranked[0]["counts"] == {"match": 1, "differs": 0, "unknown": 3}


def test_range_overlap_is_match():
    eff = effective_conditions(
        [{"dimension": "o2_fraction", "suggested_min": 0.20, "suggested_max": 0.22, "suggested_status": "estimate"}]
    )
    o = obs(o2=None, o2_min=0.215, o2_max=0.30)
    r = compare_observation(eff, "microgravity", o)
    assert r["o2"]["result"] == "match" and r["o2"]["delta"] == 0


def test_tolerance_edges_and_signed_display_delta():
    at_edge = compare_observation(scen(), "earth", obs(o2=0.21 + O2_TOLERANCE, kpa=101.3 - PRESSURE_TOLERANCE_KPA))
    assert at_edge["o2"]["result"] == "match"
    assert at_edge["pressure"]["result"] == "match"
    beyond = compare_observation(scen(), "earth", obs(o2=0.30, kpa=70.3, air=0.05))
    assert beyond["o2"]["result"] == "differs" and beyond["o2"]["text"] == "O2 +9 points"
    assert beyond["pressure"]["text"] == "pressure -31 kPa"
    assert beyond["airflow"]["text"] == "airflow -5 cm/s"
    assert beyond["gravity"]["result"] == "differs"
    assert beyond["o2"]["tolerance"] == {"value": 1.5, "unit": "points"}


def test_acme_bre_is_analogue():
    o = obs(locator="PSI-20_Experimental_table_ACME_BRE.csv#row=2", material_id=None)
    assert evidence_class(PMMA, o)[0] == "analogue"


def test_unmatched_component_gets_no_exact_evidence():
    comp = {"material_id": None, "identity_confidence": "unmatched"}
    assert evidence_class(comp, obs())[0] != "exact"
    assert all(r["evidence_class"] != "exact" for r in rank([obs()], scen(), "microgravity", comp))
    related = {"material_id": "pmma-cast-sheet", "identity_confidence": "related"}
    assert evidence_class(related, obs())[0] == "related"


def test_ranking_is_deterministic():
    observations = [
        obs("c#1", o2=0.30),  # exact, 1 differs
        obs("b#1"),  # exact, 0 differs
        obs("a#1", o2=None),  # exact, 0 differs, 1 unknown
        obs("z#1", material_id="pmma-extruded"),  # related via declared list
        obs("PSI-20_Experimental_table_ACME_BRE.csv#row=1", material_id=None),
        obs("x#1", material_id="nomex"),  # unrelated, dropped
        obs("t#1", hazard="toxicity"),  # non-fire, dropped
    ]
    ranked = rank(observations, scen(), "microgravity", PMMA, ["pmma-extruded"])
    order = [r["locator"] for r in ranked]
    assert order == ["b#1", "a#1", "c#1", "z#1", "PSI-20_Experimental_table_ACME_BRE.csv#row=1"]
    assert [r["navigation_rank"] for r in ranked] == [1, 2, 3, 4, 5]
    assert order == [r["locator"] for r in rank(list(reversed(observations)), scen(), "microgravity", PMMA, ["pmma-extruded"])]
    assert ranked[0]["reasons"][0].startswith("same material identity")
    assert not any("confidence" in k or "safety" in k for r in ranked for k in r)


def test_toxicity_unassessed_even_with_fire_evidence_and_assembly_gap():
    ranked = rank([obs()], scen(), "microgravity", PMMA)
    results = [
        {"component_id": "enc", "name": "Enclosure", "ranked": ranked},
        {"component_id": "bat", "name": "Battery", "ranked": []},
    ]
    cov = coverage(results)
    fire = cov["fire"]
    assert [c["status"] for c in fire["components"]] == ["evidence_found", "gap"]
    assert fire["summary"]["denominator"] == 2 and fire["summary"]["evidence_found"] == 1
    for hz in ("toxicity", "biological"):
        assert all(c["status"] == "unassessed" for c in cov[hz]["components"])
        assert cov[hz]["summary"]["unassessed"] == 2
    for hz in ("fire", "toxicity", "biological"):
        assert cov[hz]["assembly"]["status"] == "gap"

    cov2 = coverage(results, assessments={("bat", "toxicity"): "evidence_found"}, assembly_evidence={"fire": 1})
    assert cov2["toxicity"]["components"][1]["status"] == "evidence_found"
    assert cov2["fire"]["assembly"]["status"] == "evidence_found"


def test_curated_assessment_cannot_override_fire():
    results = [{"component_id": "c1", "name": "Enclosure", "ranked": []}]
    cov = coverage(results, assessments={("c1", "fire"): "evidence_found", (None, "fire"): "evidence_found"})
    assert cov["fire"]["components"][0]["status"] == "gap"
    assert cov["fire"]["assembly"]["status"] == "gap"
