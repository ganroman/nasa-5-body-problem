# Earth use cases for the Cargo Passport

**Team Five-Body Problem · 14 November 2026 · working draft**

The challenge welcomes Earth applications as an optional extra. This document checks three Earth settings proposed by the team (aircraft, power plants, and schools and public buildings) against the PSI data and existing Earth regulations. It supports the [build plan](build-plan.md); it does not change the product scope.

> **Fields marked ✍️ TEAM are for the team to write.** They hold the idea itself: who uses it and what the passport adds. The research fields were filled with SI assistance (see disclosure at the end). Every regulation and incident below still needs a final check against the primary source before it goes into the pitch or submission.

---

## 1. What transfers to Earth: the method or the data

Two different things can transfer, and the pitch must not mix them up.

| | Method transfer | Data transfer |
|---|---|---|
| What moves | The passport approach: item → components → evidence → compare test conditions with real conditions → show gaps | PSI experimental results themselves |
| Where it applies | Almost any setting that moves or installs multi-material items | Only where conditions resemble the tests: low pressure, enclosed spaces, smoke detection, material screening |
| What we can claim | "The same evidence discipline applies here" | "This NASA measurement is relevant here, within these limits" |

Label every Earth use case as **method**, **data**, or **both**.

## 2. What PSI itself says about Earth benefits

Every PSI record has a "Research Impacts/Earth Benefits" field (`data/combustion_investigations_summary.json`). The fire-safety relevant ones:

