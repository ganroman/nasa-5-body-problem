# nasa-5-body-problem

NASA Space Apps Challenge 2026 — Vienna.

## Challenge: Flame in Freefall

The challenge calls for an interactive web dashboard powered by super intelligence (SI) that summarizes, ranks, and interprets NASA combustion research for fire safety in space. The primary data source is NASA’s Physical Science Informatics (PSI) database.

### Why it matters

Flames behave differently in microgravity because hot gases do not rise as they do on Earth. Oxygen concentration, airflow, and materials affect fire risk, making experimental evidence essential for prevention, detection, and suppression.

### Suggested dashboard capabilities

- Help researchers, engineers, and students find relevant experiments for spacecraft, stations, lunar and Martian habitats, and pressurized rovers.
- Compare objectives, fuels, sample geometry, oxygen levels, airflow, test variables, and measurements.
- Extract evidence for predicting flammability and identifying improvements to fire safety equipment.

### Key investigations

| Research area | Experiments |
| --- | --- |
| Solid-material flammability | BASS, BASS-II, Saffire-I–III |
| Smoke detection | SAME, SAME-R |
| Fire suppression | FLEX |

### Scope and limitations

Rocket and propellant fire safety is generally outside PSI’s scope. The challenge notes that PSI currently lacks partial-gravity combustion data. Applications to fire safety on Earth are also welcome.

Source: [NASA’s Flame in Freefall challenge details](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=details). This summarizes the challenge brief, not implemented repository features.

## Team resources

- [Cargo & environment map](prototype/cargo-environment-map.html): standalone interactive diagram of cargo routes, cargo types, and environment dimensions. Open the HTML file in a browser; no installation is needed.
- [Research brief](docs/research-brief.md): PSI data inventory (all 24 investigations), judging and submission rules, O₂ coverage chart, 36-hour plan
- [Data](data/README.md): PSI combustion metadata and per-test experimental tables, plus API notes
- [Backend API](backend/README.md): FastAPI + Neon Postgres backend, setup, data rules and open data questions
