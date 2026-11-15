# CHECKLIST: single source of truth for the final push

**Live copy: branch `checklist`** (`origin/checklist`). `main` requires PRs, so claims cannot go there. Always read and edit this file on `checklist`: `git fetch origin && git checkout checklist && git pull --rebase origin checklist`. The copy on `main` is only a snapshot.

Deadline: **Submit for Judging by 23:59 Vienna time. Target: 21:00.** All times are Vienna.
Humans: **Roman** and **Ivan**. Agents work for one of them and put that owner in the claim (`@roman-claude`, `@ivan-agent-2`, ...).

## Rules for agents (read before touching anything)

1. **This file (on branch `checklist`) is the only task list.** Do not start work that is not on it. If you find new work, add a line to the bottom of "Open" with the next free `T##` and status `[ ]`, in its own commit.
2. **Claim before you work.** Change only your task's line from `[ ]` to `[~] @you HH:MM`. Commit that one line alone and push to `checklist` **immediately**:
   `git pull --rebase origin checklist && git commit -am "claim: T## @you" && git push origin checklist`
   If the push is rejected, pull again and re-read the line. If someone else claimed it first, **pick another task**. Never work on a `[~]` task that is not yours.
3. **Only edit your own line** (and move it to "Done" when finished). Never reformat, reorder or renumber other lines. This keeps merges conflict-free.
4. **Stale claims:** a `[~]` older than 45 minutes with no commit referencing its `T##` may be taken over. Write `takeover from @them` on the line.
5. **Finish:** change to `[x] @you HH:MM <commit or PR link>`, move the line to "Done", pull --rebase, push to `checklist`. Commit message starts with `T##:`.
6. **Blocked or needs a human:** change to `[!] @you reason`, push, and move on to another task.
7. **Code changes go on a branch and a PR** (`t##-short-name`), never straight to `main`. A human merges. Only edits to this file go straight to the `checklist` branch (never edit it in a code branch). `main` is protected; merging into it auto-deploys (`deploy/autodeploy.sh`, runs migrations).
8. **Never push to `Hantok/cargo-passport` without Roman's explicit go-ahead in the chat.** Tasks for that repo prepare the content; a human pushes.
9. **No mock data.** Only NASA PSI and the cited NASA sources. No invented numbers, DOIs or references. If a fact has no source, leave it out.
10. **Hackathon rules** (video structure, SI disclosure, watermark on SI-generated images, team-made hook) apply to every artifact. Do not publish secrets (`SI_API_KEY`, `.env`).
11. Commit messages: no `Co-Authored-By`, no AI attribution.
12. Keep tasks small (under 30 minutes). Split a big task into new lines instead of holding a claim.
13. Run the tests before every PR: `cd backend && uv run pytest -q`, `node frontend/index.test.cjs`, `node prototype/*.test.cjs`.

Status key: `[ ]` open · `[~]` in progress (claimed) · `[!]` blocked · `[x]` done. `HUMAN` = an agent cannot do it.

## Open

