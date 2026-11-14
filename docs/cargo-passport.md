# Cargo passport

## Purpose

A cargo passport brings together what a cargo item contains, how it will be transported and used, and the evidence supporting its fire safety. It helps a designer or reviewer answer:

> What evidence supports bringing and using this particular item in this particular environment—and what is missing?

The passport describes the assembled item and its operations. For a battery-powered instrument, an assessment would consider its casing, battery, wiring, heat generation and surrounding materials, rather than only checking whether the casing material appears in MAPTIS.

**Status:** proposed product concept from the team's discussion. No passport implementation, predictive model or approval capability has been established. The passport organizes evidence for review; flight acceptance remains with the responsible authority.

## What the passport contains

| Component | Information to record | Why it matters |
|---|---|---|
| Identity and configuration | Item name, manufacturer, exact model, configuration version, component list, dimensions and geometry | Evidence for one model or configuration may not apply to another. |
| Materials and surroundings | Casing, insulation, wiring, exposed combustible materials, packaging, containment and nearby materials | Fire behaviour depends on the assembly and exposure, not only individual material names. |
| Potential ignition sources | Battery model and chemistry, electrical components, heaters and other heat sources; relevant operating states | Connects possible ignition mechanisms to the materials they could affect. |
| Intended environment and use | Transport, stowage, charging and operation; oxygen concentration, pressure, gravity, ventilation and enclosure conditions | Shows whether supporting tests represent the intended scenario. |
| Prevention evidence | Applicable requirements, material and equipment tests, design controls, containment and operating limits | Explains how ignition and propagation hazards are addressed. |
| Mitigation and recovery references | Applicable approved response documents, where available; suppression evidence, isolation provisions and known post-fire hazards | Connects prevention to response if ignition occurs. Public research must remain distinct from approved operational instructions. |
| Evidence status and gaps | Source, test conditions, document revision, applicability, missing information and review status | Makes uncertainty visible and helps reviewers identify the next evidence needed. |

Missing values remain unknown. An official approval or review status is recorded only when supported by an identifiable authority and document; the app does not assign approval itself.

## Illustrative user journey

This example describes intended behaviour, not a completed assessment or test result.

1. A payload designer creates a passport for a battery-powered instrument and identifies its exact configuration.
2. The designer records its materials, battery, wiring, heat sources and intended transport, stowage and operating conditions.
3. The passport links applicable requirements and relevant material, battery and combustion evidence.
4. It shows which conditions match, which differ, and which required information is missing.
5. A reviewer can trace each claim to its source and identify further analysis, tests or documentation needed.
6. The passport links applicable mitigation documents and describes evidence gaps without generating emergency instructions.

For example, a casing material test may be relevant while battery propagation evidence is missing. The passport should display those as separate findings, not combine them into an unsupported “safe” label.

## Evidence sources and their roles

The [data sources catalogue](../data/data-sources-catalog.md) contains descriptions, links, relevance and access limits for the sources discussed so far.

| Source family | Role in the passport | What it does not establish by itself |
|---|---|---|
| ISS cargo and payload requirements | Identify applicable review, material, battery, hazardous-material and integration requirements | Approval of a particular assembled item or shipment |
| MAPTIS and public material studies | Provide material-specific test results and ratings under documented conditions | Safety of every configuration containing that material; MAPTIS access and reuse remain to be established |
| PSI combustion experiments | Supply observed burning, spread, suppression and smoke behaviour under selected space or ground conditions | A mission accident probability or universal rule for all cargo |
| Earth-based freefall experiments | Support comparisons and possible model development under short-duration microgravity | Sustained burning behaviour beyond the test window or transfer to different conditions |
| Battery failure studies | Describe consequences of induced failure for tested cells or assemblies | Mission failure likelihood, automatic transfer to microgravity, or ignition of adjacent materials without a validated connection |
| NASA fire-protection guidance and suppression research | Explain response principles, design provisions and post-fire hazards | A verified current vehicle-specific crew checklist |

## Prevention and mitigation

**Prevention:** the passport helps identify ignition sources, combustible materials and relevant controls before the item flies or is used. It connects requirements to supporting evidence and exposes gaps in configuration or environmental coverage.

**Mitigation:** the passport connects the item to applicable response references and evidence about suppression, smoke, isolation and recovery. It preserves the distinction between published research, general guidance and approved procedures for the particular vehicle and equipment.

Turning off electrical power, suppressing visible flames and stopping an internal battery failure are different outcomes. The passport should not imply that evidence for one proves the others.

## Proposed first version

Start with one fully described cargo item and one intended environment. Build a source-linked evidence record that:

- Identifies the exact item and configuration.
- Links relevant requirements and tests.
- Compares documented test conditions with intended conditions.
- Lists missing evidence and unresolved applicability questions.
- Separates prevention findings from mitigation references.

Prediction is a possible later extension. Our freefall-to-space hypothesis would need independent validation against suitable PSI runs before its outputs could support passport conclusions. Changes in fuel, geometry, oxygen, pressure, airflow and duration must be accounted for; orbital validation does not establish lunar or Martian gravity behaviour.

## Rules for presenting conclusions

- Label observed test results, model predictions, illustrative scenarios and unknowns separately.
- Keep exact material and component identifiers, source links, conditions and document revisions attached to claims.
- Treat a match as relevant evidence, not automatic approval. Explain material differences in conditions or configuration.
- Preserve official review decisions as attributed records; do not invent certification, numerical risk scores or mission failure probabilities.
- Reassess evidence applicability when the item configuration or intended use changes.

The next product decision is which cargo item and user to demonstrate first. A designer preparing evidence and a reviewer checking that evidence are proposed starting roles; the team has not yet selected between them.
