"""Mock demo data for Cargo Passport: many cargo items, routes, environments, evidence and passports.

Everything this script writes is invented and marked, so the curated seed is never touched:

  sources, materials, environments, findings, reference passages, cargo   id / slug prefix `mock-`
  investigations                                                         accession prefix `MOCK-`
  observations                                                           source_id prefix `mock-`
  routes                                                                 id `M01`, `M02`, ...
  shares                                                                 slug prefix `mock-`
  passport exports                                                       snapshot key `mock_demo`

Usage (from backend/, DATABASE_URL in the environment, schema already migrated):

    uv run python seed/mock.py              # purge old mock rows, then load them again (idempotent)
    uv run python seed/mock.py --dry-run    # same, but roll back; prints the counts it would reach
    uv run python seed/mock.py --purge      # delete every mock row
    uv run python seed/mock.py --counts     # only print table counts (all rows / mock rows)

A run is deterministic: same code, same rows (fixed random seed, ids derived with uuid5).
No number here is a measurement; flame-spread values come from a toy model in `simulate`.
"""

import argparse
import json
import random
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import delete, func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import mock_data as md  # noqa: E402
from app import scenario as sc  # noqa: E402
from app.db import get_engine  # noqa: E402
from app.enums import (  # noqa: E402
    EnvDomain, EnvMaturity, FindingTopic, GravityRegime, Hazard, MatchConfidence, NormalizationStatus,
    Origin, Provenance, ReviewStatus, RouteStatus, SourceKind, TestMethod, ValueStatus,
)
from app.models import (  # noqa: E402
    CargoConfig, CargoItem, Component, Environment, EnvironmentCondition, Finding, FindingLink, Investigation,
    Material, Observation, PassportExport, ReferencePassage, Route, Share, Source, route_sources,
)

BASE_URL = "https://cargo.qwadratic.me"
NS = uuid.UUID("5a1d0c44-3f6e-4f0a-9d54-0c6a3e5b7c11")
MOCK_NOTE = "Mock demo record: invented for the demo, not a real publication, measurement or specification."
SEED = 2026


def uid(*parts: str) -> uuid.UUID:
    return uuid.uuid5(NS, "/".join(parts))


# ---------------------------------------------------------------------------
# Toy flame model: only here so the demo numbers move in plausible directions.
# ---------------------------------------------------------------------------


def min_o2(lim: float, p_kpa: float, g_micro: bool) -> float:
    """Oxygen fraction below which a sample does not sustain a flame (lower in microgravity at low flow)."""
    v = lim * (101.3 / p_kpa) ** 0.25
    return min(0.6, v * (0.97 if g_micro else 1.0))


def simulate(rng: random.Random, lim: float, o2: float, p: float, flow: float, micro: bool) -> dict:
    limit = min_o2(lim, p, micro)
    ignited = o2 >= limit - 0.005
    if not ignited:
        return {"ignited": False, "burn_time_s": 0, "flame_spread_mm_s": 0.0, "extinguished": True}
    spread = max(0.2, (o2 - limit + 0.03) * 60 * (1 + 4 * flow) * (0.7 if micro and flow < 0.05 else 1.0))
    spread *= rng.uniform(0.85, 1.15)
    burned = rng.random() < 0.5
    return {"ignited": True, "burn_time_s": round(rng.uniform(20, 240)), "flame_spread_mm_s": round(spread, 2),
            "extinguished": not burned}


# ---------------------------------------------------------------------------
# Row builders (pure: no database)
# ---------------------------------------------------------------------------


def _src(id_: str, kind: SourceKind, title: str, publisher: str, published: str | None = None, rev: str | None = None) -> dict:
    return dict(id=id_, kind=kind, title=title, doi=None, url=f"{BASE_URL}/sources/{id_}", publisher=publisher,
                revision=rev, published_on=published, accessed_on="2026-11-15", access_notes=MOCK_NOTE)