| Earth setting named by PSI | Investigation | DOI | Fire-safety link |
|---|---|---|---|
| "Submarines or high-altitude aircraft" (confined and reduced-pressure environments) | FLEX (PSI-69) | [10.60555/mbq8-0451](https://doi.org/10.60555/mbq8-0451) | Yes |
| Smoke detection in "submarines or underwater laboratories" | DAFT (PSI-47) | [10.60555/ztgj-d202](https://doi.org/10.60555/ztgj-d202) | Yes |
| Better smoke detectors | SAME (PSI-102), SAME-R (PSI-101), PSI-115 | [gd4k-8h62](https://doi.org/10.60555/gd4k-8h62), [2np7-jv14](https://doi.org/10.60555/2np7-jv14), [q0v5-1v28](https://doi.org/10.60555/q0v5-1v28) | Yes |
| Flame models for wildfires | BASS-II (PSI-25) | [10.60555/4qc4-de67](https://doi.org/10.60555/4qc4-de67) | Yes, indirect |
| Screening new materials' flammability; "performance-based material selection" | PSI-62, BASS (PSI-26) | [e9xp-ex83](https://doi.org/10.60555/e9xp-ex83), [58h4-dy80](https://doi.org/10.60555/58h4-dy80) | Yes |
| "Novel designs of future coal power plants" | ACME Flame Design (PSI-10) | [w4zy-bt45](https://doi.org/10.60555/w4zy-bt45) | **No**: efficiency and emissions, not fire safety |

### What the challenge itself names

The challenge statement lists Earth spin-offs as an optional extra: **fine water-mist extinguishers, smoke detectors and firefighter gear** (see the [research brief](research-brief.md#the-ask)). These are the Earth angles with the strongest backing, because the challenge names them directly:

- **Smoke detectors** connect to SAME, SAME-R and PSI-115 above, and fit Card C (schools and public buildings) and Card A (aircraft cabins and cargo holds).
- **Fine water-mist extinguishers** are the spin-off the challenge names for suppression. FLEX tested suppression by diluting the atmosphere with CO₂ and helium, not with water mist, so treat it as a related line of research, not the source of the spin-off.
- **Firefighter gear** has no direct PSI link in the tables we parsed.

### A point from BASS that applies on Earth

BASS's record also makes a point that applies on Earth: NASA's standard material test (NASA-STD-6001 Test 1) "segregates material based on 1-g behavior without consideration of low gravity effects." In other words, a material's pass/fail result depends on the conditions it was tested in. That is the passport's core idea.

---

## 3. Use-case cards

### Card A: Aircraft

| Field | Content |
|---|---|
| Setting and user | ✍️ TEAM: who opens the passport, and at what moment? |
| The "cargo" | ✍️ TEAM: which item, and what are its components? |
| What changes | Cabin pressure: transport aircraft must keep cabin pressure altitude at or below 8,000 ft in normal operation (14 CFR 25.841(a)), roughly 0.75 atm. The [research brief](research-brief.md) gives planned lunar habitats as ≤0.69 atm. The cabin is enclosed and you cannot evacuate in flight. Cargo holds carry mixed shipments, including lithium batteries. |
| Existing system | **Cabin materials:** 14 CFR 25.853 and Appendix F to Part 25 (burn tests; heat release and smoke tests for some large interior parts). **Cargo batteries:** ICAO dangerous-goods rules. Since 1 April 2016, stand-alone lithium-ion batteries (UN 3480) are banned as cargo on passenger aircraft and must ship at ≤30% state of charge. Later amendments extended the 30% limit to batteries packed with equipment. |
| PSI link | **Data + method.** FLEX names "high-altitude aircraft" as an Earth benefit, and its 274 tests include 103 at about 0.7 atm (quick parse of `PSI-69_Experimental_table_FLEX.csv`). SAME/SAME-R smoke data relates to cabin and cargo smoke detection. Limits: FLEX burns fuel droplets, not cabin materials; the PSI tests are in microgravity, aircraft are in 1g. |
| Real incidents | **Swissair 111 (1998):** electrical arcing ignited the metallized PET cover on insulation blankets. The fire spread across them, and the TSB concluded that "aircraft certification standards for material flammability were inadequate," because they allowed materials that could ignite and sustain a fire. **UPS Flight 6 (2010):** a cargo fire brought down a 747 near Dubai. According to the FAA's summary, the flight carried "more than 80,000 lithium-type batteries"; at least three shipments "should have been declared as hazardous materials," and "no hazardous material had been declared on board." |
| What the passport adds | ✍️ TEAM |
| Limits | Aircraft fire safety is already heavily regulated. The passport would organise and compare evidence; it cannot certify. Do not claim microgravity data predicts 1g aircraft fires. |

**Why this card looks strong:** it is the only Earth setting PSI names directly, the pressure is close to a lunar habitat's, and both incidents are about evidence that did not match real conditions (a material that passed its test, a shipment whose contents were not declared).

### Card B: Power plants and battery energy storage

| Field | Content |
|---|---|
| Setting and user | ✍️ TEAM |
| The "cargo" | ✍️ TEAM |
| What changes | ✍️ TEAM to confirm. Recordings mention batteries, pressure, humidity and cable wear: "same variables, different values." |
| Existing system | **NFPA 855** (stationary energy storage systems) covers design, installation, commissioning, operation, maintenance and decommissioning. Whether it applies depends on battery chemistry and stored energy. The 2026 edition is current, but many jurisdictions still enforce older editions. |
| PSI link | **Method only.** PSI has no battery, electrical-fault or power-plant fire data. The only PSI power-plant mention (ACME Flame Design) is about efficiency, not fire safety. Battery evidence would come from the battery studies listed in the [data sources catalogue](../data/data-sources-catalog.md), which are not yet validated locally. |
| Real incident | **Moss Landing, California (16 January 2025):** a fire at Vistra's 300 MW Phase I battery facility led to evacuations and closed Highway 1. Local officials said the fire suppression system failed. Accounts of the damage differ: early reports said about 40% burned, a fire chief later said 75% of the building, and the EPA said about 55% of the batteries were damaged. The cause was undetermined in early reporting. |
| What the passport adds | ✍️ TEAM |
| Limits | Weakest data link of the three. Keep it as a method-transfer example, and do not cite PSI as evidence for battery fires. |

### Card C: Schools and public buildings

| Field | Content |
|---|---|
| Setting and user | ✍️ TEAM |
| The "cargo" | ✍️ TEAM: e.g. furniture, wall panels, equipment brought into the building? |
| What changes | ✍️ TEAM: e.g. occupancy, ventilation, how the item is installed or combined with others. |
| Existing system | **EU:** EN 13501-1 classifies construction products by reaction to fire (classes A1 to F; classes A2–D also cover smoke and flaming droplets). Under the Construction Products Regulation (EU) 305/2011, most products need a **Declaration of Performance** and CE marking, so a product's fire class travels with it on paper. This is close to a passport already. **US:** NFPA 101 Life Safety Code covers schools (exits, alarms, drills). |
| PSI link | **Method, plus data for smoke detection.** SAME/SAME-R and PSI-115 are about better smoke detectors, which matter in every school. BASS/Saffire material findings do not transfer directly (microgravity, different materials). |
| Real incidents | **Our Lady of the Angels school, Chicago (1958):** the school had no sprinklers or smoke detectors, and its exits did not meet the Building Exits Code. NFPA 101 was revised extensively afterwards, and an NFPA survey in 1960 found improvements in 16,500 US schools. **Grenfell Tower, London (2017):** not a school, but the clearest case of product-level evidence not matching the installed system. The Inquiry found "deliberate and sustained strategies to manipulate the testing processes" by manufacturers. A BRE review after the 1991 Knowsley Heights fire had already found that small-scale tests could not show how a whole wall system would react to fire. |
| What the passport adds | ✍️ TEAM |
| Limits | Building codes are national and differ widely. The passport would not replace a code or a fire engineer's assessment. Grenfell involved deliberate dishonesty, which better documentation alone does not prevent. |

**Why this card matters for the pitch:** it is the most relatable setting for a non-technical jury, since everyone has been in a school.

---

## 4. Pattern across the three cards

Each setting already has paperwork that travels with an item: aircraft certification tests and dangerous-goods declarations, NFPA 855 commissioning documents, and EU Declarations of Performance. In each incident above, the paperwork existed but did not match the real conditions or configuration.

✍️ TEAM: is this the Earth message? Write it in one sentence in your own words.

## 5. Ranking (Step 3)

✍️ TEAM: score each card 1–5.

| Card | PSI data link | Relatable to a non-technical jury | Existing system to connect to | Total |
|---|---|---|---|---|
| A: Aircraft | | | | |
| B: Power plants / energy storage | | | | |
| C: Schools / public buildings | | | | |

Use the top card in the 2-minute local pitch. Mention the others in the submission text.

## 6. Still to verify before quoting

- [ ] 14 CFR 25.853 and Appendix F: exact current wording and which tests apply to which parts (eCFR).
- [ ] Whether the Appendix F tests are run at ambient lab conditions (would strengthen the "tested conditions ≠ flight conditions" point).
- [ ] ICAO Technical Instructions: current lithium battery rules (only 2016 news and later working papers were checked).
- [ ] UPS Flight 6: confirm the cause statement in the GCAA final report (the FAA summary confirms the battery count and the undeclared shipments).
- [ ] NFPA 855: current scope text and thresholds (vendor figures were not confirmed).
- [ ] Moss Landing: the cause, from the final investigation if published.
- [ ] Grenfell: the Inquiry's own conclusions on system-level testing (Phase 2 report, executive summary).
- [ ] Our Lady of the Angels: NFPA's 1959 report; secondary sources disagree on what was already required in 1958.
- [ ] FLEX test count at ~0.7 atm (103) comes from a quick parse; recheck after data normalisation.

## Sources

**PSI:** Earth-benefit text and DOIs from `data/combustion_investigations_summary.json` and `data/investigations/*.json`.

**Aircraft**
- [14 CFR 25.841, Cornell LII](https://www.law.cornell.edu/cfr/text/14/25.841); [2023 FAA amendment, Federal Register](https://www.govinfo.gov/content/pkg/FR-2023-06-15/html/2023-12454.htm)
- [14 CFR 25.853, eCFR](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-C/part-25/subpart-D/subject-group-ECFR1e1f52030ba4797/section-25.853); [Appendix F to Part 25, Cornell LII](https://www.law.cornell.edu/cfr/text/14/appendix-F_to_part_25)
- [Swissair 111 investigation report, executive summary (TSB)](https://www.tsb.gc.ca/eng/medias-media/fiches-facts/a98h0003/sum_a98h0003.html); [TSB Recommendation A99-07](https://tsb-bst.gc.ca/eng/recommandations-recommendations/aviation/1999/rec-a9907.html); [TSB Recommendation A03-01](https://bst.gc.ca/eng/recommandations-recommendations/aviation/2003/rec-a0301.html)
- [FAA Lessons Learned: N571UP (UPS 6)](https://www.faa.gov/lessons_learned/transport_airplane/accidents/N571UP)
- [ICAO passenger-aircraft lithium battery ban (In Compliance)](https://incompliancemag.com/lithium-ion-battery-shipments-to-be-banned-from-passenger-aircraft/); [IFALPA position on lithium batteries in air cargo](https://www.ifalpa.org/media/4156/25pos01-energy-content-of-lithium-batteries-in-air-cargo.pdf)

**Power plants and energy storage**
- [NFPA 855 scope (GlobalSpec)](https://standards.globalspec.com/std/14632082/855); [NFPA 855 2026 edition updates (Energy-Storage.news)](https://www.energy-storage.news/nfpa-855-2026-edition-updates-and-what-they-mean-for-energy-storage-projects/)
- [EPA: Moss Landing Li-ion fire](https://scribenet.response.epa.gov/Moss_Landing_Li-ion_Fire); [E&E News](https://www.eenews.net/articles/worlds-largest-battery-storage-site-on-fire-in-central-california/); [Power Engineering](https://www.power-eng.com/energy-storage/batteries/locals-request-total-shutdown-of-moss-landing-as-california-governor-calls-for-investigation-into-battery-storage-fire/)

**Schools and public buildings**
- [Commission Delegated Regulation (EU) 2016/364, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/364/oj); [EN 13501-1 overview (Measurlabs, commercial)](https://measurlabs.com/blog/en-13501-1-fire-classification-performance-classes-and-criteria/); [CPR fire safety overview (Centexbel)](https://www.centexbel.be/en/knowledge-hub/depth-articles/european-legislation/fire-safety-construction-products)
- [Our Lady of the Angels: EC&M](https://www.ecmag.com/magazine/articles/article-detail/the-fire-that-changed-prevention--the-tragedy-at-our-lady-of-angels-marks-nearly-70-years-of-progress-in-life-safety-for-schools); [Daily Herald](https://www.dailyherald.com/20081201/news/our-lady-tragedy-ushered-in-safety-improvements/)
- [Grenfell Tower Inquiry Phase 2 overview](https://grenfelltowerinquiry.org.uk/sites/default/files/CCS0923434692-004_GTI%20Phase%202%20OVERVIEW_LARGE_3%20SEPT_3.pdf); [Durham fire authority summary](https://democracy.durham.gov.uk/documents/s196385/Item%2010%20Grenfell%20Tower%20Inquiry%20Phase%202.pdf)

---

*SI disclosure: the three Earth settings were proposed by the team. The research fields (existing systems, PSI links, incidents, sources) were compiled with SI assistance (Claude) from web searches and the repository data on 14 November 2026. Fields marked ✍️ TEAM are left for the team.*
