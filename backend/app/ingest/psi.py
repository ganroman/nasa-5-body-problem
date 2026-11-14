"""Turn local PSI files (data/investigations, data/experimental_tables) into plain dicts keyed by
ORM column names. No database access; a loader resolves label_id from (raw_label, source_id).

Units: O2 volume fraction 0..1, pressure kPa, airflow m/s, lengths m, time s. Unparseable or blank
cells become None (never 0) and the cell text is kept in *_raw / raw.
"""

import csv
import json
import re
from datetime import datetime
from pathlib import Path

NORMALIZED = {"PSI-20", "PSI-25", "PSI-26", "PSI-98", "PSI-99", "PSI-100"}
BULKY_KEYS = ("publications", "contacts", "experimentalTable")

# Unit -> SI factor. '%' -> fraction.
UNITS = {
    "mm": 1e-3, "cm": 1e-2, "m": 1.0, "micron": 1e-6, '"': 0.0254,
    "mm/s": 1e-3, "cm/s": 1e-2, "m/s": 1.0, "s": 1.0, "%": 0.01,
}
# No leading-zero integers: "037 mm" is a typo (0.37?) and must not parse as 37.
_NUM = r"(?:0|[1-9]\d*)(?:\.\d+)?|\.\d+"
_VALUE = re.compile(rf'^~?\s*({_NUM})\s*(mm/s|cm/s|m/s|micron|mm|cm|m|s|%|")?$')
_RANGE_SEP = re.compile(r"\s+-\s+|\s+to\s+|\s*;\s*")
_NOTE_REF = re.compile(r"\s*\(note \d+\)", re.I)


def parse_quantity(text, default_unit=None):
    """Cell -> (min, max) in SI units, or (None, None).

    Handles "21.5", "~ 21.5", "21.5 - 21.7", "22.1 to 22.0", "21; 26.5; 40", "29 cm", "20 cm/s".
    A unit in the cell wins over default_unit (taken from the column header).
    """
    text = _NOTE_REF.sub("", (text or "").strip())
    if not text:
        return None, None
    values, units = [], set()
    for part in _RANGE_SEP.split(text):
        m = _VALUE.match(part.strip())
        if not m:
            return None, None
        values.append(float(m[1]))
        units.add(m[2] or default_unit)
    if len(units) != 1 or None in units:
        return None, None
    factor = UNITS[units.pop()]
    return min(values) * factor, max(values) * factor


def parse_o2(text):
    """Percent-by-volume cell -> (min, max) fraction; out-of-range (e.g. Excel "3400%") -> None."""
    lo, hi = parse_quantity(text, "%")
    if lo is None or lo < 0 or hi > 1:
        return None, None
    return round(lo, 6), round(hi, 6)


def _single(text, default_unit=None):
    lo, hi = parse_quantity(text, default_unit)
    return round(lo, 9) if lo is not None and lo == hi else None


def _header_unit(header):
    m = re.search(r"\((cm/s|mm|cm|s)\)", header)
    return m[1] if m else None


def _blank_none(value):
    return (value.strip() or None) if isinstance(value, str) else value


def _iso(value, fmt):
    return datetime.strptime(value, fmt).date().isoformat() if value else None


def source_slug(accession, acronym):
    slug = accession.lower()
    if acronym:
        a = re.sub(r"[^a-z0-9]+", "-", acronym.lower()).strip("-")
        a = re.sub(r"^saffire-(i{1,3})$", lambda m: f"saffire-{len(m[1])}", a)
        slug = f"{slug}-{a}"
    return slug


def load_investigations(data_dir):
    sources, investigations = [], []
    for path in sorted(Path(data_dir, "investigations").glob("PSI-*.json")):
        d = json.loads(path.read_text(encoding="utf-8"))
        acc = d["accession"]
        acronym = _blank_none(d.get("investigationAcronym"))
        sid = source_slug(acc, acronym)
        doi = _blank_none(d.get("doi"))
        sources.append({
            "id": sid,
            "kind": "psi_investigation",
            "title": d["title"],
            "doi": doi,
            "url": f"https://doi.org/{doi}" if doi else None,
            "publisher": "NASA Physical Sciences Informatics",
            "revision": f"v{d['version']}" if d.get("version") is not None else None,
            "published_on": _iso(_blank_none(d.get("releaseDate")), "%d-%b-%Y"),
            "accessed_on": None,
            "access_notes": None,
        })
        investigations.append({
            "accession": acc,
            "source_id": sid,
            "acronym": acronym,
            "title": d["title"],
            "objective": _blank_none(d.get("objective")),
            "hypothesis": _blank_none(d.get("hypothesis")),
            "approach": _blank_none(d.get("approach")),
            "hardware": _blank_none(d.get("experimentHardware")),
            "flight_program": _blank_none(d.get("flightProgram")),
            "research_area": _blank_none(d.get("researchArea")),
            "sub_research_area": _blank_none(d.get("subResearchArea")),
            "start_date": _iso(_blank_none(d.get("investigationStartDate")), "%m-%d-%Y"),
            "end_date": _iso(_blank_none(d.get("investigationEndDate")), "%m-%d-%Y"),
            "normalization_status": "normalized" if acc in NORMALIZED else "metadata_only",
            "raw": {k: v for k, v in d.items() if k not in BULKY_KEYS},
        })
    return sources, investigations


