# Cargo Passport — final build plan

**Team Five-Body Problem · 14 November 2026**

This is the consolidated implementation plan. It supersedes the product scope in the earlier [concept draft](concept-draft.md) and [cargo proposal](cargo-passport.md), while retaining them as discussion history. It incorporates the team’s latest cargo direction, passport + boundary interaction, and [source catalogue](../data/data-sources-catalog.md). This document specifies work to build; it does not claim these capabilities or scientific validations already exist.

## 1. What we are building

> **A cargo passport that connects an item’s components to NASA fire evidence—and shows how that evidence changes as the destination and cabin conditions change.**

**Hook:** “This cargo is going to the Moon. Does its evidence travel with it?”

**Primary user:** a payload designer assembling the evidence needed for a fire-safety review. A reviewer is the recipient of the passport, not a second workflow to build.

**Decision:** “What evidence supports transporting and using this item in these conditions, and what still needs verification?”

The cargo item is the unit of work. Materials and components are its manifest. Individual experiments are the evidence. The passport is the takeaway. The boundary explorer makes changes in evidence applicability visible; it does not identify a boundary between safe and unsafe.

Use a simple first layer that a nontechnical visitor understands, with source details one click deeper. The dashboard must summarize, rank and interpret PSI research with SI assistance; a document registry alone does not meet the challenge.

## 2. The complete user journey

1. Open a prepared cargo item and inspect its identity, configuration and component manifest.
2. Choose transit or lunar habitat and a use state: stowed or operating. See sourced reference conditions and explicit assumptions.
3. Select a component. Its material identity, experimental evidence and unanswered questions appear.
4. Change oxygen, pressure or airflow. The selected scenario moves on the evidence map; measured points remain fixed. Condition comparisons and relevance rankings update together.
5. Read the SI explanation: relevant findings, what differs, and what cannot be inferred. Open the source record, supporting excerpt or DOI.
6. Return to the cargo summary: component findings, unknown composition, assembly-level gaps and the next validation question. Public requirements and mitigation references are separate from experimental findings.
7. Download a passport for the current cargo configuration, destination, use state and conditions, including evidence, sources and limitations.

**Example:** an illustrative portable science instrument with an acrylic enclosure, fabric restraint, wiring insulation and an enclosed battery. These components are a demonstration manifest, not a claim about actual flight hardware. Match exact formulations and geometry where known; generic material names do not establish equivalence. Choose the final demo configuration after checking source coverage. The battery may remain an explicit evidence gap; do not delay the primary PSI path to integrate battery data.

## 3. Required product scope

| Area | Build for the submission | Boundary |
|---|---|---|
| Cargo | One prepared multi-component item; inspect and edit its manifest and use state | No upload parser, manufacturer lookup or general inventory platform |
| Manifest | Component name, exact material/model where known, configuration, geometry/exposure notes, ignition-source notes and provenance | Missing identity stays unknown; do not silently match generic labels to exact specimens |
| Materials | Browse/filter/sort all tested solid materials represented in the selected local sources; show processing completeness | Detailed evidence need not be complete for every material; unprocessed records are explicit |
| Destinations | Transit spacecraft and lunar habitat, retaining the selected cargo | Mars, launch and external-surface fire scenarios deferred |
| Environment | Editable oxygen, pressure and airflow; gravity follows destination; reset to reference preset | A preset is a scenario, not an actual vehicle specification |
| Evidence | Rank relevant experimental records and explain differences; separate analogous fuel configurations | No material ranking by presumed safety, cargo risk percentage or readiness score |
| SI | Source-grounded cargo/component briefing using computed comparisons and curated findings | No invented outcomes, requirements, emergency instructions or physics |
| Requirements | A small curated set of potentially relevant public references with revision/date and applicability notes | No automated compliance determination or approval |
| Mitigation | A compact source-linked research/guidance section and explicit unresolved hazards | No generated vehicle-specific checklist |
| Takeaway | Download the selected cargo passport | JSON first, using the mock’s existing native download; no PDF dependency required |

A use-state change updates the scenario context and which documented configuration is being assessed. Do not invent numerical effects of “operating” versus “stowed.” Show missing heat-generation, battery or enclosure information as gaps. Charging is deferred unless supported for the chosen item.

