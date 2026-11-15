"""Database schema for the Cargo Passport backend.

Layers:
  * Reference evidence (seeded from the repo, read-only at runtime): sources, investigations,
    materials, material_labels, observations, findings, reference_passages.
  * Environments: environments, environment_conditions, routes.
  * Cargo & scenarios (seeded + user-created via share links): cargo_items, cargo_configs,
    components, scenarios, scenario_conditions, hazard_assessments, assessment_evidence.
  * Delivery: shares, si_explanations, passport_exports.

Invariants (see docs/build-plan.md sections 6-7):
  * Every condition value carries a ValueStatus; unknown is NULL, never zero.
  * Ranges are kept as min/max plus the raw cell text.
  * Generic material labels are not silently matched to a specific specimen.
  * No safety verdicts/scores are stored; coverage and comparisons are computed in code.
"""

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Column,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.enums import (
    AssessmentStatus,
    Dimension,
    EnvDomain,
    EnvMaturity,
    FindingTopic,
    GravityRegime,
    Hazard,
    MatchConfidence,
    NormalizationStatus,
    Origin,
    Provenance,
    ReviewStatus,
    RouteStatus,
    SourceKind,
    TestMethod,
    UseState,
    ValueStatus,
)


def enum_col(e: type[StrEnum], **kw: Any) -> Enum:
    return Enum(
        e,
        name=e.__name__.lower(),
        native_enum=False,
        create_constraint=True,
        length=32,
        values_callable=lambda x: [m.value for m in x],
        validate_strings=True,
        **kw,
    )


def range_checks(prefix: str, lo: float | None = None, hi: float | None = None) -> list[CheckConstraint]:
    """min <= max, and optional absolute bounds, for a {prefix}_min/{prefix}_max pair."""
    checks = [
        CheckConstraint(
            f"{prefix}_min IS NULL OR {prefix}_max IS NULL OR {prefix}_min <= {prefix}_max",
            name=f"{prefix}_ordered",
        )
    ]
    if lo is not None:
        checks.append(CheckConstraint(f"{prefix}_min IS NULL OR {prefix}_min >= {lo}", name=f"{prefix}_lo"))
    if hi is not None:
        checks.append(CheckConstraint(f"{prefix}_max IS NULL OR {prefix}_max <= {hi}", name=f"{prefix}_hi"))
    return checks


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Reference evidence
# ---------------------------------------------------------------------------


class Source(TimestampMixin, Base):
    """Any citable thing: PSI investigation, paper, standard, guidance, datasheet, web page."""

    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)  # stable slug, e.g. "psi-26-bass"
    kind: Mapped[SourceKind] = mapped_column(enum_col(SourceKind))
    title: Mapped[str] = mapped_column(Text)
    doi: Mapped[str | None] = mapped_column(String(120))
    url: Mapped[str | None] = mapped_column(Text)
    publisher: Mapped[str | None] = mapped_column(Text)
    revision: Mapped[str | None] = mapped_column(String(80))
    published_on: Mapped[str | None] = mapped_column(String(32))  # partial dates allowed ("2006", "2026-03")
    accessed_on: Mapped[str | None] = mapped_column(String(32))
    access_notes: Mapped[str | None] = mapped_column(Text)  # e.g. "MAPTIS restricted", "PDF text did not extract"


class Investigation(Base):
    """PSI investigation metadata (24 combustion investigations in data/investigations)."""

    __tablename__ = "investigations"

    accession: Mapped[str] = mapped_column(String(16), primary_key=True)  # "PSI-26"
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), unique=True)
    acronym: Mapped[str | None] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(Text)
    objective: Mapped[str | None] = mapped_column(Text)
    hypothesis: Mapped[str | None] = mapped_column(Text)
    approach: Mapped[str | None] = mapped_column(Text)
    hardware: Mapped[str | None] = mapped_column(Text)
    flight_program: Mapped[str | None] = mapped_column(Text)
    research_area: Mapped[str | None] = mapped_column(Text)
    sub_research_area: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[str | None] = mapped_column(String(32))
    end_date: Mapped[str | None] = mapped_column(String(32))
    normalization_status: Mapped[NormalizationStatus] = mapped_column(
        enum_col(NormalizationStatus), default=NormalizationStatus.metadata_only
    )
    raw: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)

    source: Mapped[Source] = relationship()


