# Cargo Passport API

FastAPI + SQLAlchemy 2 + Alembic on Neon Postgres. Frontend is served from GitHub Pages; this API is deployed separately (Render).

## Setup

```bash
cd backend
cp .env.example .env        # fill in Neon URLs (dev branch) and Eustella SI settings
uv sync
uv run alembic upgrade head
uv run pytest
uv run uvicorn app.main:app --reload
```

- `DATABASE_URL` uses Neon's pooled host; `DATABASE_URL_DIRECT` (no `-pooler`) is used for migrations.
- Neon project `cargo-passport`: branch `dev` for development/migrations, `main` for the deployed app.

## Layout

- `app/models.py`: schema (see module docstring for layers and invariants)
- `app/enums.py`: controlled vocabularies (text + CHECK constraints)
- `alembic/versions/`: migrations; generate with `uv run alembic revision --autogenerate -m "..."`
- `seed/`: curated YAML (sources, environments, routes, cargo, findings), loaded idempotently
- `tests/`: schema invariants and comparison logic

## Data rules

Unknown values are NULL with status `unknown`, never zero. Ranges keep min/max plus the raw cell text. Generic material labels are never matched `exact` to a tested specimen. No safety verdicts or scores are stored; comparisons and coverage are computed in code.
