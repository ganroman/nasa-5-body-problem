# Environment dimensions

Summary for **Flame in Freefall** · 14 November 2026

Compare environments by their physical conditions, the materials and activities inside them, and the help available when something goes wrong. **Gravity, total pressure, oxygen concentration, and airflow are the starting dimensions** for comparing combustion research. A shared destination alone does not establish that two environments have similar fire behaviour.

This document proposes dimensions based on the six environment notes below and the [research brief](../research-brief.md). It does not establish mission specifications or safety limits. Values absent from those notes remain **unknown**, rather than being filled with Earth or ISS defaults.

## 1. Environments covered

Gravity here describes the conditions experienced by objects inside the habitat. Orbital microgravity is free fall, not an absence of planetary gravity. Surface values are approximate fractions of Earth's gravity (`g`).

| Environment and source | Gravity regime | Outside environment | Cabin pressure / oxygen | Planning context in the existing notes |
|---|---|---|---|---|
| [International Space Station (ISS)](iss.md) | Microgravity | Low Earth orbit, roughly 400 km altitude; near-vacuum | About 101 kPa / roughly 21% O₂ (nominal cabin values) | Operating, continuously occupied laboratory with recurring crew and cargo flights. |
| [NASA lunar surface base](lunar-base-nasa.md) | Partial gravity, about 0.17g | Lunar vacuum and surface dust | Unknown / unknown | Planned surface infrastructure; configuration and occupation depend on development stage. |
| [China-led ILRS lunar base](lunar-base-china.md) | Partial gravity, about 0.17g for its surface facilities | Lunar vacuum and surface dust | Unknown / unknown | Long-term robotic operation with short human visits; this comparison concerns the crewed surface habitat. |
| [Lunar Gateway](lunar-gateway.md) | Microgravity | Space vacuum | Unknown / unknown | Earlier architecture, with visits and unattended periods; the note records a pause in its current form. |
| [NASA Martian surface base](martian-base-nasa.md) | Partial gravity, about 0.38g | Thin, mostly CO₂ atmosphere and surface dust | Unknown / unknown | Surface-habitat and rover studies, not an operational base. |
| [NASA Mars orbital habitat](martian-orbital-station-nasa.md) | Microgravity, unless artificial gravity is specified | Space vacuum | Unknown / unknown | Could be a transit habitat temporarily in orbit; a separate permanent station is not established. |

Outside conditions must not be used as cabin conditions. A breathable Mars habitat contains oxygen even though the surrounding atmosphere is mostly CO₂. Similarly, lunar vacuum does not describe the air inside a lunar workshop.

### ISS dimension profile

The following values come from [the ISS research note](iss.md), including its nominal-atmosphere caveat. They describe the station generally, not current telemetry or every module's operating limits.

| Dimension | ISS value or description | Evidence status / limit |
|---|---|---|
| Gravity | Microgravity | Does not establish the residual acceleration at a particular experiment. |
| Cabin pressure and oxygen | About 101 kPa absolute; roughly 21% O₂ | Nominal values; controlled ranges and differences between segments are not specified in the note. |
| Oxygen partial pressure | Approximately 21.2 kPa | Derived from 101 × 0.21; not an independently measured value or safety limit. |
| Remaining gas composition | Detailed fractions unknown | Do not infer a complete measured mixture from the nominal oxygen percentage. |
| Airflow | Forced ventilation transports oxygen and smoke | Local speeds, directions, and fan states must be obtained for the module or equipment location. |
| Cabin temperature and humidity | Numerical ranges unknown in the note | Record local operating conditions rather than assigning a station-wide default. |
| Space function and configuration | Connected laboratories, living spaces, storage, nodes, docking interfaces, and airlocks | Compartment volumes, hatch states, and item installations require more detailed records. |
| Materials, ignition sources, and dust | Depends on cargo, equipment, activity, and location | Material inventories, battery states, and contamination measurements are not specified. |
| Crew presence | Normally seven people; continuously occupied; typical stays about six months | Temporary handovers and longer missions vary these values; not a current roster. |
| Detection and suppression | Smoke detection, ventilation shutdown, breathing equipment, power isolation, portable extinguishers, and atmosphere recovery | Established response approach in the note; sensor coverage and agent inventories require configuration-specific sources. |
| Life support and power | Life-support systems, solar arrays, and heat-rejection radiators | Backup endurance and consumable reserves are not quantified. |
| Communications | Continuous ground monitoring and very short communication delay | Numerical latency, availability, and outage duration are not specified. |
| Resupply and return | Several cargo flights per year; return to Earth on the scale of hours via a docked spacecraft | Describes general access, not guaranteed immediate rescue or the next delivery date. Refuge capacity is unknown. |
| Radiation | Partial protection from Earth's magnetic field | Not zero exposure; dose, shielding, and event-specific conditions remain unknown. |
| Solar exposure and exterior temperatures | Depend on illumination, orbit, orientation, surface properties, and thermal control | Numerical irradiance, UV exposure, and component temperature ranges are not established by the note. See the exterior dimensions below. |

