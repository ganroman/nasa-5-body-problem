# Brainstorm: topics and options (14 Nov)

**Sources:** the six files in this folder, plus three raw recordings. Recording 1 is saved as `Raw - Traveler Rules and the 24 Cases.md`; recordings 2 and 3 are already covered by `Optimizing Power for Space Facilities.md`.

**What this document is:** the team's own ideas, grouped by topic and checked against the PSI data and the challenge rules. The original topics remain attributed to the team. The follow-up chat added the battery research and proposed scope extension in section 7; these are suggestions for the team to decide on, not an agreed concept. The data checks in section 3 and the "data fit" column in section 4 were done with SI assistance, so mention that in the submission's SI disclosure. Section 7 also uses SI-assisted web research. The concept decision stays with the team.

---

## 1. Topics raised

| # | Topic | What the team said | Source |
|---|---|---|---|
| T1 | **Environments in scope** | Lunar crewed stations and modules; Lunar Gateway (orbiting station for Artemis); possible Mars bases. Also named: travel between planets, launch, astronaut exiting the spacecraft, rovers, lunar poles. | Lunar Stations; Exploring Lunar Poles; Materials; Rec 1 |
| T2 | **Three dimensions** | Material × environment × flame source (battery, electrical system, combustion; "probably more"). Nuclear was proposed as another source. | Materials; Optimizing Power |
| T3 | **Traveler path by role** | Travelers who learned fire rules for spacecraft, then the Moon, then arrive on Mars, where the rules differ. Pick a role (a biologist stays in the base, a technician drives the rover) and a route (Earth → Moon → Mars). Make it a user story or path, not a game. Story idea: Ad Astra (go to the Moon to reach Mars). | Rec 1 |
| T4 | **The 24 cases** | Show which of the 24 PSI investigations are similar to a situation: what happened, what went right or wrong, "lessons learned". Select a scenario, for example for crew training. Turn raw data into clear probabilities, like a past winner did. | Rec 1, Rec 2 |
| T5 | **Activity risk prediction** | Prediction per activity (picking up a rock, starting the rover) and per time of the lunar day, using suit and rover sensors, with and without "our tech". "The dashboard is to inform, not to ask questions." | Lunar Activity Risk |
| T6 | **Hazard monitoring map** | Map where batteries and cables are on the spacecraft and what to check. Changes outside (lunar day heating, Martian dust) affect conditions inside. Assess safety before changing something. | Spacecraft External Hazard |
| T7 | **Power and the Earth link** | Earth power plants share the variables (batteries, pressure, humidity, cable wear); "same variables, different values". Power shortfalls at lunar poles and on Mars; batteries are heavy; nuclear (RTG rovers). | Optimizing Power; Rec 1, Rec 3 |
| T8 | **Extinguishers** | Microgravity flammability tests help design better extinguishers, which helps on Earth too; the ISS uses a different extinguisher. | Optimizing Power; Rec 1, Rec 3 |
| T9 | **Rules and protocols** | Fire rules differ by environment, like earthquake building codes (UK vs California) or doors that must stay open. You can't escape to the street, so protocols have to be built per environment. "Variables change, processes stay." Antarctica and research bases as Earth analogues. | Rec 1 |
| T10 | **Presentation form** | A screen hanging on a Mars-base wall that shows fire safety. Recency and originality matter to judges. | Rec 1 |

## 2. What the team already concluded

- **The team treated external lunar fire as out of scope** because there is no ambient oxygen, focusing on pressurized habitats, rovers and suits. *(Lunar Activity Risk)* This is a recorded scope assumption, not proof that batteries cannot undergo internal thermal runaway outside a habitat; that hazard needs separate evidence (section 7).
- **Debris and micrometeoroid hits are negligible** for this scope. *(Lunar Stations)*
- **"Variables change, processes stay"** came up independently in T3, T7 and T9. It's the thread that recurs most often across the recordings.
- **The dashboard should inform rather than question the user.** *(Lunar Activity Risk)*
- Proposed scope: lunar stations and modules, Gateway, Mars bases. *(Lunar Stations)*

## 3. Facts that affect the choice

These come from the data in `data/` and from the challenge text, with the battery evidence qualification added from the follow-up chat. They're facts, not recommendations.

