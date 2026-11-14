# International Space Station: modules, logistics, and crew

Research reference for the **Flame in Freefall** challenge · Team Five-Body Problem · 14 November 2026

The International Space Station (ISS) is a crewed laboratory in low Earth orbit, roughly 400 km above Earth. Unlike the other environments in this folder, it already exists: it has been continuously occupied since November 2000, and most of the microgravity combustion evidence our research relies on was produced aboard it or on cargo vehicles serving it. [NASA ISS facts](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/)

## Program status

The ISS is operating, built and run by the United States, Russia, Europe, Japan, and Canada. **NASA plans to retire it around 2030** and has contracted a US Deorbit Vehicle to bring it down safely; commercial stations are expected to take over low-Earth-orbit research. Retirement dates and successor plans should be treated as current intentions, not fixed commitments. [NASA ISS deorbit](https://www.nasa.gov/international-space-station/space-station-deorbit/) · [Commercial LEO destinations](https://www.nasa.gov/humans-in-space/commercial-space/commercial-leo-destinations/)

## 1. Modules and their purposes

The station is a large assembly of pressurised modules attached to an external truss. The table groups the main elements by function rather than listing every component.

| Element | Purpose |
|---|---|
| **Zvezda and Zarya (Russian segment core)** | Early living quarters, life support, propulsion, and attitude control for the Russian segment; Zarya now serves mainly for storage. |
| **Nauka, Poisk, Prichal (Russian segment)** | Research space, docking ports, and an airlock for Russian spacewalks. |
| **Destiny (US laboratory)** | Main US research module, including combustion racks such as the Combustion Integrated Rack. |
| **Columbus (ESA) and Kibo (JAXA)** | European and Japanese laboratories; Kibo also has an external experiment platform and a small airlock for payloads. |
| **Unity, Harmony, Tranquility (nodes)** | Connecting modules with crew quarters, docking ports, exercise equipment, hygiene, and life-support systems. |
| **Quest airlock** | Spacewalks from the US segment without depressurising the station. |
| **Cupola** | Observation windows used for Earth viewing and robotic-arm operations. |
| **Leonardo, BEAM, and other storage volumes** | Long-term stowage of supplies, spares, and equipment. |
| **Integrated truss and solar arrays** | Electricity generation, radiators for rejecting heat, and mounting points for external experiments. |
| **Canadarm2 and Dextre** | External robotics for capturing cargo vehicles, moving equipment, and maintenance. |

Sources: [NASA ISS facts](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/) · [ISS assembly overview](https://www.nasa.gov/international-space-station/space-station-assembly/).

**Crew and cargo spacecraft dock temporarily.** Crew Dragon, Starliner, and Soyuz carry people; Cargo Dragon, Cygnus, Progress, and Japan's HTV-X carry supplies. They are visiting vehicles, not station modules.

## 2. Deliveries and return cargo

The following describes cargo categories and their purposes—not a specific manifest.

| Route | People or cargo | Why it goes there |
|---|---|---|
| **Earth → ISS** | Crew; food, water, and gases; clothing, hygiene and medical supplies; spare parts, tools, batteries, and experiments | Keep the crew alive, maintain the station, and run research. Cargo travels in pressurised containers or, for some vehicles, outside on external carriers. |
| **ISS → Earth** | Crew; completed experiments, biological and physical samples, and failed hardware needing analysis | Return people and bring research results and failed equipment back for laboratory examination. Only some vehicles (currently Dragon and Soyuz) return cargo intact. |
| **ISS → disposal** | Rubbish, used packaging, and unneeded equipment loaded into Cygnus or Progress | These vehicles burn up on re-entry, removing waste from the station. |

Measurements, photographs, and video are transmitted electronically; physical samples need a spacecraft.

**The ISS is the only environment in this folder with a real, recurring cargo flow.** Its payload safety reviews (see section 6 of the [data sources catalog](../../data/data-sources-catalog.md)) are the clearest existing example of how fire hazards in cargo are assessed before flight.

Cygnus cargo vehicles also hosted the **Saffire** experiments: after leaving the station, large fires were deliberately lit inside the empty vehicle, away from the crew. [NASA Saffire](https://www.nasa.gov/mission/saffire/)

## 3. Crew and daily work

The station normally hosts **seven people**, rising temporarily during crew handovers. Typical stays are **about six months**, with some missions lasting a year. [NASA ISS facts](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/)

The astronauts' work includes:

- Running experiments, including combustion research.
- Maintaining and repairing station systems.
- Unpacking and stowing cargo, and loading return and disposal vehicles.
- Exercising about two hours a day to limit bone and muscle loss.
- Performing spacewalks and robotic operations when required.

Mission control centres in Houston, Moscow, and partner countries monitor the station continuously, and communication with Earth has negligible delay.

## 4. How it differs from the other environments

| Aspect | ISS | Lunar Gateway (earlier design) | Lunar or Martian surface base |
|---|---|---|---|
| **Status** | Operating since 2000 | Paused in 2026 | Planned |
| **Gravity inside** | Microgravity | Microgravity | About 1/6 g (Moon) or 0.38 g (Mars) |
| **Crew** | Normally seven; continuously occupied | Up to four; occupied during visits | Planned expedition crews |
| **Resupply** | Several cargo flights a year | Occasional missions | Infrequent; very limited for Mars |
| **Return to Earth** | Hours via a docked spacecraft | Days | Days (Moon) to months (Mars) |
| **Radiation** | Partly shielded by Earth's magnetic field | Greater exposure | Greater exposure, partly reduced by the planet's surface |

See [Lunar Gateway](lunar-gateway.md), [NASA lunar surface base](lunar-base-nasa.md), and [Martian surface base](martian-base-nasa.md) for details.

## 5. Relevance to our fire-safety challenge

- **The ISS is where most of our evidence comes from.** BASS, FLEX, SAME, and ACME ran inside the station in the Combustion Integrated Rack or Microgravity Science Glovebox; Saffire ran in departing Cygnus vehicles. [NASA: A Researcher's Guide to ISS Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/)
- **The cabin atmosphere is close to Earth's at sea level**: about 101 kPa with roughly 21% oxygen. Exploration habitats may use lower pressure and higher oxygen, so ISS results do not transfer automatically. Keep oxygen concentration and pressure as separate, sourced values for each environment; see our [research brief](../research-brief.md).
- **In microgravity there is no buoyant rising of hot gas.** Flames depend on ventilation airflow, and smoke spreads with it. Detection and suppression must match the actual airflow and cabin layout.
- **The ISS has an established fire-response approach**: smoke detection, ventilation shutdown, breathing equipment, power isolation, portable extinguishers, and atmosphere recovery afterwards. [NASA Fire Protection Technical Brief](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-008-fire-protection.pdf)
- **Matching microgravity alone does not qualify a material or system for Gateway or a Mars habitat.** Atmosphere, airflow, materials, and test scale also matter, and ISS results do not validate lunar or Martian partial gravity.

## Limits and open questions

- Module list and crew numbers summarise NASA overview pages; they are not a full configuration or a current manifest.
- Retirement timing and the transition to commercial stations were not independently verified beyond NASA's published plans.
- Cabin atmosphere values are nominal; actual oxygen and pressure vary within controlled ranges and between segments.

*SI disclosure: compiled with AI assistance from the linked NASA sources and the team's research context.*
