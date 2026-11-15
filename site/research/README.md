# Research claims

This folder holds the research behind the site: claims that were collected and checked, but are **not** all published.

## What is here

- `evidence/<lane>.verified.json`: 197 verified claims in 8 research lanes (a lane is one research question). They cite 78 documents; every document that `data/evidence.json` cites is among them. Each claim has the same fields as an entry of `data/evidence.json` (`id`, `claim`, `quote`, `source_title`, `source_authors`, `source_year`, `source_org`, `source_kind`, `landing_url`, `doc_url`, `doi`, `locator`, `limits`, and more), plus the checking notes `lane`, `evtool_found`, `usefulness`, `verdict` and `verifier_note`.
- `sources-inbox.txt`: a reading list. One URL per line, an optional title after a tab. A document listed there goes into the evidence base before any claim cites it.

## How each claim was checked

1. A researcher proposed the claim with one verbatim quote from the document at `doc_url`.
2. The quote was looked up in the downloaded text of that document (`evtool_found`). Only claims whose quote was found are in these files.
3. A second reader opened the document, read the passage in its context and compared the claim with the quote: numbers, units, material, conditions and scope. The note is in `verifier_note`, and the outcome in `verdict`: `keep` (unchanged) or `fixed` (claim, quote or limits corrected). Claims that failed this step were rejected and are not in these files.
4. Metadata (title, authors, year, DOI) was matched with the public record of the document where one exists.

This is a check that the passage exists and supports the claim as worded. It does not prove that the source is right.

## What is published

Only claims in `data/evidence.json` are published on the site. A claim in this folder reaches the site when somebody copies it into `data/evidence.json` and it passes the three gates in `docs/evidence-method.md` (offline citation gate, live quote check, LLM judge). The evidence base (`docs/evidence-base.md`) reads this folder, the inbox and `data/evidence.json` to build its documents; being in the base does not publish anything.