1. **PSI is microgravity data.** Saffire-II also has some 1g comparisons. Gateway and transit vehicles are microgravity, so PSI applies to them directly. The Moon (1/6 g) and Mars (3/8 g) have **no combustion data in PSI**. The challenge says 0g and 1g results can only *bound* what happens in between.
2. **Atmosphere.** Planned lunar habitats run at ≥30% O₂ and ≤0.69 atm. PSI's tests on solid materials only go up to about 22% O₂ (see `docs/o2-coverage.svg`).
3. **The 24 are lab experiments, not accidents.** Nothing in PSI "happened" the way Apollo 1 or the Mir fire did. Incident records (lessons learned) live in other NASA sources, which deep-research lane B is checking.
4. **The PSI datasets selected for this project do not establish battery thermal-runaway behaviour.** Their controlled igniters (including recorded Saffire igniter power) do not establish realistic battery or electrical-fault behaviour. This is a statement about the selected data, not an exhaustive finding about the entire PSI catalogue. NASA battery experiments and the Battery Failure Databank provide complementary evidence (section 7); electrical-fault and nuclear sources still need separate investigation.
5. **Launch is out of scope.** The challenge excludes rocket and propellant fire safety.
6. **Detection:** SAME and SAME-R measured smoke particles from burning spacecraft materials. There are no live spacecraft sensor feeds in PSI.
7. **Suppression:** FLEX has 274 droplet tests diluted with CO₂ and He, and FLEX-2 has more. The challenge itself names the ISS water-mist extinguisher as an Earth spin-off.
8. **Lunar surface temperature** is NASA data, but it's outside PSI (orbiter instruments). Deep research would need to confirm access.
9. **Gateway's program status:** verify it's current before making Gateway the headline.

## 4. Options to choose from

### Decision A: Environments (pick 1–3)

| Option | Data fit (fact 1 and 2) |
|---|---|
| Gateway / transit vehicle | Direct: microgravity, near-air atmospheres |
| Lunar surface habitat or pressurized rover | Indirect: bounded by 0g and 1g; higher O₂ than solids data covers |
| Mars base | Indirect: bounded only; no Mars-specific atmosphere in the challenge text |
| Earth analogue (Antarctic base, power plant) | Not in PSI; fits the optional "Earth benefit" angle |

### Decision B: Primary user

The candidates the team named: the **traveler or crew member, by role** (T3); the **trainer** choosing scenarios (T4); the **crew monitoring** the vehicle (T6); and the **engineer or designer** (T2, T8, implied by "help design extinguishers").

### Decision C: Core of the app

| Option | From | Data fit | What's missing | Main judging risk |
|---|---|---|---|---|
| C1 Traveler path by role and environment | T3, T9 | Partial | Moon and Mars gravity data; environment-specific protocols | Becomes general training content unless it's tied to test data (Validity, Relevance) |
| C2 Find similar cases among the 24 (match conditions, show outcomes) | T4 | Strong: the test tables hold conditions and outcomes | Incident "lessons learned" aren't in PSI (fact 3); ~2,000 rows limit any "probability" | Must clearly beat PSI's own search (Creativity) |
| C3 Activity × lunar-time risk prediction | T5 | Weak | Activity and sensor data, lunar thermal data; external battery failure is not resolved by the absence of ambient oxygen | Predictions without data behind them (Validity) |
| C4 Sensor map and outside-change monitoring | T6 | Weak | No sensor feeds; would be simulated | NASA data becomes an add-on (Relevance) |
| C5 Suppression and extinguisher explorer | T8 | Strong for suppression (FLEX), partial for detection (SAME) | — | Narrower story; needs a strong hook (Impact) |
| C6 Transfer to Earth power plants | T7 | Weak for PSI | Battery and electrical fire data | Off the challenge's core; better as a secondary angle |
| C7 Material × environment × source matrix | T2 | Partial: selected PSI tables describe materials and environments; battery studies can complement them (fact 4, section 7) | Validated links between source heat release and surrounding-material ignition; electrical-fault evidence | Works as navigation or structure more than as a core |
| C8 Battery-failure consequence explorer (proposed in follow-up chat) | T2, T6, T7 + section 7 | Strong for measured ground-test consequences; incomplete for microgravity transfer | Exact flight-cell matching, environmental applicability, validated coupling to PSI material tests | Must not imply mission failure probabilities or validated ignition predictions |

Recording 1 already joins two of these. One speaker suggested picking a role and route ("I am a traveler going from Earth to Moon… press button") and then seeing "what in those twenty-four cases… I must read, what I must pay attention to." That is T3 as the path and T4 as the content.

### Decision D: Earth angle (optional per challenge)

Extinguishers (T8; the challenge names the water-mist spin-off), power plants (T7), Antarctic and research bases (T9), building-code-style rules per environment (T9).

### Decision E: Presentation story

Travelers Earth → Moon → Mars, Ad Astra style (T3); a screen on a Mars-base wall (T10).

## 5. Parking lot (raised, but conflicts with scope, data or the team's own conclusion)

