# Cargo Passport — final build plan

**Team Five-Body Problem · 14 November 2026**

This is the consolidated implementation plan. It supersedes the product scope in the earlier [concept draft](concept-draft.md) and [cargo proposal](cargo-passport.md), while retaining them as discussion history. It incorporates the team’s latest cargo direction, passport + boundary interaction, [source catalogue](../data/data-sources-catalog.md), and [cargo journeys and environment references](environments/cargo-journes.md). This document specifies work to build; it does not claim these capabilities or scientific validations already exist.

## 1. What we are building

> **A cargo passport that connects an item’s contents and components to hazard evidence—and shows how its applicability changes with the environment, configuration and use. Fire safety is the first detailed assessment for this challenge.**

**Hook:** “This cargo is going to the Moon. Does its evidence travel with it?”

**Primary user:** a payload designer assembling evidence for transporting and using a cargo item. The passport records relevant hazards—including fire, toxicity and biological hazards—with supporting evidence, applicability limits and unresolved questions. A reviewer can inspect the same evidence without requiring a separate workflow.

**Decision:** “What evidence supports transporting and using this item in these conditions, and what still needs verification?”

The cargo item is the unit of work. Materials and components are its manifest. Experiments, material and component studies, and attributed requirements or guidance provide distinct kinds of evidence and review context. The passport is the takeaway. The boundary explorer makes changes in evidence applicability visible; it does not identify a boundary between safe and unsafe.

Use a simple first layer that a nontechnical visitor understands, with source details one click deeper. The dashboard must use SI assistance to summarize and interpret relevant evidence from the project’s source catalogue, with PSI combustion research central to the challenge demonstration. Rank experimental evidence by relevance to the selected component, hazard, configuration and environment; present requirements and guidance separately. A document registry alone does not meet the challenge.

## 2. The complete user journey

1. Open a prepared cargo item and inspect its identity, configuration and component manifest.
2. Choose a journey stage and receiving environment from the project’s environment catalogue, including transit, lunar and Martian orbital or surface environments. Select the item’s use state, such as stowed, operating, charging or under maintenance. See sourced conditions, explicit assumptions and unknowns separately.
3. Select a component and hazard. Its identity, relevant evidence and unanswered questions appear. Fire, toxicity and biological hazards each have their own evidence status; an unassessed hazard is not a finding of no hazard.
4. Select a predefined environment or adjust individual conditions, such as oxygen concentration, pressure and airflow. The environment suggests reference values where supported by sources and labels assumptions or unknowns explicitly. Override values for the scenario or reset to the selected environment’s suggestions. The scenario marker, condition comparisons and evidence relevance rankings update together; experimental measurements remain fixed. If coordinates are unknown, show the scenario as incomplete rather than inventing its map position.
5. Read the SI explanation: relevant findings, what differs, and what cannot be inferred. Open the source record, supporting excerpt or DOI.
6. Return to the cargo summary: findings and evidence status for each hazard, unknown composition, assembly-level gaps and the next validation question. Public requirements and mitigation references are separate from experimental findings.
7. Download a passport for the current cargo configuration, destination, use state and conditions, including evidence and gaps for each hazard, sources and limitations.

**Example:** an illustrative portable science instrument with an acrylic enclosure, fabric restraint, wiring insulation and an enclosed battery. These components are a demonstration manifest, not a claim about actual flight hardware. Match exact formulations and geometry where known; generic material names do not establish equivalence. Choose the final demo configuration after checking source coverage. Check the selected battery and assembly against the catalogued battery sources. Integrate applicable, verifiable findings; otherwise record the specific evidence gap and its consequence for the assessment. Missing battery evidence need not block demonstrating another component’s findings, but the incomplete battery assessment must remain visible.

## 3. Required product scope

