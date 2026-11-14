"""Schema-level invariants, run against the configured database inside a rolled-back transaction."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, StatementError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Environment, EnvironmentCondition, MaterialLabel, Observation, Source


@pytest.fixture
def session():
    engine = create_engine(get_settings().database_url)
    with engine.connect() as conn:
        trans = conn.begin()
        with Session(bind=conn, join_transaction_mode="create_savepoint") as s:
            yield s
        trans.rollback()


@pytest.fixture
def source(session):
    src = Source(id="test-src", kind="web", title="Test source")
    session.add(src)
    session.flush()
    return src


def _env(session):
    env = Environment(id="test-env", name="Test", domain="space", gravity_regime="lunar", maturity="concept")
    session.add(env)
    session.flush()
    return env


def test_unknown_condition_cannot_have_a_value(session):
    env = _env(session)
    session.add(EnvironmentCondition(environment_id=env.id, dimension="o2_fraction", status="unknown", value_min=0))
    with pytest.raises(IntegrityError):
        session.flush()


def test_known_condition_requires_a_value(session):
    env = _env(session)
    session.add(EnvironmentCondition(environment_id=env.id, dimension="o2_fraction", status="sourced"))
    with pytest.raises(IntegrityError):
        session.flush()


def test_o2_is_a_fraction(session, source):
    session.add(
        Observation(
            source_id=source.id, locator="r1", test_method="psi_flight", gravity_regime="microgravity",
            o2_min=21, o2_max=21, raw={},
        )
    )
    with pytest.raises(IntegrityError):
        session.flush()


def test_unmatched_label_has_no_material(session, source):
    session.add(MaterialLabel(raw_label="PMMA", source_id=source.id, match_confidence="exact"))
    with pytest.raises(IntegrityError):
        session.flush()


def test_enum_values_are_validated(session):
    with pytest.raises((StatementError, LookupError)):
        session.add(Source(id="bad", kind="blog", title="x"))
        session.flush()