- Launch-phase fires: rockets are out of scope.
- Nuclear as an ignition source: no data, and the team itself was unsure ("it doesn't quite…").
- External lunar combustion: outside the current proposed scope. Do not use the absence of ambient oxygen to dismiss internal battery thermal runaway; its external-environment consequences remain unassessed here.
- Debris and micrometeoroid impacts: negligible (the team's conclusion).
- Door and escape rules for future colonies: one speaker called it "maybe a next step".

## 6. How to decide (about 45 minutes)

1. **5 min:** Everyone reads sections 3 and 4.
2. **10 min:** Decision A. Vote on environments, keeping facts 1 and 2 in mind.
3. **15 min:** Decision C. Each person scores C1–C8 from 1 to 5 on Impact, Creativity, Validity, Relevance, Presentation and Feasibility (see the workshop in the research brief). Discuss only rows where the scores are far apart.
4. **5 min:** Decision B follows from C. Write one sentence: "[user] opens it when [moment] and leaves knowing [insight]."
5. **5 min:** Decisions D and E. Pick one Earth angle and one story frame.
6. **5 min:** Write the 6-line demo script. Start deep-research lane D with the concept sentence, and assign owners.


## 7. Follow-up suggestion: battery failure as an ignition source

**Status:** proposed scope extension from the follow-up chat on 14 Nov, supported by web research. The team has not yet selected it. The distinction is between materials that can burn and a failing battery that can release heat and hot material capable of exposing nearby materials to an ignition source.

### Evidence found

| Source | What was observed in the published source | Use and limits |
|---|---|---|
| [Battery Failure Databank](https://nrel.sitefinity.cloud/transportation/battery-failure) | Hundreds of lithium-ion abuse tests in 18650, 21700 and D-cell formats. Downloadable spreadsheet records heat output, heat through the casing versus ejected contents, mass loss, trigger method and time to runaway; many tests link to X-ray videos. | Best candidate for reusable experimental data alongside PSI. Formats alone do not establish flight use: match the exact cell model. The data download and individual records have not yet been validated for this project. |
| [NASA GS Yuasa LSE-134 calorimetry study](https://www.nasa.gov/wp-content/uploads/2024/01/characterization-of-the-gs-yuasa-134-cell-thermal-runaway-events-with-large-format-fractional-thermal-runaway-calorimetry.pdf?emrc=6993d3513fc69) | Reports tests on 13 cells of the 134 Ah model used by the ISS, with nail-induced thermal runaway and large-format calorimetry. | Direct connection to ISS main-power hardware. Public presentation identified; availability of reusable raw measurements remains to be checked. |
| [ISS Main Battery Thermal Runaway Propagation Test](https://ntrs.nasa.gov/citations/20180000927) | NASA investigated propagation in ISS lithium-ion main batteries, including ground testing of a battery assembly. | Evidence for propagation and containment at assembly scale; do not assume isolated-cell results describe an entire battery pack. |
| [ICES-2025-426: heat release, aerosol and gas products](https://ntrs.nasa.gov/api/citations/20250005133/downloads/ICES_Fina_426.pdf) | Initial tests on two 2,500 mAh cell types measured heat release, gases and aerosols in a ventilated enclosure. The paper connects the work to spacecraft cabin hazards and Saffire research. | Relevant to devices inside crewed habitats. Complete laptop and battery-pack experiments were future work in this paper, not reported results. |

These are ground-test sources, not evidence of battery fires measured in orbital microgravity. The search did not establish a PSI-equivalent orbital battery-fire dataset. This is a remaining evidence gap, not proof that no such experiments exist.

### Proposed app scope wording

> The app explores fire hazards from combustible materials and lithium-ion battery failures in spacecraft and habitats. Selected PSI experiments inform material combustion behaviour, while NASA battery studies provide complementary evidence on thermal runaway, heat release and propagation. Combined scenarios are exploratory estimates, with the applicable battery models and environmental conditions shown explicitly.

### First-version option and evidence rules

- Start with a **battery-failure consequence scenario**: select a tested cell model and inspect its measured heat-release range, ejected material and available test records. Only report ranges actually supported by comparable records.
- Keep three questions separate: what a failing battery releases; how surrounding materials respond; and how likely the battery is to fail during a mission. Induced-failure tests principally support the first question, not a mission failure probability.
- Link to relevant PSI material experiments as complementary evidence. Do not claim a material will ignite simply because a battery heat total and a material test are both available. Exposure geometry, heat transfer, duration, atmosphere and gravity must be accounted for and the connection validated.
- Show the exact cell model, trigger method, test environment and source. Preserve state of charge and other conditions where available; missing conditions stay unknown. Do not combine different test methods into a single risk score without justification.
- Keep battery internal thermal runaway separate from combustion of vented products or surrounding materials. Absence of ambient oxygen is not a sufficient rule for excluding internal battery failure.

**Illustrative user story, not test evidence:** a habitat designer selects a tested battery model, sees the measured consequences of induced failure, then explores related material-combustion experiments. The app explains where the conditions differ and where the proposed connection remains unvalidated.

**Next decision:** include C8 as a secondary scenario supporting C7 or C2, or defer it to keep the first version centred on PSI. Before implementation, inspect the downloadable data, verify exact cell applicability, and confirm how complementary sources fit the challenge requirements.
