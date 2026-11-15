# Evidence method

Cargo Passport shows which published fire-safety evidence applies to the materials of an item, and what is untested. It never says an item is safe. People decide. This page explains how we keep invented facts out of the site, and how to check that.

## What counts as evidence

A statement counts only if a published source says it: a NASA report or page, or other published research. We record the source and one short passage from it. Nothing on the site may come from memory.

Three other kinds of text are allowed, and each is marked:

- Narrative: headings and connective copy that state no fact.
- Illustrative: details of the demo item (its name, components, mass shares). Marked `data-illustrative`.
- Computed: a value worked out from sourced values. Marked `data-computed="how it is computed"`.

## How a claim is recorded

Each claim is one entry in `data/evidence.json`: `id`, `topic`, `claim` (one sentence), `quote` (8 to 60 words, copied verbatim from the source), `source_title`, `source_authors`, `source_year`, `source_org`, `source_kind`, `landing_url`, `doc_url`, `doi`, `locator` (where in the source), `material`, `conditions` (oxygen percent, pressure, gravity, flow; `null` when the source does not say), and `limits` (what the evidence does not cover).

Pages mark sourced text with `data-evidence="id1 id2"`. A leftover `data-slot` attribute means unfinished copy and fails the gate.

## The three gates

1. Offline citation gate, `npm test`. Checks the shape of every evidence entry, that every id used by the pages and by `data/passport.json` exists, that no `data-slot` is left, and that every number with a unit or percent sign and every sentence with a word such as "tested", "shows", "limit" or "threshold" sits inside an element marked as evidenced, computed or illustrative. It also reads the scripts and JSON that the pages load. Failures list file, line and text. Unused evidence entries are listed, not failed.
2. Live quote check, `npm run test:quotes`. Downloads each `doc_url` (HTML or PDF), extracts the text, normalises it (Unicode, quotes, hyphens, line breaks, whitespace) and requires the quote to be in it word for word. A match that differs only in letter case passes and is printed as a note. It also requires `landing_url` to answer with a 2xx or 3xx status. Downloads are cached in `.cache/`.
3. LLM judge, `npm run test:judge`. Two checks with prompts in `tests/judge/prompts/`: does the source passage support each claim (numbers, units, material, conditions, scope), and is every factual or numeric assertion on each page backed by a listed claim. It writes `reports/judge-report.json` and `reports/judge-report.md` and exits 1 if any item is unsupported or any assertion is unbacked.

## How to run them

- Needs Node 22 and `pdftotext` (package `poppler-utils`). No npm install.
- `npm test`, then `npm run test:quotes`, then `npm run test:judge`.
- The judge needs `ANTHROPIC_API_KEY`. `JUDGE_MODEL` picks the model (default `claude-sonnet-5-5`). Without a key it exits with code 2 and says it did not run. It never reports a pass it did not earn.
- An external judge can use the same prompts: `node tests/judge/run.mjs --emit-inputs DIR` writes one JSON file per call and calls no model. The judge writes a verdict file with the same name into another directory, adding a `judge` field with its name. `node tests/judge/run.mjs --ingest DIR` turns those into the same report and exit code.
- Exit codes of the judge: 0 pass, 1 fail, 2 did not run.
- Other settings: `SITE_ROOT` and `EVIDENCE_FILE` point the gates at another site or evidence file, `CACHE_DIR` and `REPORT_DIR` move the cache and the reports. Behind a proxy that Node does not pick up on its own, set `NODE_USE_ENV_PROXY=1`.

## What the gates cannot prove

- The offline gate is a net. It reads text and scripts, not images, figures or text built in ways it cannot see, and it knows only a fixed list of units and claim words.
- The quote check proves the passage exists in the source. It does not prove the source is right, that the passage supports the claim, or that the page will not change later. A scanned PDF with no text layer cannot be checked.
- The judge is a model's opinion. It can be wrong in either direction, it sees only an excerpt, and nothing proves it listed every assertion on a page. Run a second judge through the emit and ingest route for the claims that matter.
- No gate says an item is safe. A supported claim means only that the source says it, for the conditions it names.
