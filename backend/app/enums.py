"""Controlled vocabularies. Stored as text with CHECK constraints (not native PG enums) so
adding a value is a one-line migration."""

from enum import StrEnum


class SourceKind(StrEnum):
    psi_investigation = "psi_investigation"
    paper = "paper"
    standard = "standard"  # e.g. NASA-STD-6001, SSP 51721
    guidance = "guidance"  # e.g. OCHMO-TB-008
    datasheet = "datasheet"
    web = "web"
    internal_doc = "internal_doc"  # team research notes in docs/


class Hazard(StrEnum):
    fire = "fire"
    toxicity = "toxicity"
    biological = "biological"


class ValueStatus(StrEnum):
    """Provenance of a condition value. `unknown` is never stored as zero."""

    sourced = "sourced"
    estimate = "estimate"  # analyst-selected planning estimate (e.g. Earth profiles)
    assumption = "assumption"
    derived = "derived"  # computed from other values, e.g. O2 partial pressure
    unknown = "unknown"


class Dimension(StrEnum):
    """Internal units: fraction, kPa, m/s, degC, percent."""

    o2_fraction = "o2_fraction"
    pressure_kpa = "pressure_kpa"
    airflow_ms = "airflow_ms"
    temperature_c = "temperature_c"
    relative_humidity_pct = "relative_humidity_pct"
    co2_fraction = "co2_fraction"
    n2_fraction = "n2_fraction"


class GravityRegime(StrEnum):
    earth = "earth"
    microgravity = "microgravity"
    lunar = "lunar"
    martian = "martian"
    unknown = "unknown"


class MatchConfidence(StrEnum):
    """How a raw label maps to a material identity. Generic labels never become `exact`."""

    exact = "exact"
    related = "related"
    unmatched = "unmatched"


class TestMethod(StrEnum):
    psi_flight = "psi_flight"
    psi_ground = "psi_ground"
    std6001_test1 = "std6001_test1"  # upward flame propagation, 1 g
    std6001_test4 = "std6001_test4"  # wire insulation
    astm_d2863 = "astm_d2863"  # LOI, ~1 atm; not interchangeable with MOC
    other = "other"


class EnvDomain(StrEnum):
    space = "space"
    earth = "earth"


class EnvMaturity(StrEnum):
    operating = "operating"
    planned = "planned"
    paused = "paused"
    concept = "concept"
    estimate = "estimate"


class RouteStatus(StrEnum):
    supported = "supported"
    study = "study"  # agency study concept, not a planned service (e.g. Mars routes)
    historical = "historical"
    hypothetical = "hypothetical"


class Origin(StrEnum):
    seeded = "seeded"
    user = "user"


class Provenance(StrEnum):
    illustrative = "illustrative"
    real = "real"


class UseState(StrEnum):
    stowed = "stowed"
    operating = "operating"
    charging = "charging"
    maintenance = "maintenance"


class AssessmentStatus(StrEnum):
    """`unassessed` is distinct from an attributed finding of no applicable hazard."""

    evidence_found = "evidence_found"
    gap = "gap"
    unassessed = "unassessed"
    attributed_no_hazard = "attributed_no_hazard"


class ReviewStatus(StrEnum):
    draft = "draft"
    verified = "verified"
    rejected = "rejected"


class FindingTopic(StrEnum):
    prevention = "prevention"
    detection = "detection"
    suppression = "suppression"
    general = "general"


class NormalizationStatus(StrEnum):
    metadata_only = "metadata_only"
    partial = "partial"
    normalized = "normalized"