# Columns are matched on stripped header text. None = not recorded in that table.
TABLES = [
    {"acc": "PSI-26", "file": "PSI-26_Experimental_table_BASS.csv", "label": "Fuel Sample Material"},
    {"acc": "PSI-25", "file": "PSI-25_Experimental_table_BASS-II.csv", "label": "Fuel Sample Material",
     # Initial O2 is the test condition; final O2 reflects consumption and stays in raw.
     "o2": "Calibrated  initial O2 % by vol",
     # Fan/Air "display" readings have no stated unit: kept as airflow_raw, never converted.
     "airflow_unitless": ("Fan display", "Air display")},
    {"acc": "PSI-98", "file": "PSI-98_Experimental_table_SAFFIRE-1.csv", "label": "Material",
     "o2": "Percent O2", "airflow": "Air Flow (cm/s)", "flow": "Flow Direction",
     "dims": ("Sample Thickness (cm)", "Sample Length (cm)", "Sample Width (cm)")},
    {"acc": "PSI-99", "file": "PSI-99_Experimental_table_SAFFIRE-2.csv", "label": "Material",
     "o2": "Percent O2 (Note 1)", "airflow": "Air Flow (cm/s)", "flow": "Flow Direction",
     "dims": ("Samle Thickness", "Sample Length", "Sample Width (cm)")},
    {"acc": "PSI-100", "file": "PSI-100_Experimental_table_SAFFIRE-3.csv", "label": "Material",
     "airflow": "Air Flow", "flow": "Direction",
     "dims": ("Sample Thickness", "Sample Length", "Sample Width")},
    {"acc": "PSI-20", "file": "PSI-20_Experimental_table_ACME_BRE.csv", "label": "Fuel Bottle",
     "o2": "Oxygen Conc (percent)"},
]

# Rows that are not tests: Saffire flow-visualization file notes and footnotes, BASS maintenance.
_NOT_A_TEST = re.compile(r"^(F\d+C\d+/F\d+C\d+|Note \d+|SOOT Cleaning)")


def is_test_row(first_cell, label):
    return not (_NOT_A_TEST.match(first_cell.strip()) or _NOT_A_TEST.match(label.strip()))


def label_geometry(label):
    """Geometry from a BASS/BASS-II label, only for explicit wording; otherwise None."""
    low = label.lower()
    g = {}
    t = re.findall(r"(\d+(?:\.\d+)?)\s*micron", low) + re.findall(r"(\d+(?:\.\d+)?)\s*mm\s+thick", low)
    if "film" in low and not t:
        t = re.findall(r"(\d+(?:\.\d+)?)\s*mm\b", low)
    if len(t) == 1:
        g["thickness_m"] = round(float(t[0]) * (1e-6 if "micron" in low else 1e-3), 9)
    w = re.findall(r"(\d+(?:\.\d+)?)\s*cm\s+wide", low)
    if "film" in low and not w:
        w = re.findall(r"(\d+(?:\.\d+)?)\s*cm\b", low)
    if len(w) == 1:
        g["width_m"] = round(float(w[0]) * 1e-2, 9)
    if "sphere" in low:
        g["shape"] = "sphere"
        d = re.findall(r"(\d+(?:\.\d+)?)\s*cm\b", low)
        if len(d) == 1:
            g["diameter_m"] = round(float(d[0]) * 1e-2, 9)
    elif "rod" in low:
        g["shape"] = "rod"
        # Only with an explicit inch mark: '1/4 black rod' could be anything.
        d = re.findall(r'(\d+)/(\d+)\s*"|(\d*\.\d+)\s*"', low)
        if len(d) == 1:
            num, den, dec = d[0]
            inches = int(num) / int(den) if num else float(dec)
            g["diameter_m"] = round(inches * 0.0254, 9)
    else:
        shape = next((s for s in ("film", "slab", "sheet", "candle") if s in low), None)
        if shape:
            g["shape"] = shape
    return {**g, "raw": label} if g else None


