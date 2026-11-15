# Spacecraft: travel between environments

Environment profile for **Flame in Freefall** · Team Five-Body Problem · 15 November 2026

A spacecraft carries people, cargo, or both between Earth, orbital facilities and surface destinations. While an item is aboard, the vehicle is its environment: the receiving habitat's atmosphere and gravity do not describe the journey. Record each vehicle, compartment and flight phase separately.

This is a **generalized research profile**, not a design for a particular spacecraft or evidence that every route exists. A crew capsule, cargo vehicle, long-duration transit habitat and lander can use this structure, but need different values. A journey may require several vehicles; a transit habitat need not be able to land. See [cargo journeys](cargo-journes.md) for illustrative routes and their evidence limits.

## Spaces and activities

| Space or system | What happens | What to distinguish |
|---|---|---|
| Pressurized crew cabin | Crew operate equipment, eat, sleep and maintain systems. | Actual occupancy, accessible equipment and local ventilation. |
| Pressurized cargo compartment | Packaged supplies, instruments and samples travel in a controlled gas environment. | Its own atmosphere, packaging, powered state and crew access; it need not share cabin conditions. |
| Unpressurized cargo area | Externally carried hardware encounters the surroundings along the route. | Vacuum during spaceflight, shielding, component temperatures and sealed or internally pressurized equipment. |
| Docking interface or transfer passage | Crew and cargo move between connected vehicles or habitats. | Pressure equalization, hatch state, opening size and ventilation connections. An airlock is a separate feature if fitted. |
| Life support, electrical and thermal systems | Maintain cabin conditions, supply power and remove heat. | Battery locations, cooling, ventilation failures and backup endurance. |
| Propulsion and external equipment | Change trajectory and orientation; provide power, communication and heat rejection. | Acceleration and external exposure affect the interior; rocket and propellant combustion remain outside project scope. |

These functions may share one enclosure. They are not a required module list.

## Dimensions to record

Use the [shared environment dimensions](environment-dimensions.md) with units, compartment, operating state, source, date and evidence status. **Unknown** means a vehicle-specific value is still needed; it does not mean zero.

| Dimension | General spacecraft description | Required vehicle or journey input |
|---|---|---|
| Route and duration | Origin → vehicle → destination, including vehicle changes and waiting periods. | Departure/arrival environments, time in each phase, cargo-transfer events; no universal duration. |
| Gravity and acceleration | Microgravity during unpowered orbital or interplanetary free fall; powered flight and landing change the acceleration experienced aboard. | Acceleration magnitude in g or m/s², direction and duration; vibration where relevant. Artificial gravity only if specified. |
| Pressure and oxygen | Each pressurized compartment has its own controlled atmosphere; exterior vacuum is not cabin pressure. | Absolute pressure in kPa, O₂ volume fraction in %, and derived O₂ partial pressure in kPa. General values unknown. |
| Other gases | Gas mixture, water vapour and contaminants depend on life support, cargo and operating state. | N₂, CO₂ and other relevant fractions; off-gassing and fault conditions separately. |
| Airflow | Forced ventilation can transport oxygen and smoke during microgravity coast. | Local speed in m/s, direction, fan state, return paths and sheltered spaces. |
| Temperature and humidity | Cabin air, stored cargo, batteries and exposed hardware can have different temperatures. | Temperatures in °C and relative humidity in % at a stated location. |
| Physical size and layout | Overall vehicle size does not establish cabin space or available air volume. | Vehicle length and diameter or width/height in m; stowed/deployed configuration; compartment geometry, gross and free gas volumes in m³; hatch clear openings and cargo clearances in m. |
| Materials and item state | Packaging, restraints, wiring, batteries and nearby cargo affect the comparison. | Inventory, exposed area, spacing, battery energy in Wh, state of charge, powered/charging state and damage history. |
| Crew and access | Crewed, temporarily occupied or uncrewed; some cargo may be inaccessible in flight. | People present, occupancy duration, access to the item and whether response is manual or automatic. |
| Detection and suppression | Coverage and response capability depend on vehicle and compartment. | Sensors, agent and quantity, power isolation, ventilation shutdown, breathing equipment and atmosphere recovery. Availability is unknown until specified. |
| Power, life support and refuge | A small vehicle may have no separately isolatable refuge. | Backup endurance, consumable reserves, hatch isolation, refuge capacity and endurance. Do not assume a safe second compartment. |
| Communication, resupply and return | Ground assistance and return opportunities vary along the trajectory. | One-way delay, outages, autonomous actions, spares, next feasible resupply and abort/return options. A destination nearby on a map is not guaranteed rescue. |
| Exterior exposure | Solar distance, orientation, eclipses and shielding change during travel. | Solar irradiance in W/m², radiation dose with duration/shielding, hardware temperatures and thermal cycles. Vacuum has no ambient air temperature. Entry/descent requires its own atmosphere and heating conditions. |

