# Mock cargo and material flammability evidence

Research reference for the **Flame in Freefall** challenge · Team Five-Body Problem · 14 November 2026

This document applies the sources in section 3 of the [data sources catalogue](../../data/data-sources-catalog.md#3-material-flammability-and-model-properties) (material flammability and model properties). It is organized by **object**, as a [cargo passport](../cargo-passport.md) would be. Each mock cargo item lists its own materials, their tested limits and storage conditions, and one verdict for the object as a whole. The detailed evidence for each material is in the reference section at the end.

The objects and mass shares are illustrative, not measured or confirmed mission hardware. **The verdicts are evidence comparisons, not flight approvals.** Flight acceptance belongs to the responsible safety review. The ISS safety requirements allow some combustible items when reviewed controls are in place, such as containment, stowage limits or use restrictions; see SSP 51721 in the [catalogue](../../data/data-sources-catalog.md#6-iss-cargo-and-payload-acceptance-requirements).

## Key terms and units

- **MOC** (maximum oxygen concentration) is the highest O₂ level at which a material passes NASA-STD-6001 Test 1 (upward flame propagation, Earth gravity), at a fixed pressure.
- **LOI** (limiting oxygen index, ASTM D2863) is a different test at about 1 atm. It is not interchangeable with MOC.

MOC usually rises as total pressure falls ([Hirsch et al. 2006](https://ntrs.nasa.gov/api/citations/20070005041/downloads/20070005041.pdf)). A result at one pressure therefore does not transfer to another.

Pressures are absolute. Conversions: 7.0 psia ≈ 48.2 kPa, 8.2 psia ≈ 56.5 kPa, 10.2 psia ≈ 70.3 kPa, 12.4 psia ≈ 85.3 kPa, 14.7 psia ≈ 101.3 kPa.

## Stations included

Only stations with a **published cabin atmosphere** are included. Among the space environments in [environment dimensions](environment-dimensions.md), only the ISS has a sourced nominal cabin atmosphere in the repository notes. The generalized spacecraft profile supplies illustrative assumptions, so it is excluded:

| Station | Gravity | Cabin O₂ / total pressure | Source |
|---|---|---|---|
| [ISS](iss.md) | Microgravity | ~21% / ~101 kPa (nominal) | [ISS note](iss.md) |

The NASA lunar base, ILRS, Lunar Gateway, NASA Mars base and Mars orbital habitat are not included. No cabin atmosphere has been published for any of them.

## Verdicts

- **Yes:** every component has a passing test result at the station's O₂ level and pressure.
- **Only with controls:** at least one component burns at the station's atmosphere. Acceptance would depend on reviewed controls such as containment or stowage limits.
- **Undetermined:** nothing is known to burn, but at least one component has no test result at the station's atmosphere.

In the object tables, the **oxygen ceiling** is the highest O₂ level at which the material passed Test 1 at the stated pressure. An object's storage conditions are set by its most limiting material.

## Mock cargo

### Crew clothing kit

**Purpose:** personal clothing for one crew member, packed in a bag.

| Component | Material (tested form) | Share by mass | Oxygen ceiling | Storage temperature |
|---|---|---|---|---|
| Garments | Cotton, untreated | 70% | None; burns in air (LOI 18%) | No source |
| Stowage bag | Nomex HT90-40, single layer | 25% | 25% at 70.3 kPa | ≤220 °C (sleeving value) |
| Handles | Kevlar/PBI webbing, natural | 5% | 37% at 56.5 kPa | Not stated |

**Object storage conditions:** Oxygen: no ceiling; the cotton burns in air. Temperature: not established; no source for cotton.

**ISS verdict: Only with controls**

### Portable science instrument

**Purpose:** handheld measuring device with its own battery.

| Component | Material (tested form) | Share by mass | Oxygen ceiling | Storage temperature |
|---|---|---|---|---|
| Enclosure | PMMA cast sheet | 40% | None; burns in air (LOI 17.3%) | ≤80 °C service |
| Battery pack | Lithium-ion cells (no evidence in this document) | 30% | No evidence | No evidence |
| Gaskets | Silicone rubber, ~1.5 mm | 10% | 21% at 101.3 kPa; 23% at 85.3 kPa; 28% at 48.2 kPa | −60 to 230 °C |
| Wiring | PTFE-insulated wire | 10% | No passing result; an M22759 wire failed Test 4 at 30% / 70.3 kPa | 200–260 °C wire rating |
| Carry strap | Kevlar/PBI webbing, black | 10% | 35% at 56.5 kPa | Not stated |

**Object storage conditions:** Oxygen: no ceiling; the PMMA enclosure burns in air. Temperature: at most 80 °C (PMMA); battery limits unknown.

**ISS verdict: Only with controls**

### Coolant hose assembly

**Purpose:** flexible fluid line for a thermal-control loop.

| Component | Material (tested form) | Share by mass | Oxygen ceiling | Storage temperature |
|---|---|---|---|---|
| Hose | Silicone rubber, ~1.5 mm | 70% | 21% at 101.3 kPa; 23% at 85.3 kPa; 28% at 48.2 kPa | −60 to 230 °C |
| Inner liner | PTFE resin, ~1.5 mm | 25% | 42% at 101.3 kPa; 46% at 85.3 kPa; 53% at 48.2 kPa | ≤260 °C |
| Abrasion sleeve | Nomex HT90-40, single layer | 5% | 25% at 70.3 kPa | ≤220 °C (sleeving value) |

**Object storage conditions:** Oxygen: not established; Nomex has no result at the pressures where silicone and PTFE were tested. Temperature: −60 to 220 °C (silicone lower bound, Nomex sleeving upper bound).

**ISS verdict: Undetermined**

### Seal and gasket spares kit

**Purpose:** replacement seals for hatches and equipment.

| Component | Material (tested form) | Share by mass | Oxygen ceiling | Storage temperature |
|---|---|---|---|---|
| Seals | PTFE resin, ~1.5 mm | 80% | 42% at 101.3 kPa; 46% at 85.3 kPa; 53% at 48.2 kPa | ≤260 °C |
| O-rings | Silicone rubber, ~1.5 mm | 20% | 21% at 101.3 kPa; 23% at 85.3 kPa; 28% at 48.2 kPa | −60 to 230 °C |

**Object storage conditions:** Oxygen: up to 21% at 101.3 kPa, 23% at 85.3 kPa or 28% at 48.2 kPa; silicone limits the kit. Temperature: −60 to 230 °C (silicone).

**ISS verdict: Yes**

### Crew restraint net

**Purpose:** holds loose items and crew in place.

| Component | Material (tested form) | Share by mass | Oxygen ceiling | Storage temperature |
|---|---|---|---|---|
| Net webbing | Kevlar/PBI webbing, natural | 90% | 37% at 56.5 kPa | Not stated |
| Edge binding | Nomex HT90-40, single layer | 10% | 25% at 70.3 kPa | ≤220 °C (sleeving value) |

**Object storage conditions:** Oxygen: not established; the two materials were tested at different pressures, neither at 101.3 kPa. Temperature: not established; no value for the webbing.

**ISS verdict: Undetermined**

## Limits

- **TB 26-05:** facts come from NASA's bulletin web page. The PDF text did not extract, so the image-only results table and the offgassing results were not reviewed. The MAPTIS records were not opened.
- **Secondary sources:** PMMA LOI, Nomex LOI and temperature, PTFE and silicone LOI and storage values come from vendor, distributor or secondary sources, not primary manufacturer guides.
- **Not opened:** the Saffire silicone MOC paper ([NTRS 20150022123](https://ntrs.nasa.gov/citations/20150022123)) reports per-thickness MOCs that were not reviewed.
- **Unconfirmed uses:** that ISS cargo transfer bags are Nomex and that ISS wiring is PTFE was not confirmed from a NASA primary source.
- **Mock cargo:** objects and mass shares are invented for demonstration. Real items need their exact products, thicknesses and assembly evaluated. Silicone passes at the ISS only at its limit (MOC 21%), and no battery evidence is included.

## Sources

- PSI BASS: [10.60555/58h4-dy80](https://doi.org/10.60555/58h4-dy80)
- PSI BASS-II: [10.60555/4qc4-de67](https://doi.org/10.60555/4qc4-de67)
- PSI Saffire-I: [10.60555/0t15-1z43](https://doi.org/10.60555/0t15-1z43)
- PSI Saffire-II: [10.60555/2chp-m469](https://doi.org/10.60555/2chp-m469)
- PSI Saffire-III: [10.60555/040q-4h36](https://doi.org/10.60555/040q-4h36)
- [Röhm PLEXIGLAS GS datasheet 211-1](https://www.voskunststoffen.nl/files/166151/datasheet%20plexiglas%20XT%20GS.pdf)
- [Urban & Ruff 2016](https://ntrs.nasa.gov/api/citations/20160010292/downloads/20160010292.pdf)
- [Olson et al. 2014](https://ntrs.nasa.gov/api/citations/20150004099/downloads/20150004099.pdf)
- [USDA-ARS cotton LOI study](https://digitalcommons.unl.edu/usdaarsfacpub/1115)
- [Hirsch et al. 2010](https://ntrs.nasa.gov/api/citations/20100015582/downloads/20100015582.pdf)
- [Hirsch et al. 2007](https://ntrs.nasa.gov/api/citations/20070018178/downloads/20070018178.pdf)
- [Hirsch et al. 2006](https://ntrs.nasa.gov/api/citations/20070005041/downloads/20070005041.pdf)
- [Polymax silicone rubber sheeting datasheet](https://www.polymax.co.uk/media/documents/Datasheet/general-purpose-silicone-rubber-sheeting.pdf)
- [Plastics International PTFE datasheet](https://www.plasticsintl.com/media/trshlm53/ptfe-data-sheet.pdf)
- [IEWC M22759/6 specification sheet](https://media.iewc.com/SpecificationSheets/M22759-6_SS.pdf)
- [NASA TB 26-05: Webbings for Use in Elevated Oxygen Environments](https://www.nasa.gov/centers-and-facilities/nesc/tb-26-05-webbings-for-use-in-elevated-oxygen-environments/)
- [NASA-STD-6001](https://standards.nasa.gov/standard/NASA/NASA-STD-6001)
- [NASA White Sands Test Facility](https://www.nasa.gov/centers-and-facilities/white-sands/flammability/)
- [MAPTIS](https://maptis.nasa.gov/)

Confirm all values against primary sources before quoting them in the app.

*SI disclosure: compiled with AI assistance from the linked NASA sources, local PSI experimental tables and the team's research context.*
