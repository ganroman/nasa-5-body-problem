# Cargo Passport API

Backend for the Cargo Passport dashboard (see [build plan](../docs/build-plan.md)). FastAPI + SQLAlchemy 2 + Alembic on Neon Postgres. The API runs locally for the demo (see below); the SI key stays in `backend/.env` on that machine.

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

## Running for the demo (local, Neon main)

The API runs locally; there is no hosted deployment. For the demo, run it against Neon `main` (production data), with its URLs in `backend/.env.main` (gitignored). Quote the values (`DATABASE_URL="..."`): the URLs contain `&`, which the shell otherwise treats as a command separator and silently falls back to `.env` (dev).

```bash
cd backend
set -a; . ./.env.main; set +a
uv run alembic upgrade head            # after schema changes
uv run python -m app.ingest.load       # after seed/data changes; safe to re-run
uv run uvicorn app.main:app --port 8000
```

The API is then at `http://localhost:8000` (docs at `/docs`). Add the frontend's local origin to `CORS_ORIGINS` if it is served from another port.

## Hosted demo (one origin)

`serve.py` mounts the static pages (`/prototype`, `/presentation`, landing page `site/`) after the API routes, so API and frontend share one origin and no base URL or CORS setup is needed:

```bash
cd backend
uv run uvicorn serve:app --host 127.0.0.1 --port 8220
```

The demo host runs this as a systemd unit behind a Cloudflare tunnel with `CORS_ORIGINS=https://cargo.qwadratic.me`. A timer on the host deploys every `main` commit whose GitHub checks are all green: database dump, `uv sync --frozen`, `alembic upgrade head`, restart, `/health` check, rollback of the code on failure (migrations stay). Script: `deploy/autodeploy.sh`.

## Configuration

All configuration comes from environment variables (`.env` locally, the host's settings in production). Nothing secret is committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection, used by the app |
| `DATABASE_URL_DIRECT` | Neon direct connection (host without `-pooler`), used by Alembic |
| `SI_BASE_URL`, `SI_API_KEY`, `SI_MODEL` | Eustella AI, OpenAI-compatible. Unset means the SI feature reports `unavailable` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API (add the GitHub Pages origin) |
| `ADMIN_PASSWORD` | Password of `/admin` (HTTP Basic, any user name). Unset: admin is off (503) |
| `CARGO_ENV_FILE` | Service env file edited by the `/admin` widget (mode 600, systemd `EnvironmentFile=`) |
| `CARGO_FLAGS_FILE` | JSON file with the feature flags (mode 600) |
| `CARGO_RESTART_SIGNAL` | File touched to make a systemd path unit restart the service |
| `CARGO_AUDIT_FILE` | Admin change log (JSON lines, no secret values); default `admin-audit.log` beside the env file |

## Admin: env variables and feature flags

`/admin` (HTTP Basic, password from `ADMIN_PASSWORD`) has a widget for the env variables listed in `app/envadmin.py` (secrets are write-only: shown as set and the last four characters) and a feature flag editor. Flags live in a JSON file, no database: `{key: {enabled, description, rollout_percent, updated_at, updated_by}}`.

- Backend: `from app.flags import flag`; `flag("key")` re-reads the file when its mtime changes. For `rollout_percent < 100` pass a stable id: `flag("key", user_id)`.
- Frontend: `<script src="/flags.js">`, then `CargoFlags.isEnabled("key")`, or `data-flag="key" hidden` on an element. `GET /api/flags?uid=...` returns the enabled keys only.
- Host setup (path unit for the soft restart, drop-in, files): [ops/README.md](ops/README.md).

Neon project `cargo-passport`: branch `dev` for development and migrations, `main` for the deployed app.

## API

Interactive docs at `/docs` when the server runs. Frontend guide with examples and rendering rules: [API.md](API.md). Internal units in requests: O₂ as a fraction (0.30), pressure kPa, airflow m/s.

| Method & path | Purpose |
|---|---|
| `GET /health` | Liveness and database check |
| `GET /environments`, `/environments/{id}` | Environments with per-space conditions and provenance |
| `GET /routes`, `/materials`, `/investigations`, `/sources/{id}` | Reference data |
| `GET /cargo`, `/cargo/{slug}` | Seeded mock cargo items |
| `POST /scenarios/compare` | `{cargo_slug | cargo, scenario}` → conditions, ranked evidence per component, coverage per hazard, sources, tolerances, limitations |
| `POST /scenarios/explain` | Same body + `component_index`, `hazard`, `question` → grounded SI explanation (`ok`, `unavailable`, `rejected` or `error`) plus the cited records |
| `POST /passports/export`, `GET /passports/{id}` | Store and reopen an immutable passport snapshot built from the same computation as compare |
| `POST /shares`, `GET /shares/{slug}`, `PUT /shares/{slug}` | Anonymous share links. `POST` returns an `edit_token` once (limit: 20 new links per IP per hour, else `429`); `PUT` needs it in `X-Edit-Token` and saves a new config version |

`scenario` is `{environment_id, space="cabin", use_state, route_id?, overrides: {dimension: value}}`. Gravity cannot be overridden; it follows the environment.

## Layout

| Path | What it does |
|---|---|
| `app/models.py` | Database schema. The module docstring lists the table groups and data invariants |
| `app/enums.py` | Controlled vocabularies, stored as text with CHECK constraints |
| `app/ingest/psi.py` | Reads `data/investigations/*.json` and six PSI tables (BASS, BASS-II, Saffire I–III, ACME BRE) into row dicts |
| `app/ingest/seed_yaml.py` | Validates the curated YAML in `seed/`, including cross-references |
| `app/ingest/load.py` | Upserts everything into the database (`python -m app.ingest.load`) |
| `app/api.py` | Routes and request validation |
| `app/scenario.py` | Builds comparisons, coverage, SI inputs and export content from the database; one code path for all three |
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
- Live test passed (2026-11-14): Eustella accepts JSON mode; one answer for the portable instrument's enclosure was checked sentence by sentence against its records. Re-check after any change to the prompt or the record text in `app/scenario.py`.
- Eustella is a closed beta: 20 requests/minute for the whole organisation, 2 in parallel. Explanations are cached; demo from prepared scenarios.