INVESTIGATIONS = [
    ("01", "DEMO-FS1", "Flame spread over thin polymer films at reduced pressure", "Solid-material flammability",
     ["peek", "kapton", "pc", "pet-laminate", "acrylic-adh", "pp"]),
    ("02", "DEMO-FS2", "Flame spread over fabrics in low-speed flow", "Solid-material flammability",
     ["nomex-blend", "beta-cloth", "cotton-poly", "wool", "fleece", "velcro"]),
    ("03", "DEMO-FOAM", "Foam and cushioning flammability in microgravity", "Solid-material flammability",
     ["pe-foam", "pu-foam", "si-foam", "ps-foam"]),
    ("04", "DEMO-WIRE", "Wire insulation overheating and ignition", "Electrical fire safety",
     ["fep-wire", "etfe-wire", "epoxy-pot", "g10", "nylon"]),
    ("05", "DEMO-ELA", "Elastomer seal burning at 70 kPa", "Solid-material flammability",
     ["viton", "epdm", "rtv", "si-foam"]),
    ("06", "DEMO-CMP", "Composite panel ignition in enriched oxygen", "Solid-material flammability",
     ["cfrp", "g10", "honeycomb", "peek"]),
    ("07", "DEMO-PKG", "Packaging and paper flammability in cabin air", "Solid-material flammability",
     ["cardboard", "paper", "pp", "pet-laminate", "ps-foam"]),
    ("08", "DEMO-HAB", "Material behaviour at 26.5 % oxygen and 70.3 kPa", "Habitat atmospheres",
     ["abs", "pc", "nylon", "pvc", "cotton-poly", "fleece", "epdm"]),
    ("09", "DEMO-LOW", "Low-pressure cabin tests at 56.5 kPa", "Habitat atmospheres",
     ["abs", "pvc", "pp", "nomex-blend", "viton", "cfrp"]),
    ("10", "DEMO-FLOW", "Flow speed effect on flame spread, 0 to 30 cm/s", "Solid-material flammability",
     ["abs", "pu-foam", "wool", "cotton-poly", "pe-foam", "paper"]),
    ("11", "DEMO-SUP", "Water-mist and CO2 suppression of solid fuels", "Fire suppression",
     ["abs", "pe-foam", "nomex-blend", "cardboard", "pc"]),
    ("12", "DEMO-SMK", "Smoke particle size from overheated materials", "Smoke detection",
     ["fep-wire", "etfe-wire", "pvc", "pu-foam", "epoxy-pot", "kapton"]),
]

PAPERS = [
    ("mock-ds-material-sheets", SourceKind.datasheet, "Material data sheet collection for demo specimens", "Demo supplier"),
    ("mock-paper-atmosphere-trade", SourceKind.paper, "Cabin atmosphere trade study: oxygen and pressure options", "Demo agency study"),
    ("mock-paper-cargo-stowage", SourceKind.paper, "Stowage density and ignition spread in soft cargo bags", "Demo agency study"),
    ("mock-paper-battery-venting", SourceKind.paper, "Battery vent gas and nearby material ignition", "Demo agency study"),
    ("mock-guid-fire-response", SourceKind.guidance, "Cabin fire response principles for crewed vehicles", "Demo agency guidance"),
    ("mock-guid-cargo-review", SourceKind.guidance, "Cargo flammability review process overview", "Demo agency guidance"),
    ("mock-std-test1", SourceKind.standard, "Upward flame propagation test results, demo compilation", "Demo test laboratory"),
    ("mock-std-test4", SourceKind.standard, "Wire insulation flammability test results, demo compilation", "Demo test laboratory"),
    ("mock-std-loi", SourceKind.standard, "Limiting oxygen index results, demo compilation", "Demo test laboratory"),
]


