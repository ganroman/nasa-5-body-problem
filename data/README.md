# PSI combustion data (pulled 2026-11-14)

Source: NASA Physical Sciences Informatics (PSI), https://psi.nasa.gov/physci/repo/search?q=combustion
Cite each investigation by its DOI (field `doi` in investigations/*.json) — PSI requires it.

## Contents
- `combustion_investigations_summary.json` — 24 combustion investigations (19 ISS/flight, 5 ground): title, acronym, objectives, approach, hypothesis, keywords, hardware, Earth benefits.
- `investigations/PSI-*.json` — full record per investigation (raw-file manifest stripped to `raw_file_count` / `raw_total_bytes`; re-fetch via the API below if you need file names): `publications` (352 total), `doi`, `experimentalTable`, `images`.
- `experimental_tables/*.csv` — the per-test condition matrices (22 files, ~2,000 test rows). Schemas differ per investigation.

## Unauthenticated JSON API (no key needed)
- Search all investigations: `GET https://psi.nasa.gov/geode-py/ws/repo/search?term=&source=psi&type=investigation&size=500`
- Filters: `GET https://psi.nasa.gov/geode-py/ws/repo/filter-options`
- One investigation: `GET https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-25`
- Versions/legacy files: `GET https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-25/versions`
- Thumbnail: `GET https://psi.nasa.gov/geode-py/ws/investigations/PSI-25/image`
- File download (returns a presigned S3 URL as text): `GET https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=<url-encoded file_name>&redirect=false`

Raw data totals ~8 TB (mostly .ts/.mp4 video, zipped camera/sensor dumps). Don't bulk-download; use the tables, metadata, publications and a few representative images/videos.