class Material(TimestampMixin, Base):
    """A specific tested specimen identity (formulation + form + thickness), not a generic name."""

    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)  # e.g. "pmma-cast-sheet"
    canonical_name: Mapped[str] = mapped_column(Text)
    material_class: Mapped[str | None] = mapped_column(String(40))  # polymer, fabric, elastomer, composite...
    formulation: Mapped[str | None] = mapped_column(Text)
    form: Mapped[str | None] = mapped_column(String(40))  # sheet, fabric, sphere, rod, wire insulation...
    thickness_m: Mapped[float | None] = mapped_column(Numeric)
    notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (CheckConstraint("thickness_m IS NULL OR thickness_m > 0", name="thickness_positive"),)


class MaterialLabel(Base):
    """A material name exactly as written in a source, and how (or whether) it maps to a Material."""

    __tablename__ = "material_labels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    raw_label: Mapped[str] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"))
    material_id: Mapped[str | None] = mapped_column(ForeignKey("materials.id"))
    match_confidence: Mapped[MatchConfidence] = mapped_column(enum_col(MatchConfidence))
    note: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        UniqueConstraint("raw_label", "source_id"),
        CheckConstraint(
            "(match_confidence = 'unmatched') = (material_id IS NULL)", name="unmatched_has_no_material"
        ),
    )


class Observation(TimestampMixin, Base):
    """One recorded test (or summary row) at its recorded conditions.

    Covers PSI experimental-table rows and Earth standard tests (MOC/LOI), distinguished by
    test_method. Outcome is NULL when the source does not record one; never invented.
    """

    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), index=True)
    investigation_accession: Mapped[str | None] = mapped_column(ForeignKey("investigations.accession"), index=True)
    locator: Mapped[str] = mapped_column(Text)  # "PSI-98_Experimental_table_SAFFIRE-1.csv#row=3" or "p. 12, Table 2"
    test_method: Mapped[TestMethod] = mapped_column(enum_col(TestMethod))
    hazard: Mapped[Hazard] = mapped_column(enum_col(Hazard), default=Hazard.fire)
    label_id: Mapped[int | None] = mapped_column(ForeignKey("material_labels.id"))
    material_id: Mapped[str | None] = mapped_column(ForeignKey("materials.id"), index=True)
    is_summary_row: Mapped[bool] = mapped_column(Boolean, default=False)

    o2_min: Mapped[float | None] = mapped_column(Numeric)  # volume fraction 0..1
    o2_max: Mapped[float | None] = mapped_column(Numeric)
    o2_raw: Mapped[str | None] = mapped_column(Text)
    pressure_kpa_min: Mapped[float | None] = mapped_column(Numeric)
    pressure_kpa_max: Mapped[float | None] = mapped_column(Numeric)
    pressure_raw: Mapped[str | None] = mapped_column(Text)
    airflow_ms_min: Mapped[float | None] = mapped_column(Numeric)
    airflow_ms_max: Mapped[float | None] = mapped_column(Numeric)
    airflow_raw: Mapped[str | None] = mapped_column(Text)
    flow_direction: Mapped[str | None] = mapped_column(String(32))  # concurrent, opposed, quiescent...
    gravity_regime: Mapped[GravityRegime] = mapped_column(enum_col(GravityRegime))
    gravity_g: Mapped[float | None] = mapped_column(Numeric)

    geometry: Mapped[dict[str, Any] | None] = mapped_column(JSONB)  # thickness/length/width in metres + raw
    outcome: Mapped[dict[str, Any] | None] = mapped_column(JSONB)  # e.g. {"passed": true} or {"burn_time_s": 420}
    raw: Mapped[dict[str, Any]] = mapped_column(JSONB)  # the original row, verbatim

    __table_args__ = (
        UniqueConstraint("source_id", "locator"),
        *range_checks("o2", 0, 1),
        *range_checks("pressure_kpa", 0),
        *range_checks("airflow_ms", 0),
    )