| Area | Build for the submission | Boundary |
|---|---|---|
| Cargo | One prepared multi-component item; inspect and edit its manifest and use state | No upload parser, manufacturer lookup or general inventory platform |
| Manifest | Component name, exact material/model where known, configuration, geometry/exposure notes, ignition-source notes and provenance | Missing identity stays unknown; do not silently match generic labels to exact specimens |
| Materials | Browse/filter/sort all tested solid materials represented in the selected local sources; show processing completeness | Detailed evidence need not be complete for every material; unprocessed records are explicit |
| Environments and journey stages | Transit, lunar orbit/Gateway, NASA and Chinese lunar-base concepts, Mars transit/orbit and Martian surface; rover and workshop transitions from the cargo-journey references; retain selected cargo | Research scenarios, not verified mission routes or complete vehicle specifications; no rocket/launch or external-surface fire modeling |
| Conditions | Select a predefined environment with suggested conditions or edit oxygen, pressure and airflow; gravity follows the environment; reset to its reference values | Preserve provenance for each value, distinguish assumptions and overrides, and leave unsupported conditions unknown |
| Hazards | Separate fire, toxicity and biological-hazard evidence, applicability and gaps; fire is the first detailed assessment | No inferred absence of a hazard from missing evidence; no claim of comprehensive hazard assessment |
| Evidence | Use relevant catalogued sources, rank comparable experimental records and explain differences; separate analogous fuel configurations | No material ranking by presumed safety, cargo risk percentage or readiness score |
| SI | Source-grounded cargo/component briefing using computed comparisons and curated findings | No invented outcomes, requirements, emergency instructions or physics |
| Requirements | A small curated set of potentially relevant public references with revision/date and applicability notes | No automated compliance determination or approval |
| Mitigation | A compact source-linked research/guidance section and explicit unresolved hazards | No generated vehicle-specific checklist |
| Takeaway | Download the selected cargo passport | JSON first, using the mock’s existing native download; no PDF dependency required |

A use-state change updates the scenario context and which documented configuration is being assessed. Do not invent numerical effects of stowage, operation, charging or maintenance. An intended state can be recorded even when evidence is missing; expose missing battery–charger, heat-generation, enclosure or maintenance information as gaps.