### A. Merge and deploy
- [ ] T01 HUMAN (Roman): review and merge PR #49 (purge mock data, https://github.com/ganroman/nasa-5-body-problem/pull/49). The merge deploys and runs the purge on prod; a DB dump is taken first.
- [ ] T02 After T01: check live (https://cargo.qwadratic.me): `/health` ok, `/cargo` lists only the 5 curated items, no `mock`/`MOCK`/`M##` in `/environments`, `/routes`, `/sources`. Report in the line.
- [ ] T03 HUMAN (Roman): set `SI_API_KEY` (Eustella) on the demo server and restart.
- [ ] T04 After T03: on live, "Explain" returns a real SI explanation, not "SI not configured". Note the result on the line.
- [ ] T05 Lunar base O₂ and pressure show "unknown" in the app, while the video says 30% O₂, 0.69 atm. Find the cited NASA source, fix the seed data (`backend/seed/environments.yaml`) via PR, or tell Roman the video claim has no source.

### B. Public repo `Hantok/cargo-passport` (prepare content, a human pushes)
- [ ] T06 Prepare a code snapshot of the team repo without `brag-output` v1–v5 renders, in a folder outside the repo. List what is included.
- [ ] T07 README: add the Live demo link (https://cargo.qwadratic.me) and repo QR.
- [ ] T08 README: add the PSI DOIs, generated from `data/investigations/*.json`. No invented DOIs.
- [ ] T09 HUMAN (Roman): decide on `prototype/dashboard-mock.html` (contains mock data, still reachable by URL). Delete it or keep it out of the public snapshot.
- [ ] T10 HUMAN (Roman): after T06–T08 and T10–T12, give the go-ahead to push to `Hantok/cargo-passport`.

### C. Media and compliance
- [~] T11 SI watermark: `hero.png` and `team.png` (Hantok `media/`) are done locally with a visible "SI-assisted" label, in /tmp/claude-1000/-home-roman-Projects-nasa-hackathon/65a436d4-009f-4f41-9269-d3d07ae9d7a0/scratchpad/hantok/out/ (@roman-claude). The two `presentation/final/` images were Mac-only and are lost: regenerate from the live app or slides, or leave them out of the submission. Waits for T10 to push.
- [~] T12 Typo "combustiion" in `team.png` is fixed locally (retouched the sign text, reads "combustion") in /tmp/claude-1000/-home-roman-Projects-nasa-hackathon/65a436d4-009f-4f41-9269-d3d07ae9d7a0/scratchpad/hantok/out/team.png (@roman-claude). Waits for T10 to push.
- [ ] T13 HUMAN (Roman): confirm that no person under 18 appears in the team image. (It shows five adult-looking illustrated people; the hero image has no people.) Note: both images are SI-generated, so mention them under "SI use" in the form.
- [x] T14 CANCELLED: Roman has no access to the Mac, so the Mac-only files (`presentation/final/`, `docs/brag-video-review.md`, v5/v6 text, `v6/composition`) are not recoverable. Not needed for the submission.

### D. Submission form
- [ ] T15 Draft the form text in `docs/submission-form.md`: Name, Summary, Detailed description, SI use, NASA Data (DOIs), References (fonts, GSAP, Kokoro, HyperFrames, Eustella, ZARM Zenodo). Sources: `brag-output/v6/description.txt`, the Hantok README. Only facts that exist in the repo. Note: `brag-output/v6/description.txt` is lost with the Mac; rebuild the text from the Hantok README and the repo, and have Roman check it.
- [ ] T16 HUMAN (Roman): upload the 30 s video and paste the Demo video link.
- [ ] T17 Final audit (after T01–T15): no mock data anywhere, no secrets, every link in README and form opens, video is 30.0 s with watermark. Post a pass/fail list on the line.
- [ ] T19 Check the QR code drawn inside `team.png` and `hero.png` (Hantok `media/`): it is SI-drawn and may not scan. If it does not, tell Roman; the real QR files are `brag-output/v6/cargo-passport-repo-qr.png/svg`.
- [ ] T18 HUMAN (Roman): fill the form, tick Terms and Originality, press **Submit for Judging**. Target 21:00, hard limit 23:59.

## In progress
<!-- Claims appear here as the `[~]` lines in Open. Do not move them. -->

## Done
- [x] D01 Backend: schema, API, curated seed (NASA PSI and NASA-STD-6001 / NTRS data), ingest, 123 tests, CI.
- [x] D02 Frontend: Cargo Passport page with route, environment changes and evidence comparison; short UI/UX pass (PR #47).
- [x] D03 Prototypes: cargo and environment map, cargo journey animation, with tests.
- [x] D04 Pitch story docs (PR #46) and presentation slides.
- [x] D05 Video v6: 30.0 s, watermark, subtitles, SI metadata (PR #48); QR codes decode to the Hantok repo.
- [x] D06 Auto-deploy to https://cargo.qwadratic.me from `main` (DB dump, migrations, restart, rollback).
- [x] D07 Purge-mock migration tested on a local Postgres copy of prod; mock seed code and tests removed; heading, favicon, `.gitignore` (PR #49, open, merge is T01).