class Finding(TimestampMixin, Base):
    """Curated, source-verified claim with its supporting excerpt and applicability limits."""

    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    claim: Mapped[str] = mapped_column(Text)
    excerpt: Mapped[str] = mapped_column(Text)
    locator: Mapped[str] = mapped_column(Text)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), index=True)
    hazard: Mapped[Hazard] = mapped_column(enum_col(Hazard))
    topic: Mapped[FindingTopic] = mapped_column(enum_col(FindingTopic))

    applies_o2_min: Mapped[float | None] = mapped_column(Numeric)
    applies_o2_max: Mapped[float | None] = mapped_column(Numeric)
    applies_pressure_kpa_min: Mapped[float | None] = mapped_column(Numeric)
    applies_pressure_kpa_max: Mapped[float | None] = mapped_column(Numeric)
    applies_airflow_ms_min: Mapped[float | None] = mapped_column(Numeric)
    applies_airflow_ms_max: Mapped[float | None] = mapped_column(Numeric)
    applies_gravity_regime: Mapped[GravityRegime | None] = mapped_column(enum_col(GravityRegime))
    limits: Mapped[str] = mapped_column(Text)  # where the finding does NOT apply

    review_status: Mapped[ReviewStatus] = mapped_column(enum_col(ReviewStatus), default=ReviewStatus.draft)
    reviewed_by: Mapped[str | None] = mapped_column(String(80))

    links: Mapped[list["FindingLink"]] = relationship(back_populates="finding", cascade="all, delete-orphan")

    __table_args__ = (
        *range_checks("applies_o2", 0, 1),
        *range_checks("applies_pressure_kpa", 0),
        *range_checks("applies_airflow_ms", 0),
    )


class FindingLink(Base):
    """Links a finding to exactly one material, observation or investigation."""

    __tablename__ = "finding_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    finding_id: Mapped[str] = mapped_column(ForeignKey("findings.id", ondelete="CASCADE"), index=True)
    material_id: Mapped[str | None] = mapped_column(ForeignKey("materials.id"))
    observation_id: Mapped[int | None] = mapped_column(ForeignKey("observations.id"))
    investigation_accession: Mapped[str | None] = mapped_column(ForeignKey("investigations.accession"))

    finding: Mapped[Finding] = relationship(back_populates="links")

    __table_args__ = (
        CheckConstraint(
            "num_nonnulls(material_id, observation_id, investigation_accession) = 1", name="exactly_one_target"
        ),
    )


class ReferencePassage(TimestampMixin, Base):
    """Requirement / guidance passage (NASA-STD-6001, SSP 51721, OCHMO-TB-008...).

    Kept separate from experimental evidence; never an automated compliance determination.
    """

    __tablename__ = "reference_passages"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), index=True)
    passage: Mapped[str] = mapped_column(Text)
    locator: Mapped[str] = mapped_column(Text)
    hazard: Mapped[Hazard | None] = mapped_column(enum_col(Hazard))
    scope: Mapped[str] = mapped_column(Text)  # e.g. "ISS payloads only"
    relevance: Mapped[str | None] = mapped_column(Text)
    unresolved_applicability: Mapped[str | None] = mapped_column(Text)
    review_status: Mapped[ReviewStatus] = mapped_column(enum_col(ReviewStatus), default=ReviewStatus.draft)


# ---------------------------------------------------------------------------
# Environments and routes
# ---------------------------------------------------------------------------


class Environment(Base):
    __tablename__ = "environments"

    id: Mapped[str] = mapped_column(String(60), primary_key=True)  # "iss", "lunar-base-nasa", "earth-aircraft"
    name: Mapped[str] = mapped_column(Text)
    domain: Mapped[EnvDomain] = mapped_column(enum_col(EnvDomain))
    gravity_regime: Mapped[GravityRegime] = mapped_column(enum_col(GravityRegime))
    gravity_g: Mapped[float | None] = mapped_column(Numeric)
    maturity: Mapped[EnvMaturity] = mapped_column(enum_col(EnvMaturity))
    summary: Mapped[str | None] = mapped_column(Text)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"))
    doc_path: Mapped[str | None] = mapped_column(Text)  # e.g. "docs/environments/iss.md"

    conditions: Mapped[list["EnvironmentCondition"]] = relationship(
        back_populates="environment", cascade="all, delete-orphan"
    )


