# Brainstorm: topics and options (14 Nov)

**Sources:** the six files in this folder, plus three raw recordings. Recording 1 is saved as `Raw - Traveler Rules and the 24 Cases.md`; recordings 2 and 3 are already covered by `Optimizing Power for Space Facilities.md`.

**What this document is:** the team's own ideas, grouped by topic and checked against the PSI data and the challenge rules. No new ideas were added. The data checks in section 3 and the "data fit" column in section 4 were done with SI assistance, so mention that in the submission's SI disclosure. The concept decision stays with the team.

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

- **Outside on the Moon nothing burns** (there's no oxygen). Fire risk is inside pressurized volumes: habitat, pressurized rover, suit. *(Lunar Activity Risk)*
- **Debris and micrometeoroid hits are negligible** for this scope. *(Lunar Stations)*
- **"Variables change, processes stay"** came up independently in T3, T7 and T9. It's the thread that recurs most often across the recordings.
- **The dashboard should inform rather than question the user.** *(Lunar Activity Risk)*
- Proposed scope: lunar stations and modules, Gateway, Mars bases. *(Lunar Stations)*

## 3. Facts that affect the choice

These come from the data in `data/` and from the challenge text. They're facts, not recommendations.

1. **PSI is microgravity data.** Saffire-II also has some 1g comparisons. Gateway and transit vehicles are microgravity, so PSI applies to them directly. The Moon (1/6 g) and Mars (3/8 g) have **no combustion data in PSI**. The challenge says 0g and 1g results can only *bound* what happens in between.
2. **Atmosphere.** Planned lunar habitats run at ≥30% O₂ and ≤0.69 atm. PSI's tests on solid materials only go up to about 22% O₂ (see `docs/o2-coverage.svg`).
3. **The 24 are lab experiments, not accidents.** Nothing in PSI "happened" the way Apollo 1 or the Mir fire did. Incident records (lessons learned) live in other NASA sources, which deep-research lane B is checking.
4. **PSI has no battery, electrical-fault or nuclear fire data.** Its tests use controlled igniters (Saffire records igniter power). Battery and nuclear angles would need data from outside PSI.
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
| C3 Activity × lunar-time risk prediction | T5 | Weak | Activity and sensor data, lunar thermal data; the team found nothing burns outside | Predictions without data behind them (Validity) |
| C4 Sensor map and outside-change monitoring | T6 | Weak | No sensor feeds; would be simulated | NASA data becomes an add-on (Relevance) |
| C5 Suppression and extinguisher explorer | T8 | Strong for suppression (FLEX), partial for detection (SAME) | — | Narrower story; needs a strong hook (Impact) |
| C6 Transfer to Earth power plants | T7 | Weak for PSI | Battery and electrical fire data | Off the challenge's core; better as a secondary angle |
| C7 Material × environment × source matrix | T2 | Partial: materials and environments are in the tables; ignition sources aren't (fact 4) | Battery and electrical sources | Works as navigation or structure more than as a core |

Recording 1 already joins two of these. One speaker suggested picking a role and route ("I am a traveler going from Earth to Moon… press button") and then seeing "what in those twenty-four cases… I must read, what I must pay attention to." That is T3 as the path and T4 as the content.

### Decision D: Earth angle (optional per challenge)

Extinguishers (T8; the challenge names the water-mist spin-off), power plants (T7), Antarctic and research bases (T9), building-code-style rules per environment (T9).

### Decision E: Presentation story

Travelers Earth → Moon → Mars, Ad Astra style (T3); a screen on a Mars-base wall (T10).

## 5. Parking lot (raised, but conflicts with scope, data or the team's own conclusion)

- Launch-phase fires: rockets are out of scope.
- Nuclear as an ignition source: no data, and the team itself was unsure ("it doesn't quite…").
- External ignition on the lunar surface: no oxygen outside (the team's conclusion).
- Debris and micrometeoroid impacts: negligible (the team's conclusion).
- Door and escape rules for future colonies: one speaker called it "maybe a next step".

## 6. How to decide (about 45 minutes)

1. **5 min:** Everyone reads sections 3 and 4.
2. **10 min:** Decision A. Vote on environments, keeping facts 1 and 2 in mind.
3. **15 min:** Decision C. Each person scores C1–C7 from 1 to 5 on Impact, Creativity, Validity, Relevance, Presentation and Feasibility (see the workshop in the research brief). Discuss only rows where the scores are far apart.
4. **5 min:** Decision B follows from C. Write one sentence: "[user] opens it when [moment] and leaves knowing [insight]."
5. **5 min:** Decisions D and E. Pick one Earth angle and one story frame.
6. **5 min:** Write the 6-line demo script. Start deep-research lane D with the concept sentence, and assign owners.