def _outcome(acc, row):
    if acc == "PSI-98":
        raw = row["Burn Time (s)"]
        return {"burn_time_s": _single(raw, "s"), "burn_time_raw": raw} if raw.strip() else None
    if acc == "PSI-99":
        bt, bl, sp = row["Burn Time (s)"], row["?-g Burn Length"], row["?-g Spread Length"]
        return {
            "burn_time_s": _single(bt, "s"), "burn_time_raw": _blank_none(bt),
            "ug_burn_length_m": _single(bl), "ug_burn_length_raw": _blank_none(bl),
            # Header says "Spread Length" but cells are rates (mm/s); unit comes from the cell.
            "ug_spread_rate_ms": _single(sp), "ug_spread_raw": _blank_none(sp),
            # shortcut: 1-g ground comparison kept raw inside the flight row; split into its own
            # psi_ground observation when ground data is loaded.
            "ground_1g_comparison_raw": {
                "burn_length": _blank_none(row["1-g Burn Length"]),
                "spread_rate": _blank_none(row["1-g Spread Rate"]),
            },
        }
    if acc == "PSI-20":
        n = row["Flames Ignited"].strip()
        return {"flames_ignited": int(n), "flames_ignited_raw": n} if n.isdigit() else None
    return None  # BASS/BASS-II/Saffire-III record no flame-spread or extinction outcome


def load_observations(data_dir):
    labels, observations = {}, []
    slug = {i["accession"]: i["source_id"] for i in load_investigations(data_dir)[1]}
    for t in TABLES:
        acc, sid = t["acc"], slug[t["acc"]]
        path = Path(data_dir, "experimental_tables", t["file"])
        with path.open(encoding="utf-8-sig", newline="") as f:
            rows = list(csv.reader(f))
        headers = [h.strip() for h in rows[0]]
        for n, cells in enumerate(rows[1:], start=1):
            row = dict(zip(headers, cells))
            label = row[t["label"]]
            if not any(c.strip() for c in cells) or not is_test_row(cells[0], label):
                continue
            raw_label = label.strip() or None
            if raw_label:
                labels.setdefault((raw_label, sid), {
                    "raw_label": raw_label, "source_id": sid, "material_id": None,
                    "match_confidence": "unmatched", "note": None,
                })
            o2_raw = _blank_none(row.get(t.get("o2"), ""))
            o2 = parse_o2(o2_raw)
            air_col = t.get("airflow")
            air_raw = _blank_none(row.get(air_col, ""))
            air = parse_quantity(air_raw, air_col and _header_unit(air_col))
            if "airflow_unitless" in t:
                air_raw = "; ".join(f"{c}: {row[c].strip()}" for c in t["airflow_unitless"] if row[c].strip()) or None
            flow = _blank_none(row.get(t.get("flow"), ""))
            if not flow and acc in ("PSI-25", "PSI-26") and ("opposed" in label.lower() or "oppsed" in label.lower()):
                flow = "opposed"

            if "dims" in t:
                cols = t["dims"]
                geometry = {
                    "thickness_m": _single(row[cols[0]], _header_unit(cols[0])),
                    "length_m": _single(row[cols[1]], _header_unit(cols[1])),
                    "width_m": _single(row[cols[2]], _header_unit(cols[2])),
                    "raw": {c: row[c] for c in cols},
                }
            elif acc == "PSI-20":
                b = row["Burner Size (mm)"]
                geometry = {"burner_size_m": _single(b, "mm"), "raw": {"Burner Size (mm)": b}}
            else:
                geometry = label_geometry(label)

            observations.append({
                "source_id": sid,
                "investigation_accession": acc,
                "locator": f"{t['file']}#row={n}",
                "test_method": "psi_flight",
                "hazard": "fire",
                "raw_label": raw_label,
                "material_id": None,
                "is_summary_row": acc == "PSI-20",  # one row per ISS day, several tests
                "o2_min": o2[0], "o2_max": o2[1], "o2_raw": o2_raw,
                # No table records pressure; ACME BRE says pressures "varied but not identified".
                "pressure_kpa_min": None, "pressure_kpa_max": None, "pressure_raw": None,
                "airflow_ms_min": air[0], "airflow_ms_max": air[1], "airflow_raw": air_raw,
                "flow_direction": flow.lower() if flow else None,
                "gravity_regime": "microgravity",
                "gravity_g": None,
                "geometry": geometry,
                "outcome": _outcome(acc, row),
                "raw": dict(zip(rows[0], cells)),
            })
    return list(labels.values()), observations
