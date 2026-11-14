# Submarines: occupied compartments and equipment spaces

Environment profile for **Flame in Freefall** · 14 November 2026

Proposed extension of the [Earth use cases](../../earth-use-cases.md), whose Earth-benefits table names submarines through FLEX and DAFT. Unlike the first three profiles, this setting has no use-case card in that source. The spaces, users and passport workflow below are proposed for this comparison, not specifications for a named vessel.

A submarine equipment or safety engineer could use the Cargo Passport to compare an item's batteries, casing, cables and packaging with evidence for the compartment where it will be stored, installed or operated. Smoke in an enclosed vessel can affect both the occupied space and the ability to reach equipment; access, ventilation and isolation therefore belong beside the material evidence.

## Spaces and activities

| Space or stage | What happens | What to distinguish |
|---|---|---|
| Occupied compartments | People live and work with onboard equipment. | Local atmosphere, occupancy, ventilation connections and escape routes. |
| Equipment and battery spaces, where present | Electrical equipment operates, and batteries may charge or discharge. | Vessel type, chemistry, enclosure, cooling, ventilation and access; do not assume every submarine uses the same propulsion or battery system. |
| Stowage and maintenance | Supplies are stored and components inspected or replaced. | Packaging, nearby materials, powered/isolated state and changed configurations. |
| Submerged, surfaced and alongside | External conditions and access to outside help change. | Record operating state, depth and response constraints separately from compartment gas conditions. |

## Operating scenario

The following are explicit modelling assumptions for one representative example. Physical estimates follow in the next table.

| Dimension | Estimated scenario | Basis and limits |
|---|---|---|
| Materials and state | Occupied compartment with cables, polymer furnishings and one illustrative 100 Wh lithium-ion portable device at 50% state of charge. | Portable equipment scenario; propulsion batteries and machinery spaces require separate profiles. |
| Occupancy and access | 60 people aboard the illustrative vessel; 6 people in the modelled compartment. | Selected medium-sized crewed-vessel scenario; compartment occupancy is not refuge capacity. |
| Protection and resilience | Assume smoke detection, portable extinguishers, emergency breathing equipment, compartment isolation, forced ventilation and CO₂ removal. | Assumed functions, not a verified inventory; capacity and endurance require vessel-specific records before assessing survival or suppression. |
| Deployment and repair | Illustrative 30-day deployment with onboard minor repairs and resupply at port. | Planning duration, not a guaranteed autonomy or rescue interval; do not assume immediate surfacing. |
| Exterior | Selected depth 100–300 m; water pressure approximately 1.11–3.12 MPa absolute; seawater 2–20 °C. | Pressure derived from 101.3 kPa + ρgh with ρ = 1,025 kg/m³ and g = 9.81 m/s²; temperature is a selected scenario band, not a worldwide depth rule. |

## Estimated baseline for comparison

An occupied, air-filled compartment inside a submarine pressure hull, with atmosphere control operating normally. This is not a diving chamber or a flooded compartment; interior gas pressure does not follow external water pressure.

**Evidence status: analyst-selected planning estimates, added at the user’s request.** These are plausible starting inputs, not measurements, validated operating limits or a survey of typical installations. Replace estimates when a specific installation is selected. Gravity is approximately **1g (9.81 m/s²)** in all four baselines.

| Dimension | Estimated value | Basis and limits |
|---|---|---|
| Total gas pressure | 95–105 kPa absolute | Near-atmospheric planning assumption, not a vessel-specific operating range. |
| Oxygen concentration | 20–21% by volume on a dry-gas basis | Assumed controlled-air band for comparison; not an operating instruction or physiological limit. |
| Oxygen partial pressure | 19.0–22.1 kPa | Derived bounding products: 95 × 0.20 and 105 × 0.21, rounded; combinations are not measured states. |
| Local airflow | 0.05–0.3 m/s in an occupied space | Chosen forced-ventilation comparison range; stagnant recesses and supply jets need separate values. |
| Air temperature | 18–28 °C | Assumed occupied-compartment range; machinery and battery spaces can differ. |
| Relative humidity | 40–70% | Assumed comparison range; cold hull surfaces may still cause local condensation. |
| Space dimensions and volume | Compartment: 6 × 4 × 2.2 m ≈ 52.8 m³ | Illustrative rectangular envelope, not a vessel plan; hull curvature and equipment reduce free gas volume. |

For this submarine scenario, use a dry-gas model of 20–21% O₂, 0.5% CO₂, 0.9% argon and N₂ as the balance (77.6–78.6%). The CO₂ value is a modelling assumption, not a recommended exposure limit. Humidity, CO₂ accumulation and fault gases require separate inputs. Local speed is not an air-change rate: do not infer room ventilation performance from these ranges.

## Evidence transfer and limits

**Transfer: method plus potentially relevant research data.** [DAFT (PSI-47)](../../../data/investigations/PSI-47.json) explicitly identifies submarines and underwater laboratories as potential beneficiaries of smoke-detection instrument development. [FLEX (PSI-69)](../../../data/investigations/PSI-69.json) also names submarines in its Earth-benefit text. These statements identify research connections; they do not report validation aboard a submarine.

The stored FLEX summary groups submarines with “confined and reduced-gravity environments.” That wording must not be treated as a physical description of a submarine: this profile uses approximately 1g and estimates interior pressure at 95–105 kPa absolute. FLEX's microgravity droplet-combustion results do not establish battery or solid-material fire behaviour in a submarine. DAFT's instrument findings likewise require comparison with the actual airflow, smoke sources and detector installation.

**Illustrative comparison:** an engineer replacing a device checks whether its smoke-detection evidence covers the ventilation path and enclosure at the new location. Evidence from an open test chamber leaves the installed enclosure's behaviour unresolved. This illustrates the proposed workflow, not a measured result.

Applicable operator, naval or civilian requirements depend on the vessel and jurisdiction; none were verified for this profile. The passport organises evidence and gaps, and does not approve equipment or select a suppression agent. See the [shared environment dimensions](../environment-dimensions.md). No new external verification was performed.