**Cabin conditions are not experiment conditions.** An ISS combustion chamber can use a different gas mixture, pressure, and airflow from the surrounding cabin. Compare each investigation's recorded test conditions with the destination environment; do not assign 21% O₂ and 101 kPa to every ISS experiment. Saffire experiments took place in departed Cygnus vehicles, not in the occupied ISS cabin.

## 2. Core physical dimensions

These are proposed fields to record for each relevant space, such as a living area, workshop, cargo compartment, rover, or airlock.

| Dimension | What to record | Why it matters |
|---|---|---|
| **Gravity** | Regime and magnitude in `g` or m/s²; direction relative to the item where relevant | Changes buoyancy, flame shape, and smoke movement. Microgravity evidence does not directly validate lunar or Martian conditions. |
| **Total gas pressure** | Absolute pressure in kPa; normal value and operating range | Affects gas density and combustion. Record absolute pressure, not pressure relative to the surroundings. |
| **Oxygen concentration** | O₂ percentage by volume or mole fraction, with the basis stated | Describes the proportion of oxygen in the gas mixture; it must be read together with total pressure. |
| **Oxygen partial pressure** | Derived value in kPa: total pressure × O₂ fraction | Shows oxygen's contribution to total pressure. It is useful context, but does not replace pressure and concentration as separate dimensions. |
| **Remaining gas composition** | N₂, CO₂, He, and other relevant gas fractions | Two mixtures with the same oxygen percentage can differ in heat transfer and combustion behaviour. |
| **Airflow / ventilation** | Local speed in m/s, direction relative to the material, and fan state | Controls oxygen delivery and smoke transport, especially in microgravity. Room-average ventilation alone may miss a sheltered compartment. |
| **Temperature** | Local gas, material, and nearby surface temperatures in °C, including operating ranges | A warm battery enclosure and a cool storage area can expose the same material to different conditions. Outdoor temperature is not a substitute for cabin temperature. |
| **Humidity** | Relative humidity in %, together with gas temperature | Helps describe material moisture, condensation, and conditions relevant to equipment and sensors. |

**Illustrative calculation, not a mission specification:** 21% O₂ at 100 kPa and 30% O₂ at 70 kPa both give an oxygen partial pressure of 21 kPa. They still have different oxygen concentrations and total pressures; equal partial pressure does not establish equal flammability or safety.

The research brief's elevated-oxygen lunar scenario (at least 30% O₂ and at most 10.2 psi, approximately 70.3 kPa) can be recorded as a **scenario range**. It is not a verified atmosphere for any of the six environments, and those inequalities do not define a single operating point.

## 3. Additional dimensions worth recording

Some of these describe a whole habitat; others describe a particular item or activity within it. Keep that distinction explicit when comparing evidence.

| Dimension | Suggested description or units | Why it matters |
|---|---|---|
| **Space function and enclosure** | Living area, workshop, storage, airlock, rover, equipment rack; pressurized or exposed | Identifies where an item is used and which surrounding conditions apply. |
| **Compartment size and connections** | Volume in m³, openings, ducts, hatch state, isolation capability | Affects smoke movement, accumulation, and whether a problem can spread to other spaces. |
| **Materials and combustible inventory** | Material identity, solid/liquid/gas, amount, packaging, exposed area | Atmosphere alone cannot describe fire behaviour; the available fuel matters. |
| **Item geometry and installation** | Thickness, dimensions, orientation, spacing, mounting, nearby surfaces | A thin exposed fabric and a bundled cable assembly need different supporting evidence. |
| **Ignition sources and operating state** | Powered/unpowered, charging, hot work, heated surfaces; battery chemistry and state of charge where relevant | Separates ordinary storage from activities that introduce heat or electrical faults. |
| **Dust and contamination** | Type, airborne concentration in mg/m³ where measured, deposited amount, cleaning state | Surface operations can bring dust into cabins and equipment; contamination also matters when interpreting detector response. |
| **Crew presence and occupancy** | People present, occupied/unattended, visit duration | Determines whether someone can notice a problem and respond locally. Crew capacity and people actually present are different values. |
| **Mission phase and condition changes** | Transit, docking, cargo transfer, surface work, airlock cycling, maintenance; duration and frequency | A single item can encounter several atmospheres and operating states during its journey. |
| **Detection and suppression** | Sensor type and placement, alarm coverage, extinguishing agent and quantity, automatic/manual operation | Describes available protection and the conditions for which supporting evidence is needed. |
| **Life support and power resilience** | Ventilation, filtration, CO₂ removal, backup power, reserves, outage duration | A power or ventilation failure can change both the environment and the ability to recover it. |
| **Refuge and escape options** | Isolatable spaces, refuge capacity and endurance, accessible return vehicle | Describes what the crew can do if a compartment becomes unusable. |
| **Communication and local autonomy** | One-way delay, outage periods, actions possible without Earth support | Determines whether immediate decisions and repairs must happen locally. |
| **Resupply and repair access** | Time to next delivery, spares, tools, repair capability, evacuation constraints | A failed filter or used extinguisher has different consequences when replacement is unavailable for a long period. |
| **Exposure history and ageing** | Accumulated radiation exposure, thermal cycles, service age, inspection history | Provides context for material and equipment ageing; exposure alone does not quantify a change in flammability. |