def build_sources_and_investigations() -> tuple[list[dict], list[dict]]:
    sources, invs = [], []
    for num, acr, title, area, _mats in INVESTIGATIONS:
        sid = f"mock-inv-{num}"
        sources.append(_src(sid, SourceKind.psi_investigation, f"{title} ({acr})", "Demo investigation", "2024"))
        invs.append(dict(
            accession=f"MOCK-{num}", source_id=sid, acronym=acr, title=title,
            objective=f"Measure flame spread and ignition limits for the specimens listed in {acr}. {MOCK_NOTE}",
            hypothesis="Flame spread rate falls with oxygen and rises with flow speed; ignition limits shift with pressure.",
            approach="Samples burned in a sealed chamber at set oxygen, pressure and flow; video and thermocouple records.",
            hardware="Demo combustion chamber with flow duct, thermocouple array and camera.",
            flight_program="Demo programme", research_area=area, sub_research_area="Demo data",
            start_date="2023-05", end_date="2025-02", normalization_status=NormalizationStatus.normalized,
            raw={"mock": True},
        ))
    for id_, kind, title, pub in PAPERS:
        sources.append(_src(id_, kind, title, pub, "2025"))
    for suffix, name, *_ in md.ENVIRONMENTS:
        sources.append(_src(f"mock-env-{suffix}", SourceKind.internal_doc, f"Demo environment profile: {name}", "Demo team", "2026-11", "demo-1"))
    return sources, invs


def build_materials() -> list[dict]:
    return [dict(id=f"mock-{k}", canonical_name=name, material_class=cls, formulation=None, form=form, thickness_m=th,
                 notes=f"{note} {MOCK_NOTE}")
            for k, (name, cls, form, th, _lim, note) in md.MATERIALS.items()]


