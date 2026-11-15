"""Demo launcher: the API plus the static frontend, all on one origin.

    uv run uvicorn serve:app --host 127.0.0.1 --port 8220

API routes keep their paths (/health, /docs, /environments, ...). Static pages are mounted after
them: /prototype and /presentation from the repo, and a small landing page at /.
"""

from pathlib import Path

from fastapi.staticfiles import StaticFiles

from app.main import app

ROOT = Path(__file__).resolve().parent.parent

app.mount("/prototype", StaticFiles(directory=ROOT / "prototype", html=True), name="prototype")
app.mount("/presentation", StaticFiles(directory=ROOT / "presentation", html=True), name="presentation")
app.mount("/", StaticFiles(directory=Path(__file__).resolve().parent / "site", html=True), name="site")