## 4. Main screen

| Part | Content and interaction |
|---|---|
| Cargo passport | Item/configuration identity, manifest, selected component, evidence/gap summary and download |
| Destination and conditions | Transit/lunar presets, stowed/operating state, oxygen, pressure and airflow controls with units and provenance |
| Evidence explorer | Discrete experimental points for the selected component, current scenario marker, ranked records, cited interpretation and expandable sources |

Below the primary experience, show assembly gaps, requirements and mitigation references. Keep the first screen focused on the cargo, destination and a useful finding. Never present component counts as a safety score.

### Evidence-map contract

- Plot measurements only at their recorded coordinates. Label the axes and units; oxygen × pressure is an appropriate initial projection.
- Distinguish the user’s scenario marker from observations. Identify the selected component.
- Records with missing coordinates appear separately or in an explicit omitted-record count. Missing does not mean zero.
- State that gravity, airflow, material configuration and other unplotted variables still affect applicability.
- Do not draw a continuous tested region or interpolate a safety boundary from scattered observations.
- A supported model estimate may later be a separately labelled overlay. The core experience works without it.

## 5. Data: what is available and what we will use

| Source | Role in this build | Availability / required action |
|---|---|---|
| Local PSI metadata: 24 investigations and linked publication metadata | Investigation discovery, objectives, summaries and DOI citations | Already in `data/`; publication links are not full-text evidence |
| Local PSI experimental CSVs: 22 heterogeneous files | Conditions and any explicitly recorded outcomes | Normalize BASS/BASS-II/Saffire first, plus relevant ACME BRE analogues; verify row semantics and units |
| BASS/BASS-II/Saffire papers and NASA combustion guide | Curated, condition-specific findings for solids | Inspect accessible originals; retain supporting excerpt and precise locator; do not fabricate missing table outcomes |
| ACME BRE | High-oxygen analogue where scientifically relevant | Gas burner emulating solids; never substitute it for a material-specific or assembly test |
| Public ISS payload guidance, NASA-STD-6001 and SSP 51721 | Review context and material/assembly requirement references | Catalogue identifies references; check exact passages, revisions and scope before displaying. ISS scope is not lunar approval |
| NASA Fire Protection Technical Brief OCHMO-TB-008 | Compact mitigation and post-fire hazard context | Check cited passage/date; guidance does not replace programme requirements or operational procedures |
| Public material studies, including elevated-oxygen webbing research | Supplementary evidence when identity and conditions match | Optional after PSI path works; do not describe a link as an integrated dataset |
| MAPTIS | Potential exact-material evidence | Restricted access/reuse unresolved; not a build dependency and no fabricated integration |
| Battery studies and failure databank | Optional exact-component/assembly evidence | Ground induced-failure consequences, not mission failure likelihood; raw records not yet validated locally |
| ZARM/drop-tower and other freefall reports | Possible later ground-to-space comparison | No verified matched ground/space runs yet; outside the core delivery |
| FLEX/SAME and suppression research | Discoverable metadata; deeper suppression/detection evidence if time remains | Droplet and smoke results must retain their scope; no direct transfer to arbitrary cargo fires |

**Before UI integration:** choose one source-supported material configuration, verify three useful findings, and check the prospective cargo manifest. Other components can expose honest evidence gaps. Do not claim the entire cargo has been experimentally assessed.

No bulk download of the approximately 8 TB raw PSI archive. No authenticated-source access or new datasets required to complete the core path.

## 6. Minimal data model and scientific ownership

Use source files and small curated JSON records. Keep identities and evidence separate so changing one cargo configuration cannot silently reuse conclusions from another.

| Record | Minimum content |
|---|---|
| Cargo configuration | Stable ID/version, item name, illustrative/real provenance, component list, assembly notes and supported use states |
| Component | ID, material/model/formulation, geometry/exposure, ignition-source notes, original label and identity confidence/unknowns |
| Scenario | Destination, use state, oxygen, pressure, airflow, gravity, sourced presets versus assumptions/user edits |
| Experimental record | Investigation DOI, source file/row, material/fuel/configuration, conditions, duration and outcome only where available |
| Curated finding | Claim, supporting excerpt, exact locator, applicable conditions, investigation/component links and limits |
| Requirement/guidance reference | Source, date/revision, cited passage, scope, relevance explanation and unresolved applicability |
| Passport export | Snapshot of configuration, manifest, scenario, relevant records/findings, comparison method, gaps, references, date and SI disclosure |