def build_observations(rng: random.Random) -> list[dict]:
    rows: list[dict] = []
    seen: set[tuple[str, str]] = set()

    def add(source_id: str, locator: str, **kw) -> None:
        assert (source_id, locator) not in seen, locator
        seen.add((source_id, locator))
        row = dict(source_id=source_id, locator=locator, hazard=Hazard.fire, label_id=None, is_summary_row=False,
                   o2_min=None, o2_max=None, o2_raw=None, pressure_kpa_min=None, pressure_kpa_max=None, pressure_raw=None,
                   airflow_ms_min=None, airflow_ms_max=None, airflow_raw=None, flow_direction=None, gravity_g=None,
                   geometry=None, investigation_accession=None)
        row.update(kw)
        row["raw"] = {**kw.get("raw", {}), "mock": True}
        rows.append(row)

    for num, acr, _title, _area, mats in INVESTIGATIONS:
        sid, acc = f"mock-inv-{num}", f"MOCK-{num}"
        n = 0
        for key in mats:
            name, _cls, form, th, lim, _ = md.MATERIALS[key]
            for _ in range(rng.randint(4, 6)):
                n += 1
                micro = rng.random() < 0.62
                o2 = rng.choice([0.21, 0.21, 0.23, 0.25, 0.265, 0.30, 0.34])
                p = rng.choice([101.3, 101.3, 70.3, 70.3, 56.5])
                flow = rng.choice([0.0, 0.0, 0.05, 0.10, 0.20, 0.30])
                outcome = simulate(rng, lim, o2, p, flow, micro)
                direction = "quiescent" if flow == 0 else rng.choice(["concurrent", "opposed"])
                add(
                    sid, f"mock#{acr.lower()}/row={n}", investigation_accession=acc,
                    test_method=TestMethod.psi_flight if micro else TestMethod.psi_ground,
                    material_id=f"mock-{key}", is_summary_row=rng.random() < 0.03,
                    o2_min=o2, o2_max=o2, o2_raw=f"{o2 * 100:g}%",
                    pressure_kpa_min=p, pressure_kpa_max=p, pressure_raw=f"{p:g} kPa",
                    airflow_ms_min=flow, airflow_ms_max=flow, airflow_raw=f"{flow * 100:g} cm/s",
                    flow_direction=direction,
                    gravity_regime=GravityRegime.microgravity if micro else GravityRegime.earth,
                    geometry={"thickness_m": th, "length_m": 0.10, "width_m": 0.03, "raw": f"{form}, {th * 1000:g} mm x 100 x 30 mm"},
                    outcome=outcome, raw={"Material": name, "Test": f"{acr} run {n}"},
                )
    for key, (name, _c, _f, th, lim, _n) in md.MATERIALS.items():
        for p in (101.3, 70.3, 56.5):
            moc = round(min_o2(lim, p, False), 2)
            add("mock-std-test1", f"mock#std1/{key}/p={p:g}", test_method=TestMethod.std6001_test1, material_id=f"mock-{key}",
                o2_min=moc, o2_max=moc, o2_raw=f"{moc * 100:g}%", pressure_kpa_min=p, pressure_kpa_max=p, pressure_raw=f"{p:g} kPa",
                gravity_regime=GravityRegime.earth, outcome={"passed": True},
                raw={"Material": name, "Note": "maximum O2 passed at this pressure"})
        if key in LOI_MATERIALS:
            loi = round(lim + 0.01 + rng.random() * 0.03, 3)
            add("mock-std-loi", f"mock#loi/{key}", test_method=TestMethod.astm_d2863, material_id=f"mock-{key}",
                gravity_regime=GravityRegime.earth, outcome={"loi_fraction": loi}, raw={"Material": name})
        if key in ("fep-wire", "etfe-wire"):
            add("mock-std-test4", f"mock#std4/{key}", test_method=TestMethod.std6001_test4, material_id=f"mock-{key}",
                o2_min=0.21, o2_max=0.21, o2_raw="21%", pressure_kpa_min=101.3, pressure_kpa_max=101.3, pressure_raw="101.3 kPa",
                gravity_regime=GravityRegime.earth, outcome={"passed": key == "fep-wire"}, raw={"Material": name})
    # a few rows kept without a material identity, like the label-only PSI rows
    for i, label in enumerate(["Specimen 7 (blank label)", "Composite, unspecified", "Foam sample B"], 1):
        add("mock-inv-03", f"mock#unlinked/{i}", investigation_accession="MOCK-03", test_method=TestMethod.psi_flight,
            material_id=None, o2_min=0.21, o2_max=0.21, o2_raw="21%", pressure_kpa_min=101.3, pressure_kpa_max=101.3,
            pressure_raw="101.3 kPa", gravity_regime=GravityRegime.microgravity, outcome=None, raw={"Material": label})
    return rows


# LOI rows record no oxygen or pressure, so they rank first and read as "unknown". Keep them to a few materials.
LOI_MATERIALS = {"paper", "cardboard", "cotton-poly", "wool", "fleece", "pu-foam", "pe-foam", "ps-foam"}

TOPICS = [FindingTopic.prevention, FindingTopic.detection, FindingTopic.suppression, FindingTopic.general]


