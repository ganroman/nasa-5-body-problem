# Concept draft for team review

**Status:** draft for the team to challenge · Sat 14 Nov 2026
**Origin:** the team brainstorm, recording 1: the traveler path and "what in those 24 cases I must read" (see `Braninstorming/`). Narrowed, reviewed against the data and edited with SI assistance. Updated after team review to distinguish measured evidence from preliminary assessments of untested conditions. User and scope choices below are recommendations for the team, not claims that a vote has occurred.

---

## The concept in one sentence

> A **habitat materials engineer** selects a material and cabin conditions. The dashboard ranks relevant NASA combustion evidence, explains what transfers to that design, and identifies what still needs testing. Where a defensible model exists, it also presents a clearly labelled preliminary assessment of behavior under untested conditions.

The traveler is the person in the story. The user is the person working the dashboard.

## Open decisions for the team

**Decision 1: Primary user — recommend the habitat materials engineer.** Their decision is: “Which existing experiments support this material choice, and what additional validation is needed?” Engineers are in the challenge’s listed audience, and research evidence fits their work directly. A trainer generally needs approved procedures; these experiments do not establish those procedures. Keep the traveler as the person in the presentation story.

**Decision 2: Product name (changed).** "Flame in Freefall" is the challenge title, so other teams can use it too. The team picks its own name.

## What the dashboard does

One complete path:

