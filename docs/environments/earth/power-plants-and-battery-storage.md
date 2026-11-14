# Power plants and battery energy storage

Environment profile for **Flame in Freefall** · 14 November 2026

Derived from [Earth use cases, Card B](../../earth-use-cases.md#card-b-power-plants-and-battery-energy-storage). This profile concerns battery equipment at a power facility, not combustion inside a power-generation process. Team-input fields and regulatory claims in the source remain subject to review.

A commissioning or maintenance engineer would use the passport to keep a battery module or rack's component evidence attached to its cabling, enclosure and nearby materials as equipment is installed, operated, maintained or replaced.

## Spaces and activities

| Space or stage | What happens | What to distinguish |
|---|---|---|
| Battery enclosure and rack | Modules store and deliver energy. | Cell/module/rack evidence, enclosure geometry, spacing and cooling. |
| Equipment room or outdoor installation | Racks connect to facility equipment. | Indoor/outdoor location, neighbouring equipment, barriers and responder access; the source does not choose a layout. |
| Commissioning and maintenance | Engineers install, inspect or replace components. | Original versus changed configuration, isolated versus energised equipment, and service history. |

## Operating scenario

The following are explicit modelling assumptions for one representative example. Physical estimates follow in the next table.

| Dimension | Estimated scenario | Basis and limits |
|---|---|---|
| Materials and state | Illustrative 100 kWh lithium iron phosphate rack at 50% state of charge, energised; metal enclosure and insulated cables. | Selected test scenario, not a market-average rack or a fire-load calculation. |
| Occupancy and maintenance | Normally unattended room; 2 technicians during a maintenance visit. | Scenario assumption; isolate equipment before the separate maintenance scenario. |
| Protection and response | Assume smoke/heat detection, automatic alarm, electrical isolation and a designed fixed suppression system. | Presence is a model assumption; use installation-specific agent, capacity and coverage before judging performance. |
| Exterior | Low-altitude temperate site; outdoor air −10 to 35 °C. | Selected seasonal comparison range; indoor conditions remain controlled as below. |

## Estimated baseline for comparison

An indoor, mechanically cooled battery equipment room at a low-altitude site, during normal operation. These assumptions do not describe a turbine hall, outdoor cabinet, failed cooling system or thermal runaway.

**Evidence status: analyst-selected planning estimates, added at the user’s request.** These are plausible starting inputs, not measurements, validated operating limits or a survey of typical installations. Replace estimates when a specific installation is selected. Gravity is approximately **1g (9.81 m/s²)** in all four baselines.

| Dimension | Estimated value | Basis and limits |
|---|---|---|
| Total gas pressure | 95–103 kPa absolute | Assumed low-altitude ambient-pressure room; select a different range for a high-altitude site. |
| Oxygen concentration | 20.9% by volume on a dry-gas basis | Ordinary-air assumption, excluding fault gases or an inerted enclosure. |
| Oxygen partial pressure | 19.9–21.5 kPa | Derived: 95–103 × 0.209, rounded; dry-gas approximation. |
| Local airflow | Room: 0.05–0.3 m/s; forced-air rack passage: 0.5–2 m/s | Chosen comparison ranges; rack flow only applies to a forced-air design and must be distinguished from room flow. |
| Air temperature | 18–30 °C | Assumed cooled-room range; cell and module temperatures need a separate thermal model or measurement. |
| Relative humidity | 30–60% | Assumed conditioned-room range; not an equipment humidity rating. |
| Space dimensions and volume | Room: 10 × 6 × 3 m = 180 m³; rack envelope: 1 × 1 × 2 m = 2 m³ | Illustrative geometry; rack envelope is not free gas volume. Spacing and stored energy are separate inputs. |

For this ordinary-air scenario, approximate the remaining dry gas as 78% N₂, 0.9% argon and trace gases. Humidity, CO₂ accumulation and fault gases require separate inputs. Local speed is not an air-change rate: do not infer room ventilation performance from these ranges.

## Evidence transfer and limits

**Transfer: method only.** The reviewed PSI collection supplies no battery, electrical-fault or power-plant fire evidence. ACME Flame Design's power-plant connection concerns efficiency and emissions. It must not be used to justify battery fire safety.

The source identifies NFPA 855 as a framework for stationary energy storage, with applicability dependent on the installation and locally adopted edition. Scope, thresholds and jurisdiction require verification. Battery studies in the [data sources catalogue](../../../data/data-sources-catalog.md) are candidate evidence, not locally validated support for this profile.

**Illustrative comparison:** after replacing a module, an engineer checks whether the earlier rack test covered the replacement chemistry and configuration. A matching enclosure alone leaves those questions open. This is a proposed use of the passport, not a reported test.

See the [shared environment dimensions](../environment-dimensions.md) and [source card and references](../../earth-use-cases.md). No new external verification was performed for this profile.