def build_findings(rng: random.Random) -> tuple[list[dict], list[dict], list[dict]]:
    findings, links = [], []
    keys = list(md.MATERIALS)
    rng.shuffle(keys)
    inv_by_mat: dict[str, tuple[str, str]] = {}
    for num, acr, _t, _a, mats in INVESTIGATIONS:
        for m in mats:
            inv_by_mat.setdefault(m, (f"mock-inv-{num}", acr))
    for i, key in enumerate(keys[:26], 1):
        name, _c, _f, _th, lim, _n = md.MATERIALS[key]
        src, acr = inv_by_mat[key]
        o2_low = round(min_o2(lim, 70.3, True) * 100)
        topic = TOPICS[i % 4]
        claims = {
            FindingTopic.prevention: f"{name}: no sustained flame was observed below {o2_low} % O2 at 70.3 kPa in quiescent microgravity.",
            FindingTopic.detection: f"{name}: smoke from overheated samples appeared several seconds before visible flame at 21 % O2.",
            FindingTopic.suppression: f"{name}: a CO2 discharge ended flame spread within 10 s in the tested chamber.",
            FindingTopic.general: f"{name}: flame spread rate increased with flow speed between 0 and 20 cm/s.",
        }
        findings.append(dict(
            id=f"mock-f-{i:02d}", claim=claims[topic],
            excerpt=f"[demo] {name}, chamber test at 70.3 kPa: results consistent with the claim above. {MOCK_NOTE}",
            locator=f"§4.{i % 5 + 1}, Table {i % 7 + 1}", source_id=src, hazard=Hazard.fire, topic=topic,
            applies_o2_min=0.21, applies_o2_max=0.34, applies_pressure_kpa_min=56.5, applies_pressure_kpa_max=101.3,
            applies_airflow_ms_min=0.0, applies_airflow_ms_max=0.3, applies_gravity_regime=GravityRegime.microgravity,
            limits="Single thickness and geometry; does not cover partial gravity, other conditions or assembled items.",
            review_status=ReviewStatus.verified, reviewed_by="demo",
        ))
        links.append(dict(finding_id=f"mock-f-{i:02d}", material_id=f"mock-{key}", observation_id=None, investigation_accession=None))
    passages = [
        dict(id=f"mock-rp-{i:02d}", source_id=sid, passage=text, locator=loc, hazard=Hazard.fire, scope=scope,
             relevance="Frames which evidence a reviewer asks for.", unresolved_applicability="Applicability to a specific vehicle is not established.",
             review_status=ReviewStatus.verified)
        for i, (sid, text, loc, scope) in enumerate([
            ("mock-guid-cargo-review", "Cargo items are reviewed by material, ignition source and intended environment.", "§2", "Crewed vehicles"),
            ("mock-guid-cargo-review", "Batteries and heaters are listed as ignition sources with their operating states.", "§3.1", "Crewed vehicles"),
            ("mock-guid-fire-response", "Response documents are separate from research evidence and are kept vehicle-specific.", "§1", "Crewed vehicles"),
            ("mock-guid-fire-response", "Cutting power and isolating the module are the first response steps in the example procedure.", "§4", "Example module"),
            ("mock-paper-atmosphere-trade", "Raising oxygen above 23 % lowers the pressure needed for crew comfort but narrows material options.", "§5", "Habitats"),
            ("mock-paper-atmosphere-trade", "Reduced-pressure cabins need ignition tests at the cabin pressure, not at sea level.", "§6", "Habitats"),
            ("mock-paper-cargo-stowage", "Dense soft stowage can carry flame between bags even when each bag material self-extinguishes.", "§3", "Soft stowage"),
            ("mock-paper-battery-venting", "Vented cell gas can ignite materials near the cell; casing tests do not cover this.", "§2", "Battery packs"),
        ], 1)
    ]
    return findings, links, passages


def build_environments() -> tuple[list[dict], list[dict]]:
    envs, conds = [], []
    for suffix, name, domain, regime, g, maturity, summary, spaces in md.ENVIRONMENTS:
        eid, sid = f"mock-{suffix}", f"mock-env-{suffix}"
        envs.append(dict(id=eid, name=name, domain=EnvDomain(domain), gravity_regime=GravityRegime(regime), gravity_g=g,
                         maturity=EnvMaturity(maturity), summary=f"{summary} Demo values.", source_id=sid, doc_path=None))
        for space, dims in spaces.items():
            for dim, v in dims.items():
                if v is None:
                    conds.append(dict(environment_id=eid, space=space, dimension=dim, value_min=None, value_max=None,
                                      status=ValueStatus.unknown, source_id=sid, locator="§2 Conditions",
                                      note="Not specified in the demo profile."))
                else:
                    lo, hi, st = v
                    conds.append(dict(environment_id=eid, space=space, dimension=dim, value_min=lo, value_max=hi,
                                      status=ValueStatus(st), source_id=sid, locator="§2 Conditions",
                                      note=f"Demo value ({st}); not a specification."))
    return envs, conds


