import csv
from pathlib import Path

import pytest

from app.ingest.psi import (
    TABLES,
    label_geometry,
    load_investigations,
    load_observations,
    parse_o2,
    parse_quantity,
    source_slug,
)

DATA = Path(__file__).resolve().parents[2] / "data"


def approx(pair):
    return pytest.approx(pair) if pair[0] is not None else pair


# --- cell parsers ---------------------------------------------------------------


@pytest.mark.parametrize(
    "cell,expected",
    [
        ("21.5 - 21.7", (0.215, 0.217)),
        ("22.1 to 22.0", (0.220, 0.221)),
        ("~ 21.5", (0.215, 0.215)),
        ("21; 26.5; 40", (0.21, 0.40)),
        ("22.2", (0.222, 0.222)),
        ("", (None, None)),
        ("  ", (None, None)),
        ("none", (None, None)),
        ("3400%", (None, None)),  # Excel-formatted 34 -> out of range, left for review
    ],
)
def test_parse_o2(cell, expected):
    assert parse_o2(cell) == approx(expected)


@pytest.mark.parametrize(
    "cell,default,expected",
    [
        ("20", "cm/s", (0.2, 0.2)),
        ("30 cm/s", None, (0.3, 0.3)),
        ("2.1 mm/s", None, (0.0021, 0.0021)),
        ("0.27 mm", None, (0.00027, 0.00027)),
        (".33 cm", None, (0.0033, 0.0033)),
        ("~ 10 cm (note 3)", None, (0.1, 0.1)),
        ("5 cm", "cm", (0.05, 0.05)),
        ("037 mm", None, (None, None)),  # typo, not 37 mm
        ("0.85 and 0.37 mm", None, (None, None)),
        ("See Fig. 5", None, (None, None)),
        ("~ 0", None, (None, None)),  # no unit anywhere -> unknown, not zero
        ("Insignificant", "s", (None, None)),
    ],
)
def test_parse_quantity(cell, default, expected):
    assert parse_quantity(cell, default) == approx(expected)


def test_source_slug():
    assert source_slug("PSI-26", "BASS") == "psi-26-bass"
    assert source_slug("PSI-25", "BASS-II") == "psi-25-bass-ii"
    assert source_slug("PSI-98", "SAFFIRE-I") == "psi-98-saffire-1"
    assert source_slug("PSI-100", "SAFFIRE-III") == "psi-100-saffire-3"
    assert source_slug("PSI-10", "ACME/Flame Design") == "psi-10-acme-flame-design"
    assert source_slug("PSI-115", None) == "psi-115"


def test_label_geometry():
    g = label_geometry("100 micron PMMA film   2 cm wide")
    assert g["thickness_m"] == pytest.approx(1e-4) and g["width_m"] == pytest.approx(0.02)
    assert label_geometry('1/4" black rod')["diameter_m"] == pytest.approx(0.00635)
    assert "diameter_m" not in label_geometry("1/4 black rod")  # no inch mark
    assert label_geometry("SIBAL 2 cm") is None  # which dimension is 2 cm? ambiguous


# --- real data ------------------------------------------------------------------


@pytest.fixture(scope="module")
def ingested():
    return load_observations(DATA)


def test_investigations():
    sources, invs = load_investigations(DATA)
    assert len(sources) == len(invs) == 24
    ids = {s["id"] for s in sources}
    assert {"psi-26-bass", "psi-25-bass-ii", "psi-98-saffire-1", "psi-99-saffire-2", "psi-100-saffire-3"} <= ids
    assert all(s["url"] == f"https://doi.org/{s['doi']}" for s in sources)
    assert sum(i["normalization_status"] == "normalized" for i in invs) == 6
    assert all("publications" not in i["raw"] for i in invs)


# Non-test rows (flow-visualization notes, footnotes, BASS soot cleaning) are skipped.
EXPECTED = {"PSI-26": (122, 121), "PSI-25": (129, 129), "PSI-98": (4, 2),
            "PSI-99": (15, 9), "PSI-100": (2, 2), "PSI-20": (18, 18)}


def test_row_counts(ingested):
    _, obs = ingested
    for t in TABLES:
        with (DATA / "experimental_tables" / t["file"]).open(encoding="utf-8-sig", newline="") as f:
            data_rows = sum(1 for r in list(csv.reader(f))[1:] if any(c.strip() for c in r))
        csv_rows, kept = EXPECTED[t["acc"]]
        assert data_rows == csv_rows
        assert sum(o["investigation_accession"] == t["acc"] for o in obs) == kept


def test_observation_invariants(ingested):
    labels, obs = ingested
    assert len({(o["source_id"], o["locator"]) for o in obs}) == len(obs)
    for o in obs:
        for lo, hi in [("o2_min", "o2_max"), ("airflow_ms_min", "airflow_ms_max")]:
            assert (o[lo] is None) == (o[hi] is None)
            if o[lo] is not None:
                assert o[lo] <= o[hi]
        if o["o2_min"] is not None:
            assert 0 < o["o2_min"] <= o["o2_max"] <= 1
        # no invented zeros: a 0 condition must come from a non-blank raw cell
        for col, raw in [("o2_min", "o2_raw"), ("airflow_ms_min", "airflow_raw")]:
            if o[col] is not None:
                assert o[raw] and o[col] > 0
        assert o["pressure_kpa_min"] is None and o["pressure_raw"] is None
        assert o["test_method"] == "psi_flight" and o["gravity_regime"] == "microgravity"
        assert o["gravity_g"] is None and o["material_id"] is None
    assert all(lb["match_confidence"] == "unmatched" and lb["material_id"] is None for lb in labels)
    assert len({(lb["raw_label"], lb["source_id"]) for lb in labels}) == len(labels)


def test_specific_rows(ingested):
    _, obs = ingested
    by = {o["locator"]: o for o in obs}
    assert all(o["outcome"] is None for o in obs if o["investigation_accession"] in ("PSI-25", "PSI-26"))
    s1 = by["PSI-98_Experimental_table_SAFFIRE-1.csv#row=1"]
    assert s1["o2_raw"] == "21.5 - 21.7" and s1["outcome"]["burn_time_s"] == 420
    assert s1["airflow_ms_min"] == pytest.approx(0.2) and s1["flow_direction"] == "concurrent"
    assert s1["geometry"]["thickness_m"] == pytest.approx(0.0037)
    acme = [o for o in obs if o["investigation_accession"] == "PSI-20"]
    assert all(o["is_summary_row"] for o in acme)
    assert by["PSI-20_Experimental_table_ACME_BRE.csv#row=5"]["o2_min"] is None  # "3400%"
    bass = by["PSI-26_Experimental_table_BASS.csv#row=1"]
    assert bass["o2_min"] is None and bass["airflow_ms_min"] is None and bass["raw_label"] == "SIBAL 2 cm"
