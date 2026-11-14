# Cargo Passport API

Backend for the Cargo Passport dashboard (see [build plan](../docs/build-plan.md)). FastAPI + SQLAlchemy 2 + Alembic on Neon Postgres. The frontend is served from GitHub Pages; this API is deployed separately (Render), because Pages cannot run a server or keep the SI key secret.

## Setup

```bash
cd backend
cp .env.example .env              # Neon URLs (dev branch) and Eustella SI settings
uv sync
uv run alembic upgrade head       # create/upgrade the schema
uv run python -m app.ingest.load  # load seed YAML + PSI data; safe to re-run
uv run pytest
uv run uvicorn app.main:app --reload
```

## Configuration

All configuration comes from environment variables (`.env` locally, the host's settings in production). Nothing secret is committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection, used by the app |
| `DATABASE_URL_DIRECT` | Neon direct connection (host without `-pooler`), used by Alembic |
| `SI_BASE_URL`, `SI_API_KEY`, `SI_MODEL` | Eustella AI, OpenAI-compatible. Unset means the SI feature reports `unavailable` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (add the GitHub Pages origin) |

Neon project `cargo-passport`: branch `dev` for development and migrations, `main` for the deployed app.

## Layout

| Path | What it does |
|---|---|
| `app/models.py` | Database schema. The module docstring lists the table groups and data invariants |
| `app/enums.py` | Controlled vocabularies, stored as text with CHECK constraints |
| `app/ingest/psi.py` | Reads `data/investigations/*.json` and six PSI tables (BASS, BASS-II, Saffire I–III, ACME BRE) into row dicts |
| `app/ingest/seed_yaml.py` | Validates the curated YAML in `seed/`, including cross-references |
| `app/ingest/load.py` | Upserts everything into the database (`python -m app.ingest.load`) |
| `app/logic/compare.py` | Scenario vs. observation comparison, evidence class, ranking and per-hazard coverage. Pure functions |
| `app/si/explain.py` | Grounded SI explanation: every sentence must cite a supplied source id; results cached in `si_explanations` |
| `alembic/versions/` | Migrations. Generate with `uv run alembic revision --autogenerate -m "..."` |
| `seed/` | Curated YAML transcribed from `docs/`. Each file's header documents its fields and units |
| `tests/` | Schema invariants (need a database), ingest, seed, comparison and SI tests |

## Data rules

- Unknown values are NULL with status `unknown`, never zero. Lunar, Mars and Gateway cabin values stay unknown; ISS values are never copied into them.
- Units inside the database: O₂ as a volume fraction (0.21), pressure kPa absolute, airflow m/s, lengths m. Raw cell text is kept next to every normalized value.
- A generic material name is never matched `exact` to a tested specimen.
- No safety verdicts or scores are stored. Comparisons and coverage are computed in code.
- Fire status is always computed from comparisons; curated assessments can only set toxicity and biological status.
- Comparison tolerances: O₂ ±1.5 points, pressure ±5 kPa, airflow ±2 cm/s, gravity same regime only (`TOLERANCES` in `compare.py`).
- ACME BRE is a gas burner emulating solids, so it is always classed as an `analogue`, never material evidence.

Background: [build plan §6–8](../docs/build-plan.md#6-minimal-data-model-and-scientific-ownership) and [environment dimensions](../docs/environments/environment-dimensions.md).

## Open data questions

Values below are stored as NULL/unknown until someone checks the source. Fix them in `seed/*.yaml` or `app/ingest/psi.py`, then re-run the loader.

**Blocking the demo**
- `seed/findings.yaml` is empty. The build plan needs about three findings, each with a verbatim excerpt from the primary source and a page/section locator. Until then the SI explanation has no curated findings to cite.

**PSI tables**
- ACME BRE rows 5 and 8: O₂ reads "3400%" and "2100%", probably 34% and 21% mangled by Excel.
- Saffire-II: thickness "037 mm" (probably 0.37 mm); row 7 describes two samples; row 8 says "See Fig. 5"; rows 6 and 9 have a blank material.
- Saffire-I and Saffire-III swap sample length and width (40.6 × 94 cm).
- BASS-II fan/air readings have no units, so airflow is blank. BASS records no O₂, pressure or airflow.
- BASS sphere sizes are read as diameters; please confirm.

**Seed data**
- 94 raw PSI material labels are all `unmatched`. Linking them to specific materials is a review step.
- Several Earth burn-test results cite the repo doc rather than the original paper (Nomex, silicone, PTFE, M22759 wire, PMMA LOI).
- Routes R08–R11 are `supported` based on NASA's 2026 surface plan and the ILRS description; the W1 source on R08/R10 is a loose fit.
- The submarine CO₂ value is stored as an `estimate`, although the doc calls it a modelling assumption.

**SI**
- Check that Eustella accepts `response_format=json_object`, and review one real answer by hand against its excerpts.