def build_routes() -> tuple[list[dict], list[dict]]:
    def env(e: str) -> str:
        return e[1:] if e.startswith("~") else f"mock-{e}"

    routes, links = [], []
    for rid, a, b, status, types, cargo, desc in md.ROUTES:
        routes.append(dict(id=rid, from_env=env(a), to_env=env(b), status=RouteStatus(status), description=desc,
                           possible_cargo=cargo, cargo_types=types))
        for e in (a, b):
            if not e.startswith("~"):
                links.append(dict(route_id=rid, source_id=f"mock-env-{e}"))
    return routes, links


def split_shares(weights: list[int]) -> list[float]:
    total = sum(weights)
    shares = [round(w / total, 2) for w in weights]
    shares[-1] = round(1 - sum(shares[:-1]), 2)
    return shares


def build_cargo() -> list[dict]:
    out = []
    for n, (slug, name, purpose, comps) in enumerate(md.CARGO):
        shares = split_shares([c[3] for c in comps])
        components = []
        for i, (cname, key, label, _w) in enumerate(comps):
            if key is None:
                mat, conf, note = None, MatchConfidence.unmatched, "Stored energy or moving part: no material evidence in this dataset."
            elif key.startswith("real:"):
                mat, conf, note = md.REAL_MATERIALS[key[5:]][0], MatchConfidence.exact, None
            else:
                mat = f"mock-{key}"
                conf = MatchConfidence.related if (n + i) % 9 == 4 else MatchConfidence.exact
                note = None
            components.append(dict(position=i, name=cname, original_label=label, material_id=mat, identity_confidence=conf,
                                   mass_share=shares[i], ignition_notes=note))
        powered = any(c["material_id"] is None for c in components)
        out.append(dict(slug=f"mock-{slug}", name=name, purpose=purpose, components=components,
                        assembly_notes="Demo assembly. Mass shares are invented.",
                        use_states=["stowed", "operating", "charging"] if powered else ["stowed"]))
    return out


# ---------------------------------------------------------------------------
# Database side
# ---------------------------------------------------------------------------


def purge(session: Session) -> dict[str, int]:
    """Delete every mock row, children first. Returns rows removed per table."""
    n: dict[str, int] = {}

    def run(label: str, stmt) -> None:
        n[label] = session.execute(stmt).rowcount

    run("passport_exports", delete(PassportExport).where(PassportExport.snapshot.has_key("mock_demo")))
    share_cfg = select(Share.cargo_config_id).where(Share.slug.like("mock-%"))
    share_items = list(session.scalars(select(CargoConfig.item_id).where(CargoConfig.id.in_(share_cfg))))
    run("shares", delete(Share).where(Share.slug.like("mock-%")))
    run("cargo_items", delete(CargoItem).where(CargoItem.slug.like("mock-%") | CargoItem.id.in_(share_items)))
    run("findings", delete(Finding).where(Finding.id.like("mock-%")))
    run("reference_passages", delete(ReferencePassage).where(ReferencePassage.id.like("mock-%")))
    run("observations", delete(Observation).where(Observation.source_id.like("mock-%")))
    run("investigations", delete(Investigation).where(Investigation.accession.like("MOCK-%")))
    run("routes", delete(Route).where(Route.id.op("~")(r"^M[0-9]+$")))
    run("environments", delete(Environment).where(Environment.id.like("mock-%")))
    run("materials", delete(Material).where(Material.id.like("mock-%")))
    run("sources", delete(Source).where(Source.id.like("mock-%")))
    return n