Normalize pressure to kPa, airflow to m/s and dimensions to metres internally; retain raw units/values and convert explicitly for display where helpful. Oxygen is volume fraction internally, displayed as percent. Gravity is labelled as a regime and value where appropriate. Preserve ranges and ambiguous cells; do not force summary rows into individual tests. Do not merge formulations or sample geometries merely because names resemble each other.

**Assembly invariant:** relevant evidence for every component still does not establish assembly performance. Show enclosure, interaction, containment and propagation evidence separately; absent assembly tests remain an assembly-level gap. The app never assigns flight acceptance. An actual authority’s decision can only be represented as an attributed source record.

## 7. Ranking and SI behavior

First distinguish exact identity/configuration evidence, related material evidence and different-fuel analogues. Within a relevant class, use a transparent deterministic comparison of oxygen, pressure, airflow, gravity and recorded geometry. Disclose tolerances, known comparisons and unknowns; unknowns must not be described as matches or mismatches. Any illustrative matching score is a navigation aid, not physical confidence or a safety rating. Use the same comparison results in the map details, briefing and export.

The SI explains computed differences and approved findings, summarizes investigations and highlights unanswered questions. Supply the selected cargo/component/scenario, structured comparisons, source excerpts and stable source IDs. Require claims to reference those IDs; reject nonexistent references. A real citation alone does not prove support: review the demo explanations against the excerpts and test out-of-scope requests.

If SI is unavailable, show the computed comparisons and curated source text with an explicit unavailable state. The submitted demo must demonstrate real grounded SI interpretation; a fixed mock explanation is not evidence of an integrated SI feature. Do not expose any SI API credentials in browser code; use a minimal server endpoint if needed by the selected provider. Choose the team’s existing deployment/runtime rather than adding a framework for this feature.

## 8. Preliminary assessment policy

Retain the team’s proposal to combine Earth and microgravity evidence for preliminary reasoning, but distinguish:

1. **Measured observation:** recorded result and conditions.
2. **Model-based estimate:** identified scientific model, inputs, assumptions, validation domain and justified uncertainty/sensitivity.
3. **Qualitative hypothesis:** sourced reasoning and proposed test, without invented numerical predictions.

Label assessments **“Preliminary assessment — unvalidated for selected conditions.”** Combining 0g and 1g measurements does not automatically bound lunar behavior. Short-duration freefall observations do not prove sustained orbital burning. Changes in configuration and atmosphere must be accounted for.

Quantitative projection is optional and deferred unless a suitable relationship, comparable inputs and implementation checks can be established. With no defensible model, deliver a qualitative assessment or state that no assessment is supported. Never convert it into permission to use the cargo.

## 9. Implementation order and owners

Use these five responsibilities as assignable workstreams; the team supplies names. Begin with a short agreement on the demo cargo and source-backed component.

| Order | Owner | Deliverable / handoff |
|---|---|---|
| 1, parallel | Science/source owner | Three verified component findings, exact excerpts/locators, one requirements reference and one mitigation reference; approve demo claims |
| 1, parallel | Data owner | Cargo manifest and normalized solid-material records, source mapping, explicit unknowns and inventory; shared JSON shape with UI/SI owners |
| 2 | UI owner | Extend the existing passport mock into cargo → manifest → component → environment → evidence; responsive layout and accessible controls |
| 2 | Evidence/SI owner | Shared comparison logic, SI endpoint and source grounding, unavailable/error states and passport snapshot/export |
| 3 | Story/integration owner | Deploy an early vertical slice, integrate real data, run acceptance checks, prepare both pitches and submission/disclosures |
| 4, all | Integration | Test complete path, correct unsupported claims, freeze features and record the demo |

Keep the current vanilla HTML/CSS/JS unless integration needs justify more. Reuse `prototype/dashboard-mock.html` as the interaction starting point; replace dummy data before presenting scientific results. Do not rebuild the interface in another stack merely to package the concept.

