# Concept draft for team review

**Status:** draft for the team to challenge · Sat 14 Nov 2026
**Origin:** the team brainstorm, recording 1: the traveler path and "what in those 24 cases I must read" (see `Braninstorming/`). Narrowed, reviewed against the data and edited with SI assistance. Updated after team review to distinguish measured evidence from preliminary assessments of untested conditions. User and scope choices below are recommendations for the team, not claims that a vote has occurred.

---

## The concept in one sentence

> **A material passport that shows how far its experimental evidence travels as you change the environment.**

A habitat materials engineer picks a tested material and opens its passport: NASA experiments, measured conditions and supported findings. They switch between transit and a lunar habitat, or adjust oxygen, pressure and airflow. The dashboard updates which evidence remains relevant and explains what changed.

**The material travels. Does the evidence?**

We explore the **boundary of available evidence**, not the boundary between safe and unsafe. The passport is a research briefing, not a safety certificate. The traveler remains the person in the presentation story; the engineer is the person working the dashboard.

## The main screen: three connected parts

| Part | Purpose |
|---|---|
| Material passport | What material is this, and what has NASA learned about it? |
| Environment controls | Where are we taking it, and under which conditions? |
| Evidence map | Which experiments support this scenario, which differ, and what remains unknown? |

The passport supplies the memorable metaphor, the boundary explorer supplies the interaction, and the downloaded scenario passport supplies the takeaway. Ranking supports this experience rather than being its headline feature.

## Open decisions for the team

**Decision 1: Primary user — recommend the habitat materials engineer.** Their decision is: “Which existing experiments support this material choice, and what additional validation is needed?” Engineers are in the challenge’s listed audience, and research evidence fits their work directly. A trainer generally needs approved procedures; these experiments do not establish those procedures. Keep the traveler as the person in the presentation story.

**Decision 2: Product name (changed).** "Flame in Freefall" is the challenge title, so other teams can use it too. The team picks its own name.

## What the dashboard does

One complete path:

1. **Open a material passport:** browse, filter and sort all tested solid materials represented in our source data. Preserve original material names and distinguish formulations, coatings and sample geometries. Clearly label records whose conditions or findings have not yet been processed.
2. **Compare both environments:** transit spacecraft and lunar habitat are supported scenarios. Switching destinations keeps the selected material and changes the reference conditions:
   - Transit: an ISS-like reference of about 21% O₂, 101 kPa and microgravity; ventilation reference 0–30 cm/s *(Researcher's Guide; verify applicability and source locator)*.
   - Lunar habitat: a reference scenario of 30% O₂, about 70 kPa and 1/6 g, based on the challenge's ≥30% O₂ and ≤10.2 psi envelope. Airflow is assumed, not a measured lunar-habitat specification.
3. **Explore the conditions:** adjust oxygen, pressure and airflow. Show values and units, distinguish user-selected values from sourced presets, and update the comparison and map together. Destination sets the gravity regime.
4. **Watch the evidence change:** show experimental points at their measured conditions while the selected scenario moves. Rank relevant records by material, O₂, pressure, airflow and gravity, with criteria and unknown values visible.
5. **Read the interpretation:** explain one supported finding, what matches, what differs and what remains unresolved. Open the source test rows and source excerpts with page/section locators and investigation DOIs.
6. **Explore an untested environment:** show a preliminary assessment only where supported, with its model or reasoning, assumptions and limitations visible. Otherwise show the closest evidence and unanswered research question.
7. **Download the scenario passport:** leave with the selected material and conditions, supporting evidence, differences and next validation question.

### Evidence-map rules

Plot actual experimental points, not synthetic measurements. A two-dimensional view (for example oxygen × pressure) must state that other dimensions still affect applicability. Show records with missing coordinates separately, or disclose how many cannot be plotted; never place missing values at zero.

Do not draw a continuous “tested territory” around scattered observations unless its interpretation is scientifically justified. Proximity on the map is not proof of applicability. Preliminary model estimates may appear as a separately labelled overlay only when supported by the assessment requirements below; measurements, estimates and the user's scenario must remain distinguishable.

### The takeaway: a passport for the selected scenario

The download contains material identity and configuration, selected cabin conditions and their provenance, relevant records and findings, condition differences and unknowns, a preliminary assessment where supported, and the next validation question, all with sources. It must describe the current selection, not a stale preset. Retain uncertainty, limitations and SI disclosure in the exported artifact. The existing mock uses JSON; the scientific content and traceability matter more than adding another export format.

Each result answers three questions:

| Question | What the dashboard shows | Where it comes from **(changed)** |
|---|---|---|
| What did NASA test? | Material, atmosphere, pressure, airflow, gravity | Normalized test-conditions table |
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

The ending is a downloadable scenario passport: useful evidence, explicit limits and a next validation question. The selected scenario moves while measured observations stay fixed, making the gap something the user explores.

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

> **The material travels. Does the evidence?**

The original theme remains the motivation: the same fire-safety questions follow the traveler, while the evidence supporting their answers changes with the environment.

Prevention, detection and suppression stay the organizing questions. Flame behavior and the right response can change a lot with gravity, atmosphere and airflow.

**Science note:** the challenge says zero-gravity and Earth results “could bound” partial gravity. Show measured regimes separately unless a source establishes an applicable bound for the selected outcome and conditions. Any projected range must identify its derivation; the span between two observations is not automatically a physical bound or confidence interval. Microgravity alone does not establish applicability: material, pressure, O₂, airflow and geometry also matter.

## Scope for this hackathon

| Decision | Choice |
|---|---|
| Environments | Transit spacecraft and lunar habitat; Mars deferred |
| Core | Material passport + interactive evidence-boundary explorer, supported by ranked records and cited interpretation |
| Material inventory | All tested solid materials in the source data discoverable; processing completeness visible |
| Takeaway | Downloadable passport for the selected scenario, including sources, limitations and next validation question |
| Main scientific thread | Solid-material flame spread: BASS, BASS-II, Saffire, with ACME BRE as the high-O₂ proxy |
| Suppression | Deferred until the primary evidence path works |
| Untested conditions | Preliminary qualitative assessment first; quantitative estimates only with a verified suitable model |
| Earth angle | One sourced spin-off: the ISS water-mist extinguisher |
| Presentation | A traveler moving from transit into a lunar habitat |

**Deferred:** activity-risk percentages, live monitoring, power plants, generated emergency protocols, and Mars. The data supports an evidence briefing. It doesn't support accident probabilities or operational instructions. One role is enough for the demo.

## The 30-second video

| Time | Shows / says |
|---|---|
| 0–4 s | “Take this material to the Moon.” Open its passport, with team/product identification on screen. |
| 4–11 s | Reveal one surprising, verified NASA finding and its source under the transit reference conditions. |
| 11–21 s | Switch to the lunar habitat and adjust cabin conditions. The scenario moves; measured points stay fixed. Explain the changed evidence applicability, including oxygen and gravity gaps. |
| 21–26 s | “The material travels. Does the evidence?” Show the closest relevant evidence and next validation question. |
| 26–30 s | Download the scenario passport with findings, differences, limitations and sources. |

**Success:** within a minute, a user can explain one supported finding, identify how a changed condition affects evidence applicability, distinguish measurement from assessment, and download the corresponding passport.

## First-build acceptance

The dashboard exposes the full tested-solid-material inventory from our sources, with processing completeness visible. Build and verify the end-to-end path using one material first, two sourced environment presets and three verified findings; then extend normalized comparisons across the inventory. Expand toward 15–25 findings after the path works. Keep all 24 investigations discoverable through metadata, distinguishing those with detailed normalized comparisons.

Acceptance checks:

- Switching transit/lunar preserves the material and updates the scenario, comparisons and coverage together.
- Oxygen, pressure and airflow controls update the displayed conditions and evidence comparison; relevant plot coordinates move while experimental points remain fixed.
- Missing coordinates remain unknown; the map states its dimensional limits and implies no continuous tested region or safety boundary.
- A user can inspect ranking criteria and sources, and distinguish observations, estimates and hypotheses.
- The downloaded passport contains the currently selected material and conditions, evidence, source references, limitations and next validation question. Unsupported assessments are explicitly absent rather than invented.

No numerical projection is required for this first path. The current [dashboard mock](../prototype/dashboard-mock.html) demonstrates the interaction using clearly labelled dummy records and placeholder findings; real-source integration and verification remain required.

## Build plan

| Owner | Task | Done by |
|---|---|---|
| A | Normalize the first material’s solid-test records and relevant BRE records; expand solids next, defer FLEX | Sat 17:00 |
| B | First three verified findings with excerpts and applicability; expand toward 15–25 | Sat 17:00 |
| C | Ranking and difference logic, coverage counts and scenario-passport export | Sat 20:00 |
| D | Passport, environment controls and experimental-point map; skeleton deployed early | Skeleton by Sat 19:00 |
| C + E | SI explanations with per-sentence citations | Overnight |
| E | Demo script, video, submission text, SI disclosure | Sun 12:00–18:00 |
| All | Feature freeze Sun 12:00 · submit by Sun 21:00 | |

## Risks

| Risk | Mitigation |
|---|---|
| Findings extraction takes longer than planned | Start with three source-verified findings for the chosen material; expand after the complete path works |
| Unit parsing errors in the normalized table | Show the raw source row next to every normalized value |
| The SI states something the sources don't support | Use approved findings with supporting excerpts and applicability; say “No applicable finding in our curated sources” where needed |
| Judges see "search with filters" | Lead with the material journey, moving scenario and downloaded passport; ranking supports the experience |
| Map suggests an unsupported safety boundary | Plot discrete observations, disclose missing coordinates and other dimensions; label model overlays separately |
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

"The concept originated in the team's brainstorm (recordings of 14 Nov, in the repo). SI tools (Claude and Codex) were used to organize the brainstorm, check data feasibility, review the concept, and edit wording. The data normalization scripts were written with SI assistance. The passport and boundary-explorer framing and prototype were developed with SI assistance. Production findings must cite their sources; the current mock uses explicitly labelled dummy data and placeholder findings."