def load(session: Session) -> dict[str, int]:
    rng = random.Random(SEED)
    sources, invs = build_sources_and_investigations()
    envs, conds = build_environments()
    routes, route_links = build_routes()
    findings, finding_links, passages = build_findings(rng)
    cargo = build_cargo()

    session.add_all(Source(**r) for r in sources)
    session.flush()
    session.add_all(Investigation(**r) for r in invs)
    session.add_all(Material(**r) for r in build_materials())
    session.flush()
    session.add_all(Observation(**r) for r in build_observations(rng))
    session.add_all(Finding(**r) for r in findings)
    session.add_all(ReferencePassage(**r) for r in passages)
    session.add_all(Environment(**r) for r in envs)
    session.flush()
    session.add_all(FindingLink(**r) for r in finding_links)
    session.add_all(EnvironmentCondition(**r) for r in conds)
    session.add_all(Route(**r) for r in routes)
    session.flush()
    if route_links:
        session.execute(route_sources.insert(), route_links)

    for c in cargo:
        item_id, cfg_id = uid("item", c["slug"]), uid("config", c["slug"])
        session.add(CargoItem(id=item_id, slug=c["slug"], name=c["name"], purpose=c["purpose"],
                              provenance=Provenance.illustrative, origin=Origin.seeded))
        session.flush()
        session.add(CargoConfig(id=cfg_id, item_id=item_id, version=1, assembly_notes=c["assembly_notes"],
                                supported_use_states=c["use_states"]))
        session.flush()
        session.add_all(Component(id=uid("comp", c["slug"], str(k["position"])), config_id=cfg_id, **k) for k in c["components"])
    session.flush()
    n_shares, n_exports = load_passports(session, cargo)
    return {"sources": len(sources), "investigations": len(invs), "materials": len(md.MATERIALS),
            "observations": session.scalar(select(func.count()).select_from(Observation).where(Observation.source_id.like("mock-%"))),
            "findings": len(findings), "reference_passages": len(passages), "environments": len(envs), "routes": len(routes),
            "cargo_items": len(cargo), "shares": n_shares, "passport_exports": n_exports}


# (cargo slug, environment id, space, use state, route id, overrides): scenarios behind the shares and exports
PASSPORTS = [
    ("handheld-spectrometer", "mock-lunar-hab-alpha", "cabin", "operating", "M17", {}),
    ("handheld-spectrometer", "mock-iss-columbus", "cabin", "stowed", "M02", {}),
    ("laptop-crew-support", "mock-lunar-hab-alpha", "cabin", "charging", "M14", {"airflow_ms": 0.1}),
    ("cargo-transfer-bag", "mock-iss-node3", "cabin", "stowed", "M03", {}),
    ("crew-sleeping-bag", "mock-mars-transit-hab", "cabin", "stowed", "M21", {}),
    ("rover-battery-spare", "mock-lunar-rover-demo", "cabin", "stowed", "M18", {}),
    ("experiment-rack-insert", "mock-iss-columbus", "rack", "operating", "M02", {}),
    ("plant-habitat-unit", "mock-gateway-halo", "cabin", "operating", "M12", {}),
    ("fire-blanket", "mock-lunar-lander-cabin", "cabin", "stowed", "M13", {}),
    ("medical-kit", "mock-leo-station-demo", "cabin", "stowed", "M05", {}),
    ("camera-kit", "mock-orion-cabin", "cabin", "stowed", "M06", {}),
    ("smoke-detector-spare", "mock-lunar-hab-alpha", "storage", "stowed", "M15", {}),
]