**First working slice:** one cargo, multiple manifest components, one component with verified PSI evidence, both destinations, condition controls, one grounded SI explanation and a downloadable current-state passport. Expand data coverage after this works.

**Schedule:** deploy the slice as early as possible; feature freeze Sunday 15 November at 12:00 Vienna, polish/record afterward, submit by 21:00 with buffer before the 23:59 deadline. If time slips, cut optional data integrations and model overlays first; preserve evidence integrity, SI interpretation, export and the complete journey.

## 10. Acceptance checklist

- [ ] Cargo contains multiple distinct components; unknown composition and illustrative configuration are explicit.
- [ ] Selecting a component shows its own evidence; changing the manifest invalidates/recomputes affected comparisons and summaries.
- [ ] Transit/lunar switching preserves cargo and component selection, resets sourced presets explicitly and updates gravity and comparisons together.
- [ ] Oxygen, pressure and airflow edits update the scenario and evidence comparisons; experimental points do not move.
- [ ] All tested-solid-material inventory entries from selected local sources are discoverable; processing completeness is visible.
- [ ] Sources and raw/normalized values are traceable; unknowns remain unknown and summary rows are distinguished from tests.
- [ ] Three demo findings have verified support and applicability limits; no invented BASS table outcomes.
- [ ] A working SI feature explains the selected evidence with valid source references; absent sources, provider failure and out-of-scope prediction requests have honest fallbacks.
- [ ] Cargo summary distinguishes component evidence, assembly gaps and requirement/guidance references; no automatic approval, safety score or emergency checklist.
- [ ] Download matches the current manifest, use state and edited conditions, and includes sources, limitations and disclosure. Reopen and inspect the artifact.
- [ ] Keyboard operation, focus visibility, readable mobile layout, empty states and runtime errors are checked in the browser.
- [ ] Public deployed demo opens without login; secrets remain server-side; submission lists sources and uses PSI DOIs.

Leave a small runnable regression check for comparison logic and export consistency, particularly missing values, unit conversion and scenario/configuration changes. Verify one SI answer manually against every supporting excerpt rather than relying solely on reference-ID checks.

## 11. Presentation and submission

**30-second global demo:**

| Time | Action / narration |
|---|---|
| 0–4 s | Show the cargo: “This instrument is going to the Moon. Does its evidence travel with it?” Team/product identification on screen. |
| 4–11 s | Open the manifest and select one component; reveal one verified NASA finding. |
| 11–21 s | Switch transit → lunar habitat and change cabin conditions. Scenario moves, observations stay fixed; show a meaningful difference and missing evidence. |
| 21–26 s | Return to the cargo summary: component evidence is distinct from the untested assembly. Show the next validation question. |
| 26–30 s | Download the passport: “Know what supports your cargo—and what still needs testing.” |

**Approximately two-minute local pitch:** use the same journey, with brief context about multi-material cargo moving between environments, the value of traceable evidence, the actual NASA finding and the next validation question. Choose one or two presenters. Keep technical methodology ready for questions; do not turn the pitch into a source catalogue.

Disclose SI assistance accurately, including concept framing, research organization, code and generated interpretations. The research brief quotes a competition restriction on SI-originated solution ideas: retain team-origin records and resolve compliance in the submission; do not imply all framing was unaided. List external resources, use English, avoid NASA branding in generated content and watermark SI-generated imagery/video if used. Keep the global video at 30 seconds or less; confirm current submission instructions before final upload.

## 12. Explicit non-goals and outstanding evidence

No live hazard monitoring, accident probability, cargo certification, numerical lithium allowance, unrestricted material prediction, Mars, rocket/launch modeling, general cargo-import platform or comprehensive requirements engine. No assumption of current vehicle-specific emergency procedures from historical guidance.

The remaining scientific work is concrete: verify the demo material/configuration and findings; locate assembly evidence or disclose its absence; confirm revisions/scope of displayed requirements; verify exact coverage counts after normalization. Restricted MAPTIS access, matching ground/space runs and battery microgravity transfer are not prerequisites for this delivery.

**Done means:** a visitor can open a multi-material cargo item, understand one supported finding, experience how changing the environment changes the evidence, identify an assembly-level gap and leave with a source-linked passport—in a working public dashboard with real SI interpretation.
