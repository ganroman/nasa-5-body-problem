# Aircraft: cabins and cargo holds

Environment profile for **Flame in Freefall** · 14 November 2026

Derived from [Earth use cases, Card A](../../earth-use-cases.md#card-a-aircraft). This is a proposed environment for the Cargo Passport, not a specification for a particular aircraft. The source's team-input fields and regulatory claims still need review.

An airline cargo or cabin-equipment engineer would use the passport to compare a battery-powered device's battery, casing, wiring and packaging with evidence for its actual location and operating state. A cabin installation and a shipment in a cargo hold need separate records.

## Spaces and activities

| Space or stage | What happens | What to distinguish |
|---|---|---|
| Cabin | People use installed equipment and carry permitted items. | Installed, stowed and charging configurations; access by crew. |
| Cargo hold | Packaged items travel alongside other shipments. | Packaging, neighbouring cargo, compartment protection and access in flight. |
| Ground handling and flight | An item is loaded, transported and unloaded. | Ground and flight pressure, ventilation and temperature; actual aircraft and compartment. |

## Operating scenario

The following are explicit modelling assumptions for one representative example. Physical estimates follow in the next table.

| Dimension | Estimated scenario | Basis and limits |
|---|---|---|
| Materials and state | One illustrative 100 Wh lithium-ion device, polymer casing, insulated wiring and packaging; 30% state of charge, switched off. | Scenario choice, not shipment permission or a dangerous-goods classification. |
| Occupancy and access | 180 passengers and 6 crew for the whole-aircraft scenario; 30 passengers in the modelled cabin section. Cargo hold inaccessible during flight. | Selected example, not a capacity specification; evacuation follows landing. |
| Protection and response | Assume hold smoke detection and fixed suppression, cabin portable extinguishers, and crew intervention. | Model protection as available; agent quantities and endurance must come from the selected aircraft before assessing effectiveness. |
| Exterior | Cruise altitude 10–12 km; outside air approximately −50 to −60 °C and 19–27 kPa absolute. | Rounded standard-atmosphere estimates; interior pressure and temperature use the baseline below. |

## Estimated baseline for comparison

A pressurised passenger aircraft in cruise. Cabin and pressurised hold share the pressure assumption, but use separate temperature, humidity and airflow scenarios. Ground handling, depressurisation and unpressurised compartments are outside this baseline.

**Evidence status: analyst-selected planning estimates, added at the user’s request.** These are plausible starting inputs, not measurements, validated operating limits or a survey of typical installations. Replace estimates when a specific installation is selected. Gravity is approximately **1g (9.81 m/s²)** in all four baselines.

| Dimension | Estimated value | Basis and limits |
|---|---|---|
| Total gas pressure | 75–85 kPa absolute | Rounded cruise scenario around the source’s approximately 76 kPa reference; not a regulatory envelope. |
| Oxygen concentration | 20.9% by volume on a dry-gas basis | Assume ordinary air; humidity changes the wet-gas fraction. |
| Oxygen partial pressure | 15.7–17.8 kPa | Derived: 75–85 × 0.209, rounded; dry-gas approximation. |
| Local airflow | Cabin: 0.05–0.3 m/s; sheltered hold location: 0.01–0.1 m/s | Chosen low-speed comparison ranges, not measured ventilation performance; jets and ducts can be faster. |
| Air temperature | Cabin: 18–26 °C; selected conditioned hold: 5–25 °C | Planning ranges; not a guarantee for cargo or a battery’s internal temperature. |
| Relative humidity | Cabin: 10–30%; hold scenario: 10–50% | Assumed cruise conditions; cargo moisture and ground conditions can change these substantially. |
| Space dimensions and volume | Cabin section: 10 × 4 × 2.2 m ≈ 88 m³; hold section: 5 × 3 × 1.5 m ≈ 22.5 m³ | Illustrative rectangular sections, not whole-aircraft capacities or free-air volumes; actual fuselage shape and contents reduce usable space. |

For this ordinary-air scenario, approximate the remaining dry gas as 78% N₂, 0.9% argon and trace gases. Humidity, CO₂ accumulation and fault gases require separate inputs. Local speed is not an air-change rate: do not infer room ventilation performance from these ranges.

## Evidence transfer and limits

**Transfer: method plus potentially relevant data.** FLEX (PSI-69) names high-altitude aircraft as an Earth benefit; SAME/SAME-R concern smoke detection. FLEX's reduced-pressure fuel-droplet experiments do not establish the behaviour of a solid item or a battery in 1g. Similar pressure alone does not establish similar fire behaviour.

Card A points to aircraft material rules (14 CFR 25.853 and Appendix F), cabin pressurisation rules (14 CFR 25.841) and ICAO dangerous-goods requirements. Keep these compliance records alongside test evidence, with the applicable edition and item category. The source's current-rule checks remain open; this profile does not determine shipment eligibility or certify an installation.

**Illustrative comparison:** an engineer reviewing a device for a hold compares its packaged, unpowered configuration with the test record. A test of the bare casing does not cover the battery or surrounding packaging. This illustrates the method, not a test result.

See the [shared environment dimensions](../environment-dimensions.md) and the [source card and references](../../earth-use-cases.md) for traceability. No new external verification was performed for this profile.