Use the [environment references](environments/cargo-journes.md#sources-and-limits) to distinguish microgravity transit/orbital settings, lunar surface gravity and Martian surface gravity. Rover and workshop transitions may change surroundings or item condition without changing gravity. Do not copy lunar cabin values into Gateway, Mars or another programme’s habitat. The references do not establish complete cabin specifications; unsupported values remain unknown unless explicitly entered as scenario assumptions.

## 4. Main screen

| Part | Content and interaction |
|---|---|
| Cargo passport | Item/configuration identity, manifest, selected component and hazard, evidence/gap summary for each hazard and download |
| Environment and conditions | Catalogue environment selector, journey stage and use state; suggested conditions and manual overrides with units, sources, assumptions, unknowns and reset |
| Evidence explorer | Discrete experimental points for the selected component, current scenario marker, ranked records, cited interpretation and expandable sources |

Below the primary experience, show assembly gaps, requirements and mitigation references. Keep the first screen focused on the cargo, destination and a useful finding. Never present component counts as a safety score.

### Evidence-map contract

- Plot measurements only at their recorded coordinates. Label the axes and units; oxygen × pressure is an appropriate initial projection.
- Distinguish the user’s scenario marker from observations. Identify the selected component and hazard. The initial oxygen × pressure map serves combustion evidence; do not apply that comparison to toxicity or biological hazards without an appropriate method.
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
| Public ISS payload guidance, NASA-STD-6001 and SSP 51721 | Review context and material/assembly requirement references | Catalogue identifies references; check exact passages, revisions and scope before displaying. ISS scope does not establish approval for lunar or Martian environments |
| NASA Fire Protection Technical Brief OCHMO-TB-008 | Compact mitigation and post-fire hazard context | Check cited passage/date; guidance does not replace programme requirements or operational procedures |
| Public material studies, including elevated-oxygen webbing research | Supplementary evidence when identity and conditions match | Inspect when relevant to the selected material and conditions; integrate verified findings, not merely links |
| MAPTIS | Potential exact-material evidence | Restricted access/reuse unresolved; not a build dependency and no fabricated integration |
| Battery studies and failure databank, plus JSC 20793 | Exact-component/assembly findings and separate battery requirements where applicable; review for the chosen battery | Ground induced-failure consequences, not mission failure likelihood; raw records not yet validated locally |
| ZARM/drop-tower and other freefall reports | Relevant ground evidence and potential ground-to-space comparisons | Check configuration and conditions before use; no verified matched ground/space runs yet |
| FLEX/SAME and suppression research | Discoverable metadata; deeper suppression/detection evidence if time remains | Droplet and smoke results must retain their scope; no direct transfer to arbitrary cargo fires |
| NASA Hazardous Material Summary Tables guidance, NASA-STD-6001 and SSP 51721 | Biological-hazard, toxicity and offgassing review context | Verify exact passages and scope; process guidance and requirements are not cargo-specific test results or completed assessments |
| Environment documents and cargo journeys | Named scenarios, gravity regimes, suggested conditions and use transitions | Preserve source dates and concept status; cabin specifications are incomplete and illustrative routes are not confirmed missions |

**Before UI integration:** choose one source-supported material configuration, verify three useful findings, and check the prospective cargo manifest against relevant sources across the catalogue, including battery evidence. Record fire, toxicity and biological-hazard evidence or explicit assessment gaps. Other components can expose honest evidence gaps. Do not claim the entire cargo has been experimentally assessed.

No bulk download of the approximately 8 TB raw PSI archive. No authenticated-source access or new datasets required to complete the core path.

## 6. Minimal data model and scientific ownership

Use source files and small curated JSON records. Keep identities and evidence separate so changing one cargo configuration cannot silently reuse conclusions from another.

| Record | Minimum content |
|---|---|
| Cargo configuration | Stable ID/version, item name, illustrative/real provenance, component list, assembly notes and supported use states |
| Component | ID, material/model/formulation, geometry/exposure, ignition-source notes, original label and identity confidence/unknowns |
| Scenario | Environment ID, journey stage, use state, oxygen, pressure, airflow and gravity; per-value source, assumption/unknown status, suggested value and user override |
| Hazard assessment | Hazard type (fire, toxicity or biological), cargo/component link, evidence status, applicable findings/references, unresolved applicability and gaps; unassessed is distinct from an attributed finding of no applicable hazard |
| Experimental record | Stable source ID, DOI where available, file/row or document locator, hazard, material/component/configuration, conditions, duration and outcome only where available |
| Curated finding | Claim, supporting excerpt, exact locator, applicable conditions, source/component/hazard links and limits |
| Requirement/guidance reference | Source, date/revision, cited passage, scope, relevance explanation and unresolved applicability |
| Passport export | Snapshot of configuration, manifest, scenario, relevant records/findings, comparison method, evidence status and gaps for each hazard, references, condition provenance/overrides, date and SI disclosure |

Normalize pressure to kPa, airflow to m/s and dimensions to metres internally; retain raw units/values and convert explicitly for display where helpful. Oxygen is volume fraction internally, displayed as percent. Gravity is labelled as a regime and value where appropriate. Preserve ranges and ambiguous cells; do not force summary rows into individual tests. Do not merge formulations or sample geometries merely because names resemble each other.

**Assembly invariant:** relevant evidence for every component still does not establish assembly performance. Show enclosure, interaction, containment and propagation evidence separately; absent assembly tests remain an assembly-level gap. The app never assigns flight acceptance. An actual authority’s decision can only be represented as an attributed source record.

## 7. Ranking and SI behavior

Select evidence by the component, hazard, configuration and environment, not by repository alone. Keep requirements and guidance separate from experimental rankings. Fire relevance does not establish toxicity or biological-hazard coverage; show source-grounded findings and gaps for those hazards without applying combustion similarity scores.

For combustion comparisons, first distinguish exact identity/configuration evidence, related material evidence and different-fuel analogues. Within a relevant class, use a transparent deterministic comparison of oxygen, pressure, airflow, gravity and recorded geometry. Disclose tolerances, known comparisons and unknowns; unknowns must not be described as matches or mismatches. Any illustrative matching score is a navigation aid, not physical confidence or a safety rating. Use the same comparison results in the map details, briefing and export.

The SI explains computed differences and approved findings, summarizes investigations and highlights unanswered questions. Supply the selected cargo/component/hazard/scenario, structured comparisons, source excerpts and stable source IDs. Require claims to reference those IDs; reject nonexistent references. A real citation alone does not prove support: review the demo explanations against the excerpts and test out-of-scope requests.

If SI is unavailable, show the computed comparisons and curated source text with an explicit unavailable state. The submitted demo must demonstrate real grounded SI interpretation; a fixed mock explanation is not evidence of an integrated SI feature. Do not expose any SI API credentials in browser code; use a minimal server endpoint if needed by the selected provider. Choose the team’s existing deployment/runtime rather than adding a framework for this feature.

## 8. Preliminary assessment policy

Retain the team’s proposal to combine Earth and microgravity evidence for preliminary reasoning, but distinguish:

1. **Measured observation:** recorded result and conditions.
2. **Model-based estimate:** identified scientific model, inputs, assumptions, validation domain and justified uncertainty/sensitivity.
3. **Qualitative hypothesis:** sourced reasoning and proposed test, without invented numerical predictions.

Label assessments **“Preliminary assessment — unvalidated for selected conditions.”** Combining 0g and 1g measurements does not automatically bound lunar or Martian behavior. Short-duration freefall observations do not prove sustained orbital burning. Changes in configuration and atmosphere must be accounted for.

Quantitative projection is optional and deferred unless a suitable relationship, comparable inputs and implementation checks can be established. With no defensible model, deliver a qualitative assessment or state that no assessment is supported. Never convert it into permission to use the cargo.

## 9. Implementation order and owners

Use these five responsibilities as assignable workstreams; the team supplies names. Begin with a short agreement on the demo cargo and source-backed component.

| Order | Owner | Deliverable / handoff |
|---|---|---|
| 1, parallel | Science/source owner | Three verified component findings, exact excerpts/locators, catalogue review for relevant battery and other hazard sources, one requirements reference and one mitigation reference; approve demo claims |
| 1, parallel | Data owner | Cargo manifest, hazard evidence/gaps, normalized experimental records and environment suggestions with provenance, explicit unknowns and inventory; shared JSON shape with UI/SI owners |
| 2 | UI owner | Extend the existing passport mock into cargo → manifest → component → environment → evidence; responsive layout and accessible controls |
| 2 | Evidence/SI owner | Shared comparison logic, SI endpoint and source grounding, unavailable/error states and passport snapshot/export |
| 3 | Story/integration owner | Deploy an early vertical slice, integrate real data, run acceptance checks, prepare both pitches and submission/disclosures |
| 4, all | Integration | Test complete path, correct unsupported claims, freeze features and record the demo |

Keep the current vanilla HTML/CSS/JS unless integration needs justify more. Reuse `prototype/dashboard-mock.html` as the interaction starting point; replace dummy data before presenting scientific results. Do not rebuild the interface in another stack merely to package the concept.

**First working slice:** one cargo, multiple manifest components, one component with verified PSI evidence, applicable verified findings from other catalogued sources or documented gaps, separate hazard statuses, one demonstrated route using the broader environment selector, suggested conditions and manual overrides, one grounded SI explanation and a downloadable current-state passport. Expand data coverage after this works.

**Schedule:** deploy the slice as early as possible; feature freeze Sunday 15 November at 12:00 Vienna, polish/record afterward, submit by 21:00 with buffer before the 23:59 deadline. If time slips, cut model overlays and bulk data integrations first, retaining review of sources relevant to the selected cargo; preserve evidence integrity, SI interpretation, export and the complete journey.

## 10. Acceptance checklist

- [ ] Cargo contains multiple distinct components; unknown composition and illustrative configuration are explicit.
- [ ] Selecting a component shows its own evidence; changing the manifest invalidates/recomputes affected comparisons and summaries.
- [ ] The environment selector includes the documented lunar and Martian orbital/surface scenarios and journey transitions; switching preserves cargo and component selection, explicitly replaces condition suggestions and updates gravity and comparisons together.
- [ ] Each condition distinguishes a sourced suggestion, assumption, unknown or user override; reset restores the selected environment’s suggestions. Missing cabin values never inherit another environment’s defaults.
- [ ] Both predefined environment selection and manual oxygen, pressure and airflow edits update comparisons and the scenario marker; experimental points do not move. Missing coordinates produce an explicit incomplete scenario state.
- [ ] All tested-solid-material inventory entries from selected local sources are discoverable; processing completeness is visible.
- [ ] Sources and raw/normalized values are traceable; unknowns remain unknown and summary rows are distinguished from tests.
- [ ] Three demo findings have verified support and applicability limits; no invented BASS table outcomes. Relevant non-PSI sources, including sources for the selected battery, were checked; applicable findings or specific gaps are visible.
- [ ] Fire, toxicity and biological hazards have separate evidence statuses; unassessed never means absent, and combustion rankings are not reused as evidence for other hazards.
- [ ] A working SI feature explains the selected evidence with valid source references; absent sources, provider failure and out-of-scope prediction requests have honest fallbacks.
- [ ] Cargo summary distinguishes component evidence, assembly gaps and requirement/guidance references; no automatic approval, safety score or emergency checklist.
- [ ] Download matches the current manifest, selected environment, use state, hazard statuses and suggested/overridden conditions, and includes sources, limitations and disclosure. Reopen and inspect the artifact.
- [ ] Keyboard operation, focus visibility, readable mobile layout, empty states and runtime errors are checked in the browser.
- [ ] Public deployed demo opens without login; secrets remain server-side; submission lists sources and uses PSI DOIs.

Leave a small runnable regression check for comparison logic and export consistency, particularly missing values, unit conversion and scenario/configuration changes. Verify one SI answer manually against every supporting excerpt rather than relying solely on reference-ID checks.

## 11. Presentation and submission

**30-second global demo:** one illustrative lunar route keeps the presentation short; it does not restrict the product’s environment catalogue. Fire is the demonstrated assessment within the broader hazard passport.

| Time | Action / narration |
|---|---|
| 0–4 s | Show the cargo: “This instrument is going to the Moon. Does its evidence travel with it?” Team/product identification on screen. |
| 4–11 s | Open the manifest and select one component; reveal one verified NASA finding. |
| 11–21 s | Select the lunar habitat preset from transit, inspect suggested conditions and override a value. Scenario moves, observations stay fixed; show a meaningful difference and missing evidence. |
| 21–26 s | Return to the cargo summary: component evidence is distinct from the untested assembly and other unassessed hazards. Show the next validation question. |
| 26–30 s | Download the passport: “Know what supports your cargo—and what still needs testing.” |

**Approximately two-minute local pitch:** use the same journey, with brief context about multi-material cargo moving between environments, the value of traceable evidence, the actual NASA finding and the next validation question. Choose one or two presenters. Keep technical methodology ready for questions; do not turn the pitch into a source catalogue.

### Live opening: the passport icebreaker

Allow about 20 seconds within the two-minute pitch. The audience replies below are expected responses, not a requirement to continue; pause briefly and move on if the room is quiet.

**Presenter:** “Who here has a passport?” *Pause for hands or a “yes.”*

**Presenter:** “And when you travel abroad, do you have to show it?” *Pause for responses.*

**Presenter:** “Your cargo needs a passport for space travel, too—one that tells us what’s inside, where it’s been, and what conditions it will face next.”

**Transition:** Show the cargo journey animation. “Follow this instrument from Earth to the Moon. When its surroundings change, we need to check whether the evidence still applies.” Then open its passport and continue with the source-linked NASA finding and the next validation question.

The passport is our product metaphor, not a claim about an existing legal requirement. Rehearse the pauses and animation cue as part of the two-minute total.

Disclose SI assistance accurately, including concept framing, research organization, code and generated interpretations. The research brief quotes a competition restriction on SI-originated solution ideas: retain team-origin records and resolve compliance in the submission; do not imply all framing was unaided. List external resources, use English, avoid NASA branding in generated content and watermark SI-generated imagery/video if used. Keep the global video at 30 seconds or less; confirm current submission instructions before final upload.

## 12. Explicit non-goals and outstanding evidence

No live hazard monitoring, accident probability, cargo certification, numerical lithium allowance, unrestricted material prediction, rocket/launch or external-surface fire modeling, general cargo-import platform or comprehensive requirements engine. No assumption of current vehicle-specific emergency procedures from historical guidance.

The remaining scientific work is concrete: verify the demo material/configuration and findings; locate assembly evidence or disclose its absence; check relevant battery, toxicity and biological-hazard sources and record unsupported assessments; verify environment suggestions and missing conditions; confirm revisions/scope of displayed requirements; verify exact coverage counts after normalization. Restricted MAPTIS access, matching ground/space runs and battery microgravity transfer are not prerequisites for this delivery.

**Done means:** a visitor can open a multi-material cargo item, understand one supported finding, select a predefined environment or edit conditions, understand how applicability changes, distinguish evidence and gaps for each hazard, identify an assembly-level gap and leave with a source-linked passport—in a working public dashboard with real SI interpretation.