class EnvironmentCondition(Base):
    """One dimension of one space within an environment, with provenance.

    status='unknown' rows have NULL values; Mars/lunar cabins stay unknown rather than
    inheriting ISS defaults.
    """

    __tablename__ = "environment_conditions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    environment_id: Mapped[str] = mapped_column(ForeignKey("environments.id", ondelete="CASCADE"))
    space: Mapped[str] = mapped_column(String(40), default="cabin")  # cabin, hold, rack, compartment...
    dimension: Mapped[Dimension] = mapped_column(enum_col(Dimension))
    value_min: Mapped[float | None] = mapped_column(Numeric)
    value_max: Mapped[float | None] = mapped_column(Numeric)
    status: Mapped[ValueStatus] = mapped_column(enum_col(ValueStatus))
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"))
    locator: Mapped[str | None] = mapped_column(Text)
    note: Mapped[str | None] = mapped_column(Text)

    environment: Mapped[Environment] = relationship(back_populates="conditions")

    __table_args__ = (
        UniqueConstraint("environment_id", "space", "dimension"),
        *range_checks("value"),
        CheckConstraint(
            "(status = 'unknown') = (value_min IS NULL AND value_max IS NULL)", name="unknown_iff_no_value"
        ),
    )


route_sources = Table(
    "route_sources",
    Base.metadata,
    Column("route_id", ForeignKey("routes.id", ondelete="CASCADE"), primary_key=True),
    Column("source_id", ForeignKey("sources.id"), primary_key=True),
)


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(8), primary_key=True)  # "R01".."R24"
    from_env: Mapped[str] = mapped_column(ForeignKey("environments.id"))
    to_env: Mapped[str] = mapped_column(ForeignKey("environments.id"))
    status: Mapped[RouteStatus] = mapped_column(enum_col(RouteStatus))
    description: Mapped[str | None] = mapped_column(Text)
    possible_cargo: Mapped[str | None] = mapped_column(Text)
    cargo_types: Mapped[list[str]] = mapped_column(ARRAY(String(40)), default=list)

    sources: Mapped[list[Source]] = relationship(secondary=route_sources)


# ---------------------------------------------------------------------------
# Cargo and scenarios
# ---------------------------------------------------------------------------


class CargoItem(TimestampMixin, Base):
    __tablename__ = "cargo_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str | None] = mapped_column(String(80), unique=True)  # seeded items: "portable-science-instrument"
    name: Mapped[str] = mapped_column(Text)
    purpose: Mapped[str | None] = mapped_column(Text)
    provenance: Mapped[Provenance] = mapped_column(enum_col(Provenance), default=Provenance.illustrative)
    origin: Mapped[Origin] = mapped_column(enum_col(Origin))
    forked_from_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cargo_items.id"))

    configs: Mapped[list["CargoConfig"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class CargoConfig(TimestampMixin, Base):
    """Versioned configuration; conclusions never carry over between versions."""

    __tablename__ = "cargo_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cargo_items.id", ondelete="CASCADE"))
    version: Mapped[int] = mapped_column(Integer, default=1)
    assembly_notes: Mapped[str | None] = mapped_column(Text)
    supported_use_states: Mapped[list[str]] = mapped_column(ARRAY(String(32)), default=list)

    item: Mapped[CargoItem] = relationship(back_populates="configs")
    components: Mapped[list["Component"]] = relationship(
        back_populates="config", cascade="all, delete-orphan", order_by="Component.position"
    )

    __table_args__ = (UniqueConstraint("item_id", "version"),)


class Component(Base):
    __tablename__ = "components"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cargo_configs.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str] = mapped_column(Text)  # "Enclosure"
    original_label: Mapped[str] = mapped_column(Text)  # "PMMA cast sheet", as entered
    material_id: Mapped[str | None] = mapped_column(ForeignKey("materials.id"))
    identity_confidence: Mapped[MatchConfidence] = mapped_column(enum_col(MatchConfidence))
    mass_share: Mapped[float | None] = mapped_column(Numeric)  # 0..1, illustrative
    geometry: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ignition_notes: Mapped[str | None] = mapped_column(Text)

    config: Mapped[CargoConfig] = relationship(back_populates="components")

    __table_args__ = (
        CheckConstraint("mass_share IS NULL OR (mass_share >= 0 AND mass_share <= 1)", name="mass_share_fraction"),
        CheckConstraint(
            "(identity_confidence = 'unmatched') = (material_id IS NULL)", name="unmatched_has_no_material"
        ),
    )