### Exterior sunlight, radiation, and temperature

These deserve separate dimensions: sunlight heats exposed equipment and supplies solar power, while energetic particles can damage electronics and affect crew health. Neither is described adequately by a single “radiation level.” External conditions also determine how much work thermal-control systems must do to maintain cabin and equipment temperatures.

| Dimension | What to record | Why it matters |
|---|---|---|
| **Solar irradiance** | Incoming solar power per area in W/m²; distance from the Sun, incidence angle, and whether measured above the atmosphere or at the surface | Describes available sunlight. Absorbed heating also depends on surface properties and orientation; it is not equal to incoming irradiance. |
| **Sunlight and shadow cycle** | Duration of illumination, darkness, eclipses, and terrain shadow in hours; seasonal or orbital variation | Long darkness affects solar power and heating; repeated transitions impose thermal cycles. |
| **Ultraviolet exposure** | UV irradiance in W/m² for a stated wavelength band, accumulated exposure, shielding | Helps assess degradation of exposed polymers, coatings, and other materials. |
| **Ionizing radiation** | Particle source and spectrum where available; absorbed dose in Gy for a specified material, or dose equivalent in Sv for people, with duration and shielding | Solar particle events and galactic cosmic rays affect crew and electronics. Keep routine exposure and event scenarios separate; Gy and Sv are not interchangeable. |
| **Outside temperature ranges** | Minimum/maximum in °C for a named quantity: ground surface, near-surface air where present, or exposed hardware; location, season, lighting, and observation period | Defines external thermal conditions without confusing ground temperature, air temperature, and equipment temperature. |
| **Thermal cycling and heat exchange** | Rate of temperature change, cycle duration/count, ground contact, surrounding surface temperatures, planetary infrared and reflected sunlight | Helps assess expansion, fatigue, and heat rejection. The same sunlight can produce different hardware temperatures depending on coatings, insulation, and cooling. |

The applicable measurements differ by environment:

| Environments | How to describe the exterior |
|---|---|
| ISS | Record sunlight and Earth-shadow periods, direct solar irradiance, Earth-reflected sunlight and infrared radiation, and exposed component temperatures. There is no single outside air temperature representative of hardware in near-vacuum. Record radiation exposure with orbit and shielding; Earth's magnetic field provides partial protection. |
| NASA lunar base and ILRS surface habitat | Record local ground and hardware temperatures, sun angle, terrain shadow, and sunlight duration. Lunar vacuum has no ambient air temperature. A general lunar day/night range is not a verified range for a particular south-pole site. |
| Lunar Gateway | Record orbit-dependent illumination and eclipses, incoming solar and lunar radiation, and component temperatures. There is no single outside air temperature in orbital vacuum. |
| Martian surface base | Record ground temperature and air temperature separately, with measurement height, location, season, and time of day. Include wind and atmospheric dust conditions, which affect heat exchange and sunlight reaching the surface. |
| Mars orbital habitat | Record solar distance, orbit, eclipses, planetary radiation, and hardware temperatures. Mars surface temperature ranges do not describe a spacecraft in orbit. |

For example, a rover battery enclosure in sunlight and an identical enclosure in terrain shadow can experience different temperatures at the same lunar site. Record their lighting and thermal conditions separately. This is an illustrative case, not a measured temperature range.

**Numerical ranges remain to be sourced for the chosen site, orbit, and hardware.** Global planetary extremes can provide background, but should not become habitat design limits or cabin temperatures.

## 4. How to describe an environment consistently

For every recorded value, keep its **unit, location, operating state, source, source date, and evidence status**. Distinguish a sourced specification, a study assumption, a proposed scenario, a derived value, and an unknown. Retain ranges where supplied; do not turn missing information into zero.

Record separate conditions for normal operation and relevant changes, such as a stopped ventilation fan or an airlock pressure cycle. Values from different rooms or operating states should not be combined into one supposedly representative atmosphere.

For example, an astronaut bringing a drill into a lunar workshop changes its surroundings from external vacuum to cabin gas. A useful record would identify the workshop's pressure, O₂ concentration, local airflow, and whether the drill is charging, alongside its battery and casing materials. The gravity remains lunar. This illustrates how to use the dimensions; it is not evidence from a test.

For an initial comparison, prioritize **space and operating state, gravity, pressure, O₂ concentration, gas composition, airflow, temperature, and material/configuration**, with sources and explicit unknowns. Add crew presence, detection/suppression, and refuge or resupply constraints when considering the consequences of a fire and the available response.

Matching these dimensions helps explain why a study is relevant. It does not certify a material or system for a destination. The existing research brief reports a gap in direct partial-gravity combustion data in the reviewed PSI collection; an unknown condition or an untested gravity regime must remain visible.

**Scope and limitations:** This is a synthesis of the repository's environment research, not a fresh verification of mission plans or engineering specifications. It proposes comparison dimensions without assigning unsupported numerical values. Rocket and propellant combustion remain outside the project's stated scope.

*SI disclosure: compiled with AI assistance from the linked repository research notes.*