def load_passports(session: Session, cargo: list[dict]) -> tuple[int, int]:
    from app.api import SI_DISCLOSURE, CargoIn, ComponentIn, ScenarioIn, ShareIn, _hash_token, _save_cargo_and_scenario

    by_slug = {c["slug"]: c for c in cargo}
    when = datetime(2026, 11, 15, 8, 0, tzinfo=UTC).isoformat()
    shares = 0
    for i, (slug, env_id, space, use_state, route, overrides) in enumerate(PASSPORTS, 1):
        src = by_slug[f"mock-{slug}"]
        body = ShareIn(
            cargo=CargoIn(name=f"{src['name']} (shared copy)", purpose=src["purpose"], assembly_notes=src["assembly_notes"],
                          components=[ComponentIn(**{k: v for k, v in c.items() if k in ("name", "original_label", "material_id", "identity_confidence", "mass_share")})
                                      for c in src["components"]]),
            scenario=ScenarioIn(environment_id=env_id, space=space, use_state=use_state, route_id=route, overrides=overrides),
        )
        item = CargoItem(id=uid("share-item", str(i)), name=body.cargo.name, purpose=body.cargo.purpose,
                         provenance=Provenance.illustrative, origin=Origin.user, forked_from_id=uid("item", src["slug"]))
        session.add(item)
        session.flush()
        config, scen = _save_cargo_and_scenario(session, item, body)
        share = Share(slug=f"mock-share-{i:02d}", edit_token_hash=_hash_token(uuid.uuid4().hex), cargo_config_id=config.id,
                      scenario_id=scen.id, creator_ip_hash=None)
        session.add(share)
        session.flush()
        shares += 1
        cargo_dict = sc.seeded_cargo(session, src["slug"])
        scenario = body.scenario.model_dump(mode="json")
        result = sc.compute(session, cargo_dict, body.scenario.model_dump())
        snapshot = json.loads(json.dumps({
            "passport_version": 1, "generated_at": when, "cargo": cargo_dict, "scenario": scenario, **result,
            "observations": {str(k): v for k, v in result["observations"].items()},
            "si_disclosure": SI_DISCLOSURE, "mock_demo": True,
        }, default=str))
        session.add(PassportExport(id=uid("export", str(i)), scenario_id=scen.id, share_slug=share.slug, snapshot=snapshot,
                                   si_disclosure=SI_DISCLOSURE))
    session.flush()
    return shares, len(PASSPORTS)


COUNT_TABLES = [
    ("sources", Source, Source.id.like("mock-%")),
    ("investigations", Investigation, Investigation.accession.like("MOCK-%")),
    ("materials", Material, Material.id.like("mock-%")),
    ("observations", Observation, Observation.source_id.like("mock-%")),
    ("findings", Finding, Finding.id.like("mock-%")),
    ("reference_passages", ReferencePassage, ReferencePassage.id.like("mock-%")),
    ("environments", Environment, Environment.id.like("mock-%")),
    ("routes", Route, Route.id.op("~")(r"^M[0-9]+$")),
    ("cargo_items", CargoItem, CargoItem.slug.like("mock-%")),
    ("shares", Share, Share.slug.like("mock-%")),
    ("passport_exports", PassportExport, PassportExport.snapshot.has_key("mock_demo")),
]


def counts(session: Session) -> dict[str, dict[str, int]]:
    return {label: {"all": session.scalar(select(func.count()).select_from(model)),
                    "mock": session.scalar(select(func.count()).select_from(model).where(cond))}
            for label, model, cond in COUNT_TABLES}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--purge", action="store_true", help="delete every mock row and stop")
    ap.add_argument("--dry-run", action="store_true", help="do everything, then roll back")
    ap.add_argument("--counts", action="store_true", help="print table counts and stop")
    args = ap.parse_args()
    get_engine()
    from app.db import _SessionLocal

    with _SessionLocal() as session:
        if args.counts:
            print(json.dumps(counts(session), indent=1))
            return
        removed = purge(session)
        print("purged:", json.dumps({k: v for k, v in removed.items() if v}))
        if not args.purge:
            print("loaded:", json.dumps(load(session)))
        if args.dry_run:
            print("after (rolled back):", json.dumps({k: v["all"] for k, v in counts(session).items()}))
            session.rollback()
            return
        session.commit()
        print("rows now:", json.dumps({k: v["all"] for k, v in counts(session).items()}))


if __name__ == "__main__":
    main()
