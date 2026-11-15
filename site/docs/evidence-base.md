# Evidence base

The evidence base is a folder of Markdown pages, one per source document that our claims cite, kept in its own git repository and indexed by [gbrain](https://github.com/garrytan/gbrain). People and agents search it to find passages. It is a reading aid. It publishes nothing: only claims in `data/evidence.json` appear on the site (see `docs/evidence-method.md`).

## What it holds

The base is one directory outside the public site, given by `--base DIR` or `EVIDENCE_BASE_DIR`:

- `nasa/documents/<slug>.md` and `nasa/index.md`: documents whose host is `nasa.gov` or a subdomain of it.
- `other/documents/<slug>.md` and `other/index.md`: all other documents.
- `raw/`: the downloaded originals and their extracted text. Never synced, never committed.
- `manifest.json`: one entry per document (URL, class, slug, title, sha256, size, content type, fetch time, etag, last-modified, failures in a row, and for each citing claim whether its quote was found).
- `reports/`: one file per day with a section for each run that changed a file, still has a missing quote or a document failing three runs in a row, or met a gbrain failure; plus reading leads. Local run logs, not committed.

Each page has frontmatter (title, tags, a date from the source year, the source URL, DOI, publisher, authors, `claim_ids`, a `licence_note`), then the claims that cite the document with their verbatim quotes and whether each quote is still in the text, then the full text. PDF text is split by page (`### Page 12`) so a search hit names its page.

Documents come from three inputs: `data/evidence.json`, `research/evidence/*.verified.json` and `research/sources-inbox.txt` (see `research/README.md`).

## Two gbrain sources

- `nasa-evidence`, path `<base>/nasa`: NASA documents.
- `other-evidence`, path `<base>/other`: everything else.

Both are registered as federated, so a plain search covers both. To search one: `gbrain search "oxygen limit" --source nasa-evidence` (or `--source other-evidence`). Add `--json` for machine output. To keep one out of plain searches, run `gbrain sources unfederate other-evidence`; the pipeline registers a source only when it is missing, so it never undoes that. Each source is a subfolder of the base's git repository, so gbrain keeps its slugs relative to the folder (`documents/<slug>`, `index`) and agents cite a page as `[nasa-evidence:documents/<slug>]`.

## First run on the server

1. Needs Node 22, `git` and `pdftotext` (package `poppler-utils`). No npm install.
2. Check out the repository, for example at `/opt/cargo-passport`, and create the base directory for the user that owns the gbrain brain: `sudo install -d -o gbrain -g gbrain -m 750 /var/lib/evidence-base`. The base must be a new or empty directory; the pipeline refuses one that holds other files, because it commits everything in it.
3. Try it without gbrain, as that user: `sudo -u gbrain node tools/evidence-base/run.mjs --base /var/lib/evidence-base --no-sync`. The first run downloads every document (a few minutes; it pauses 1.5 seconds between requests to one host).
4. See what the gbrain step will do: `node tools/evidence-base/run.mjs --base /var/lib/evidence-base --dry-run` prints the exact commands and runs none.
5. Run it for real as the same user. gbrain is found through `GBRAIN_BIN` or the `PATH`. It registers the two sources if missing (`gbrain sources add <id> --path <dir> --federated`) and syncs each (`gbrain sync --source <id> --no-pull`). The base repository has no remote, so the sync does not pull. A source that exists but is archived, or is registered at another directory, stops the run with the gbrain command that fixes it (`gbrain sources restore <id>`, `gbrain sources set-path <id> <dir>`).
6. gbrain reads committed files only, so the pipeline commits first and syncs after.

## Schedule

`deploy/evidence-base/` has `evidence-base.service`, `evidence-base.timer` (every day at 03:30 server time, plus a random delay of up to 45 minutes, and once after boot if a run was missed) and `evidence-base.env.example`. Copy the env file to `/etc/evidence-base/evidence-base.env` and edit the paths. Set `User=` of the service to the user that owns the brain, and check the path of `node` in `ExecStart=`. The `gbrain` command starts with `#!/usr/bin/env bun`, so the `PATH` line of the env file must hold bun's directory (a service gets only a short default `PATH`). `StateDirectory=` creates `/var/lib/evidence-base` for that user; with another base directory, create it by hand and remove that line. Then:

```
sudo cp deploy/evidence-base/evidence-base.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now evidence-base.timer
```

The same as one cron line:

```
17 3 * * * PATH=/home/gbrain/.bun/bin:/usr/local/bin:/usr/bin:/bin EVIDENCE_BASE_DIR=/var/lib/evidence-base GBRAIN_BIN=/home/gbrain/.bun/bin/gbrain /usr/bin/node /opt/cargo-passport/tools/evidence-base/run.mjs >> /home/gbrain/evidence-base.log 2>&1
```

## Exit codes

- `0`: all is well. A document that failed once or twice is listed in the report but does not fail the run.
- `1`: a cited quote is no longer in its document, or a cited document has failed three runs in a row.
- `2`: a setup problem: no base directory or one that cannot be used, a bad option, an unreadable input file or no document in the inputs at all, another run holding the lock, gbrain failing, or gbrain missing with `--require-gbrain`. When gbrain fails the base is already committed, the report says so, and the next run syncs again. If a quote is also missing, it is still printed and reported.

Without gbrain on the server the sync is skipped with a message and the exit code is not affected.

## Settings

Options: `--only nasa|other`, `--other-text full|excerpts`, `--no-sync`, `--dry-run`, `--leads`, `--require-gbrain`. Environment: `EVIDENCE_GIT_NAME`, `EVIDENCE_GIT_EMAIL` (author of the base's commits), `EVIDENCE_PAGE_TYPE` (default `source`, a type of gbrain's default schema pack; set `none` to leave `type` out if your pack does not declare it), `EVIDENCE_OTHER_TEXT`, `EVIDENCE_HOST_PAUSE_MS`, `EVIDENCE_RETRY_MS`, `GBRAIN_BIN`, `SITE_ROOT`, `EVIDENCE_FILE`. Behind a proxy that Node does not pick up, set `NODE_USE_ENV_PROXY=1`.

A run is safe to repeat: a second run with nothing new changes no file and makes no commit. A failed download never deletes a page: the last good text stays and the manifest entry shows the failure count. Two runs cannot overlap (a lock file in the base).

## How a document or a claim gets in

1. A document with no claim yet: add its URL to `research/sources-inbox.txt` (one per line, optional title after a tab). The next run fetches it and writes its page. This creates no evidence.
2. A claim: a researcher adds a verified claim with a verbatim quote to `research/evidence/<lane>.verified.json`. The next run adds it to its document's page.
3. Publishing: copy the claim into `data/evidence.json`. It then has to pass the site's three gates (offline citation gate, live quote check, LLM judge).

With `--leads`, if `data/stories.json` has a story that is not published yet (the first one is the next) and gbrain is present, the run searches `nasa-evidence` for the story's title and writes `reports/leads-<story id>.md`: pages to read, nothing more.

To make another host count as NASA, add its domain to `NASA_DOMAINS` in `tools/evidence-base/classify.mjs` and add a test case.

## "Quote no longer found"

The live check proves a quote is in the text we download now. When it is gone, the report names the claim, the document and the locator, the page shows `NOT FOUND`, and the run exits 1. Open the document at its URL. If the text moved or was reworded, fix the quote in the claim file (and in `data/evidence.json` if it is published) so it matches the source again. If the passage was removed, the claim loses its support: remove it or find another source. The old text stays in the base's git history.

## Limits

- Text only: HTML, PDF with a text layer, and plain text, JSON or CSV answers. A scanned PDF has no text layer and is reported as failed.
- JSON and CSV files are read as plain text. The site's own live quote check (`npm run test:quotes`) strips everything between `<` and `>` from any non-PDF file, so it can miss a quote from a CSV that the base finds. Check this before publishing such a claim.
- A quote that is in a figure, a table image or a page that needs a login cannot be checked.
- Documents that are not from NASA are kept for private research. Their pages say `licence not confirmed; kept for private research, do not republish`. The default keeps their full text, which suits a private server. For a server others can read, use `--other-text excerpts`: only the quoted passages with some text around them are kept (the full text of earlier runs stays in the git history).
- NASA pages say `licence not checked by this pipeline`. Nothing here states a licence.
- Nothing is deleted. A document that no input lists any more keeps its page and its index line, and is no longer fetched.
- In page text the comment opener `<!--` is written `&lt;!--`, so that no document can forge gbrain's timeline or facts markers. Quotes are checked against the original text, not the page.
- A page says when its text was fetched, and every quote status is a status against that text. A run that cannot fetch a document again keeps the page, checks new claims against the last good text, and counts the failure in `manifest.json`. `sha256` is the hash of the download of that day; a later download with the same text is not hashed again.
- The year of a page's date is the source year; month and day are placeholders (`01-01`), marked by `date_precision: "year"`.
- Pages of very long reports are large. gbrain handles them, but search answers for them are the least precise.