class Scenario(TimestampMixin, Base):
    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cargo_configs.id", ondelete="CASCADE"), index=True)
    environment_id: Mapped[str] = mapped_column(ForeignKey("environments.id"))
    space: Mapped[str] = mapped_column(String(40), default="cabin")
    route_id: Mapped[str | None] = mapped_column(ForeignKey("routes.id"))
    use_state: Mapped[UseState] = mapped_column(enum_col(UseState))

    conditions: Mapped[list["ScenarioCondition"]] = relationship(
        back_populates="scenario", cascade="all, delete-orphan"
    )


class ScenarioCondition(Base):
    """Suggested value copied from the environment (with its provenance) plus an optional override.

    Gravity is not a scenario condition: it follows the environment.
    """

    __tablename__ = "scenario_conditions"

    scenario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("scenarios.id", ondelete="CASCADE"), primary_key=True
    )
    dimension: Mapped[Dimension] = mapped_column(enum_col(Dimension), primary_key=True)
    suggested_min: Mapped[float | None] = mapped_column(Numeric)
    suggested_max: Mapped[float | None] = mapped_column(Numeric)
    suggested_status: Mapped[ValueStatus] = mapped_column(enum_col(ValueStatus))
    suggested_source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"))
    override_value: Mapped[float | None] = mapped_column(Numeric)

    scenario: Mapped[Scenario] = relationship(back_populates="conditions")

    __table_args__ = (*range_checks("suggested"),)


class HazardAssessment(TimestampMixin, Base):
    """Evidence status per hazard for a component (or the whole assembly when component_id is NULL)."""

    __tablename__ = "hazard_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    component_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("components.id", ondelete="CASCADE"))
    hazard: Mapped[Hazard] = mapped_column(enum_col(Hazard))
    status: Mapped[AssessmentStatus] = mapped_column(enum_col(AssessmentStatus), default=AssessmentStatus.unassessed)
    notes: Mapped[str | None] = mapped_column(Text)

    evidence: Mapped[list["AssessmentEvidence"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("scenario_id", "component_id", "hazard", postgresql_nulls_not_distinct=True),
    )


class AssessmentEvidence(Base):
    """Links an assessment to exactly one finding, observation or reference passage."""

    __tablename__ = "assessment_evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hazard_assessments.id", ondelete="CASCADE"), index=True
    )
    finding_id: Mapped[str | None] = mapped_column(ForeignKey("findings.id"))
    observation_id: Mapped[int | None] = mapped_column(ForeignKey("observations.id"))
    reference_passage_id: Mapped[str | None] = mapped_column(ForeignKey("reference_passages.id"))
    note: Mapped[str | None] = mapped_column(Text)

    assessment: Mapped[HazardAssessment] = relationship(back_populates="evidence")

    __table_args__ = (
        CheckConstraint(
            "num_nonnulls(finding_id, observation_id, reference_passage_id) = 1", name="exactly_one_target"
        ),
    )


# ---------------------------------------------------------------------------
# Delivery: share links, SI cache, exports
# ---------------------------------------------------------------------------


class Share(TimestampMixin, Base):
    """Anonymous share link. Anyone with the slug can view; the edit token (hashed here) allows edits."""

    __tablename__ = "shares"

    slug: Mapped[str] = mapped_column(String(32), primary_key=True)
    edit_token_hash: Mapped[str] = mapped_column(String(128))
    cargo_config_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cargo_configs.id", ondelete="CASCADE"))
    scenario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("scenarios.id", ondelete="SET NULL"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SIExplanation(TimestampMixin, Base):
    """Cached grounded SI explanation, keyed by a hash of the exact inputs."""

    __tablename__ = "si_explanations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cache_key: Mapped[str] = mapped_column(String(64), unique=True)  # sha256 hex of canonical inputs
    model: Mapped[str] = mapped_column(String(120))
    inputs: Mapped[dict[str, Any]] = mapped_column(JSONB)
    output: Mapped[dict[str, Any]] = mapped_column(JSONB)
    cited_source_ids: Mapped[list[str]] = mapped_column(ARRAY(String(80)), default=list)
    citations_valid: Mapped[bool] = mapped_column(Boolean)


class PassportExport(TimestampMixin, Base):
    """Immutable snapshot of what the user downloaded."""

    __tablename__ = "passport_exports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("scenarios.id", ondelete="SET NULL"))
    share_slug: Mapped[str | None] = mapped_column(ForeignKey("shares.slug", ondelete="SET NULL"))
    snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB)
    si_disclosure: Mapped[str] = mapped_column(Text)