1. **Select the setting:** spacecraft in transit, or a lunar habitat. - I would say the dashboard should have both. We should have enouph data from data sources.
2. **See the conditions, each with its source (changed)**, labelled as assumed mission conditions:
   - Transit: about 21% O₂, 1 atm, ventilation 0–30 cm/s, microgravity *(Researcher's Guide: ISS air and ventilation range)*
   - Lunar habitat: 30% O₂ or more, 10.2 psi (0.69 atm) or less, 1/6 g *(challenge text)*
3. **Choose a material:** solid-material flame spread first, using materials that NASA actually tested: PMMA (acrylic), SIBAL cotton-fiberglass fabric, silicone, Nomex *(BASS, BASS-II, Saffire)* - here we must use all materials that tested already - dashboard will allow us to sort it.
4. **Get a ranked evidence briefing:** tests ranked by how closely their conditions match (material, O₂, pressure, airflow, gravity), with the ranking criteria visible.
5. **Open the evidence:** the source test rows, and the finding with its page number or DOI.
6. **Explore an untested environment:** where supported, open a preliminary assessment with the model, assumptions, measured inputs and limitations visible. Otherwise show the closest evidence and the unanswered research question.



Each result answers three questions:

| Question | What the dashboard shows | Where it comes from **(changed)** |
|---|---|---|
| What did NASA test? | Material, atmosphere, airflow, gravity | Normalized test-conditions table |
| Why is it relevant here? | What matches and what differs, e.g. "airflow matches · O₂ +9 points · gravity differs" | Computed in code from the two condition sets |
| What can we conclude? | A cited finding and an explicit limit on where it applies | Curated findings table (guide pages, publication DOIs) |

## Data: two tables (changed)

The BASS and BASS-II tables list materials and conditions but **no outcomes**: no flame spread and no extinction. Saffire has only about 10 real tests. So outcomes and findings come from a separate curated table.

1. **Test-conditions table**, normalized from the PSI CSVs:
   - Solid materials: BASS, BASS-II, Saffire I–III (roughly 270 source rows; recount and distinguish individual tests from summaries after normalization)
   - High-O₂ proxy: ACME BRE (a gas burner that emulates burning solids, up to 40% O₂)
   - Deferred: FLEX, for a later suppression briefing
2. **Findings table**, curated, 15–25 rows. Each row holds: the finding in plain words, a supporting source excerpt and locator (guide page or publication DOI plus section/page where available), the investigation, the conditions it applies to, and the topic (prevention, detection or suppression). Candidate findings to verify against the original sources before display:
   - Report how flame spread or another specified outcome varies with airflow for a particular tested material and atmosphere. Do not generalize “most dangerous at 10 cm/s” across materials and conditions.
   - In low airflow, some materials burn at lower O₂ in microgravity than on Earth.
   - NASA's standard Earth flammability test (Test 1) "might not be conservative" in microgravity.
   - Nitrogen sprayed at a flame can strengthen it, by pulling in oxygen.

**What the SI does:** it explains computed differences and approved findings in plain language, with claim-level citations. Each finding must be supported by its source excerpt and applicable conditions; a citation alone does not establish support. If no finding applies, say “No applicable finding in our curated sources.” Rankings, differences, coverage counts and any numerical model outputs come from code or an identified scientific model, not SI-generated arithmetic or intuition.

## The memorable moment

First show one verified, material-specific finding that is useful for the transit scenario. Then switch to the lunar habitat with the same material and reveal which parts of that evidence still apply.

Use separate, verified coverage statements rather than “0 of ~270 tests match”:

> **No solid-material test records in this dataset cover the selected oxygen concentration.**
> **No lunar-gravity measurements in this dataset.**
> **Direct material evidence:** the closest solid-material experiments, with their condition differences.
> **High-oxygen analogue:** ACME BRE gas-burner experiments, where relevant; different fuel configuration, not a material certification.
> **Preliminary assessment:** a sourced model-based estimate if available, otherwise a qualitative hypothesis and the test needed to evaluate it.

Show exact counts, denominators and counting rules in details after normalization. Missing conditions are **unknown**, not mismatches. Coverage statements describe this dataset, not all combustion research. FM2 can appear as research context only after its current status and planned measurements are verified.

The ending is useful evidence plus a next validation question, rather than an empty result list.

## Preliminary assessment for untested environments

**Team input:** combining Earth and microgravity experiments may help anticipate how materials behave in new environments, even where direct experiments are absent. Include this as a clearly separated assessment layer, labelled **“Preliminary assessment — unvalidated for selected conditions.”** Avoid “pre-evaluated data,” which could be mistaken for measured or validated data.

Measured observations are evidence supporting an assessment; the projected behavior is a model result or hypothesis. It can inform research and early design exploration, but does not demonstrate safe material use or establish an operational procedure.

Use three visibly distinct categories:

| Category | What it means | What the user sees |
|---|---|---|
| Measured | Observations under recorded experimental conditions | Source, material, conditions and observed outcome |
| Model-based estimate | Output from an identified scientific model applied to new conditions | Model/source, inputs, assumptions, validation domain, output and uncertainty or sensitivity where justified |
| Qualitative hypothesis | A plausible interpretation without a validated quantitative model | Supporting findings, reasoning, unresolved variables and proposed validation test; no invented numerical prediction |

Combining 0g and 1g results is not automatically a valid interpolation to lunar gravity. Intermediate-gravity behavior may be nonlinear or change regime. Changing oxygen, pressure, airflow, sample geometry or material at the same time also prevents attributing differences to gravity alone. A target between two gravity values can still fall outside the model’s supported domain in other dimensions.

Before displaying a quantitative estimate:

1. Identify a published model or justified relationship for the specific material class, outcome and conditions. Record its source and implementation.
2. Check that Earth and microgravity inputs are comparable; record differences and missing variables rather than silently merging them.
3. Check the implementation against measured cases and report error where meaningful. Reproducing input cases is a consistency check, not validation at lunar gravity.
4. State which dimensions are interpolated or extrapolated and which assumptions are untested. Report numerical uncertainty only when a method supports it; otherwise state that uncertainty is unquantified.
5. Show the additional experiment needed to test the assessment. Do not convert it into a fire probability, safety score or material approval.

**Hackathon ceiling:** the evidence briefing must work without this layer. If a suitable model and comparable inputs cannot be verified in time, ship a sourced qualitative assessment and validation question. Keep quantitative projection deferred; an SI-generated curve is not a substitute for a scientific model.

## The insight

Start from the team's own theme, **"variables change, processes stay"**, and tighten the scientific claim:

> **[Rewrite in the team's own words.]** Draft: "The questions travel with you. The answers depend on the environment."

Prevention, detection and suppression stay the organizing questions. Flame behavior and the right response can change a lot with gravity, atmosphere and airflow.

**Science note:** the challenge says zero-gravity and Earth results “could bound” partial gravity. Show measured regimes separately unless a source establishes an applicable bound for the selected outcome and conditions. Any projected range must identify its derivation; the span between two observations is not automatically a physical bound or confidence interval. Microgravity alone does not establish applicability: material, pressure, O₂, airflow and geometry also matter.

## Scope for this hackathon

| Decision | Choice |
|---|---|
| Environments | Transit spacecraft and lunar habitat; Mars deferred |
| Core | Tests ranked by condition match, with cited interpretation and a quantified gap |
| Main scientific thread | Solid-material flame spread: BASS, BASS-II, Saffire, with ACME BRE as the high-O₂ proxy |
| Suppression | Deferred until the primary evidence path works |
| Untested conditions | Preliminary qualitative assessment first; quantitative estimates only with a verified suitable model |
| Earth angle | One sourced spin-off: the ISS water-mist extinguisher |
| Presentation | A traveler moving from transit into a lunar habitat |

**Deferred:** activity-risk percentages, live monitoring, power plants, generated emergency protocols, and Mars. The data supports an evidence briefing. It doesn't support accident probabilities or operational instructions. One role is enough for the demo.

## The 30-second video (changed)

| Time | Shows / says |
|---|---|
| 0–3 s | "We're Five-Body Problem, for the Flame in Freefall challenge." |
| 3–11 s | "Preparing [a scientist / a habitat design] for the Moon: which fire research applies?" Select transit and PMMA. Relevant experiments appear with one verified, material-specific finding. |
| 11–21 s | Switch to the lunar habitat. Show separate oxygen and gravity coverage gaps, direct material evidence and a high-oxygen analogue. Label any projected behavior as preliminary and unvalidated. |
| 21–30 s | Open a source. "[Name] shows what we know, what we can provisionally infer, and what we still need to test." |

**Success:** a user can name the most relevant tests, explain one supported finding, and point to one unresolved gap in under a minute.

## First-build acceptance

One material, two sourced environment presets, three verified findings and a working evidence-to-source path come first. Choose the material after confirming its source conditions and findings. Expand toward 15–25 findings only after this path works. Keep all 24 investigations discoverable through metadata, while labelling the smaller subset with normalized comparisons.

A user must be able to distinguish a measurement from an estimate or hypothesis, inspect the ranking inputs including unknown values, and open the supporting source. No numerical projection is required for this first path.

## Build plan

| Owner | Task | Done by |
|---|---|---|
| A | Normalize the first material’s solid-test records and relevant BRE records; expand solids next, defer FLEX | Sat 17:00 |
| B | First three verified findings with excerpts and applicability; expand toward 15–25 | Sat 17:00 |
| C | Ranking and difference logic; coverage counts | Sat 20:00 |
| D | UI path, with a skeleton deployed early | Skeleton by Sat 19:00 |
| C + E | SI explanations with per-sentence citations | Overnight |
| E | Demo script, video, submission text, SI disclosure | Sun 12:00–18:00 |
| All | Feature freeze Sun 12:00 · submit by Sun 21:00 | |

## Risks

| Risk | Mitigation |
|---|---|
| Findings extraction takes longer than planned | Start with three source-verified findings for the chosen material; expand after the complete path works |
| Unit parsing errors in the normalized table | Show the raw source row next to every normalized value |
| The SI states something the sources don't support | Use approved findings with supporting excerpts and applicability; say “No applicable finding in our curated sources” where needed |
| Judges see "search with filters" | Lead the demo with the "matches / differs" card and the gap number, not with search |
| Gap numbers are wrong | Recount after normalization; distinguish records from tests and unknowns from mismatches; show counting rules |
| Preliminary estimates look like experiments or safety advice | Separate measured/model/hypothesis categories; show assumptions and validation limits; defer numerical output without a suitable model |

## Questions for the team to challenge

1. Does the team accept the materials engineer as the primary user?
2. Which verified material-specific finding makes the transit briefing useful before the lunar evidence gap appears?
3. Can we verify a suitable projection model in time, or should preliminary assessments remain qualitative for this build?
4. Which material has three defensible findings and comparable condition records for the first complete path?
5. Transit plus Moon: does deferring Mars lose the "recency" angle that was raised in the brainstorm?
6. What should the product be called?

## SI disclosure (draft)

"The concept originated in the team's brainstorm (recordings of 14 Nov, in the repo). SI (Claude) was used to organize the brainstorm, check data feasibility, review the concept, and edit wording. The data normalization scripts were written with SI assistance. All findings shown in the app cite NASA sources."