## Illustrative cabin baseline

For an initial comparison, use **one pressurized compartment during unpowered coast**, fans operating, hatches closed, four crew present and packaged cargo switched off. These are analyst-selected assumptions, not measurements, typical fleet values, mission specifications or safety limits. They do not apply automatically to a lander, cargo hold or destination habitat.

| Dimension | Example input | Basis and limit |
|---|---|---|
| Gravity regime | Microgravity | Unpowered coast assumption; residual acceleration not quantified. |
| Total pressure | 101 kPa absolute | Selected ordinary-air scenario; not a generic spacecraft requirement. |
| Oxygen | 21% by dry-gas volume | Selected with the pressure above; other atmospheres need separate comparisons. |
| Oxygen partial pressure | ≈21.2 kPa | Derived: 101 × 0.21 = 21.21 kPa; dry-gas approximation. |
| Remaining dry gas | N₂ balance, approximately 0.9% argon and trace gases | Simplified ordinary-air mixture; actual CO₂ and contaminants need records. |
| Local air speed | 0.05–0.2 m/s | Selected comparison range; not a whole-cabin air-change rate. |
| Cabin air temperature / humidity | 18–27 °C / 30–60% relative humidity | Selected modelling ranges; not component temperatures. |
| Cabin geometry | Cylindrical envelope, internal diameter 3 m × length 4 m | Invented comparison geometry; excludes any claim about whole-vehicle dimensions. |
| Gross geometric volume | ≈28.3 m³ | Derived: π × (3/2)² × 4. Equipment, structure, crew and cargo reduce free gas volume, which remains unknown. |
| Clear transfer opening | 0.8 m × 0.8 m rectangular opening | Invented interface for checking cargo fit; actual hatch shape, restraints and handling clearances still matter. |

Detection coverage, suppression quantities, refuge endurance and return time remain unknown in this example. The numerical baseline alone cannot support an assessment of fire protection or mission suitability.

## Conditions change along the journey

| Phase | What to record separately |
|---|---|
| Loading and launch | Ground atmosphere, packaging and restraints; acceleration and vibration during launch. |
| Coast or orbital wait | Compartment atmosphere, ventilation, exposure duration and item use. |
| Maneuver | Thrust-induced acceleration and any changes to power, cooling or ventilation. |
| Docking and transfer | Conditions on both sides, pressure equalization and hatch/ventilation state. Docking alone does not make the atmospheres identical. |
| Descent, landing or return entry, if applicable | Vehicle-specific acceleration and external heating; after landing, approximately 0.17g on the Moon, 0.38g on Mars or 1g on Earth. |
| Unloading and use | The destination compartment's conditions and the item's new packaging, contamination and powered state. |

**Illustrative example:** an astronaut transports a switched-off drill in packaging aboard a spacecraft, transfers it into a lunar workshop and plugs it in to charge. Record spacecraft coast, transfer and workshop charging as separate states. Evidence for the packaged drill in microgravity does not by itself cover an unpacked, charging drill in lunar gravity. This example is not test evidence.

## Sources and limits

This profile synthesizes the repository's [ISS note](iss.md), [Mars transit/orbital habitat note](martian-orbital-station-nasa.md), [cargo journeys](cargo-journes.md), [shared dimensions](environment-dimensions.md) and [research brief](../research-brief.md). The Mars note discusses transit habitation; the ISS note distinguishes visiting spacecraft from station modules. Neither establishes universal vehicle dimensions or cabin conditions.

No new external mission-specification verification was performed. The geometry and numerical baseline above are explicit scenario choices. Compare recorded test conditions with the selected vehicle and phase before transferring evidence; this profile does not certify cargo or a spacecraft.

*SI disclosure: compiled with AI assistance from the linked repository research and explicitly labelled modelling assumptions.*
