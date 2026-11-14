"""Validate the real seed directory and the invariants the docs impose on it."""

from pathlib import Path

import pytest
import yaml

from app.enums import Dimension, ValueStatus
from app.ingest.seed_yaml import Seed, load_seed

SEED_DIR = Path(__file__).resolve().parents[1] / "seed"


@pytest.fixture(scope="module")
def seed() -> Seed:
    return load_seed(SEED_DIR)


def cond(seed: Seed, env_id: str, space: str, dim: Dimension):
    env = next(e for e in seed.environments if e.id == env_id)
    return env.conditions[space][dim]


def test_counts(seed):
    documented = [e for e in seed.environments if (e.doc_path or "").startswith("docs/environments/")]
    assert len(documented) == 11  # 6 space + 4 Earth + lunar elevated-O2 scenario
    assert {r.id for r in seed.routes} == {f"R{i:02d}" for i in range(1, 25)}
    assert len(seed.materials) == 8
    assert len(seed.cargo) == 5
    assert seed.findings == [] and seed.reference_passages == []


def test_iss_nominal_cabin_is_sourced(seed):
    o2 = cond(seed, "iss", "cabin", Dimension.o2_fraction)
    p = cond(seed, "iss", "cabin", Dimension.pressure_kpa)
    assert (o2.status, o2.value_min) == (ValueStatus.sourced, 0.21)
    assert (p.status, p.value_min) == (ValueStatus.sourced, 101)


@pytest.mark.parametrize(
    "env_id",
    ["lunar-base-nasa", "lunar-base-china", "lunar-gateway", "martian-base-nasa", "martian-orbital-station-nasa"],
)
def test_unpublished_cabins_stay_unknown(seed, env_id):
    for dim in (Dimension.o2_fraction, Dimension.pressure_kpa):
        c = cond(seed, env_id, "cabin", dim)
        assert c.status == ValueStatus.unknown and c.value_min is None and c.value_max is None


def test_elevated_o2_only_as_scenario(seed):
    o2 = cond(seed, "lunar-elevated-o2-scenario", "cabin", Dimension.o2_fraction)
    p = cond(seed, "lunar-elevated-o2-scenario", "cabin", Dimension.pressure_kpa)
    assert (o2.status, o2.value_min, o2.value_max) == (ValueStatus.assumption, 0.30, None)
    assert (p.status, p.value_min, p.value_max) == (ValueStatus.assumption, None, 70.3)
    others = [e for e in seed.environments if e.id != "lunar-elevated-o2-scenario"]
    for e in others:
        for dims in e.conditions.values():
            assert dims[Dimension.o2_fraction].value_min != 0.30


def test_earth_values_are_estimates(seed):
    for e in seed.environments:
        if e.domain == "earth" and e.maturity == "estimate":
            for dims in e.conditions.values():
                assert {c.status for c in dims.values()} <= {ValueStatus.estimate, ValueStatus.unknown}


def test_mass_shares_sum_to_one(seed):
    for c in seed.cargo:
        assert sum(comp.mass_share for comp in c.config.components) == pytest.approx(1.0), c.slug


def test_battery_pack_unmatched(seed):
    inst = next(c for c in seed.cargo if c.slug == "portable-science-instrument")
    battery = next(comp for comp in inst.config.components if comp.name == "Battery pack")
    assert battery.material_id is None and battery.identity_confidence == "unmatched"


def test_no_verdicts_stored():
    text = (SEED_DIR / "cargo.yaml").read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    assert "verdict" not in yaml.safe_dump(data).lower()
    assert "Only with controls" not in text and "Undetermined" not in text


def test_bad_reference_is_rejected(tmp_path):
    for f in SEED_DIR.glob("*.yaml"):
        (tmp_path / f.name).write_text(f.read_text(encoding="utf-8"), encoding="utf-8")
    routes = tmp_path / "routes.yaml"
    routes.write_text(routes.read_text(encoding="utf-8").replace("to_env: iss", "to_env: nowhere", 1))
    with pytest.raises(ValueError, match="unknown environment 'nowhere'"):
        load_seed(tmp_path)
