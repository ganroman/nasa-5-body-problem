# How the passport decides

The demo item in `data/passport.json` is illustrative. Its five parts are invented. The tests and the airs are not: every one of them points at a record in `data/evidence.json` that holds a verbatim quote from a published document. The material labels of the parts are illustrative item details; a test lists only what its record states (see "What a test entry may say" below).

The passport shows evidence and gaps. It never says whether a part is allowed. People decide.

## The three statuses

- **evidence applies**: a test of this material in this form was run at the pressure of this air, and at an oxygen level at or above the oxygen of this air. The test result is a self-extinguishing limit or a pass, not a burn.
- **conditions differ**: there are tests for this material, but none covers this air. The test was at another pressure, at lower oxygen, had no stated pressure, or shows the material burning.
- **no evidence**: no test of this material in this form is in the passport. The part lists the records that are only about that kind of part (for the battery: documents on lithium-ion cells as an ignition source), and those records are not tests.

## How a status is decided

`assess(passport, { vehicle, place })` in `assets/js/passport-rules.js` does this for each part:

1. It takes the air of the vehicle (`passport.vehicles`). If the place has its own air in that vehicle (the airlock on the station), that air is used instead.
2. A test covers the air when its pressure is within `tolerances.pressure_kpa` of the air's pressure and the air's oxygen is not above the tested oxygen. A burn or a failure never covers.
3. One covering test gives "applies". Otherwise any test gives "differs" and the part lists the nearest tests. No test gives "none".
4. If the place is powered, the powered-item record is added to every part.

No threshold is hidden in the code. The pressure tolerance (1 kPa, about the rounding between psia and kPa) and the rule for each kind of result are in the data. The tolerance is narrow because the record `moc-depends-on-geometry-thickness-pressure-gravity` lists pressure as one of the things a test result depends on.

The same input always gives the same output.

## What a flag on a place means

A place is flagged only when a record gives a reason. The airlock: the ISS requirements give it a higher-oxygen worst case than the rest of the station. The vent: ventilation fans on space vehicles replace natural convection and can supply the air a fire needs to burn (`tb008-ventilation-feeds-fire`). The charging shelf: powered items and batteries are ignition sources. The locker, where the handbook's stowage rule points (unpowered, in a locker or fire-barrier bag), and the open rack, which has no record of its own, are not flagged. A flag marks a place to look at. It is not a ban.

Each place says in which vehicles its flag holds (`flag_in`). The airlock and the vent reasons are written about the station, so they are not flagged in the lunar habitat. The charging shelf reason does not depend on the station, so it keeps its flag there, with a record about partial gravity added.

## What the passport cannot tell

- The gravity caveat is a record, not a sentence of the page. `passport.rules.gravity_caveat_evidence` lists it: first `eclss-tm-essentially-all-flammability-test-data-1g` (a NASA report says essentially all existing flammability test data for flight materials are from 1-g testing), then two records on lunar gravity (oxygen limits lower than measured in 1 g; some materials that do not burn in 1 g burn in 0 g with a low flow or in partial gravity). The page shows the claim of each, with its citation, under every part whose status is "applies". `caveats.gravity_caveat_components` lists those parts. A part is left out when a covering test names a gravity of its own. No template or module writes a sentence about gravity.
- One specimen is not every part. A test of a silicone sheet says nothing about a thinner gasket. A test of PTFE sheet is not a test of PTFE wire insulation, so the wiring has no evidence. Each test keeps only the wording of its record (see below); sizes and layers that the source gives elsewhere are not copied into the test.
- The cabin is compared at its nominal oxygen. The station may run up to its maximum allowable oxygen, stored as `o2_max_percent` and shown beside it, but the status does not use it. The planned lunar habitat has no maximum in the passport: the only record that names a 37% figure speaks of a vehicle value in one architecture option of early Artemis surface vehicles, which is not the planned habitat's maximum.
- A battery has no test result in the passport. A missing test is a gap, not a pass.
- There are no scores and no verdicts.

## What a test entry may say

`gravity` and `form` of a test are `null` unless every word of the value is in the claim or quote of the record the test cites. The silicone, PTFE and Nomex tests say only "silicone", "PTFE" and "Nomex" (the Nomex row of Table 2 gives "Nomex HT90-40"). The Saffire tests say "low gravity", because the cited sentence does. The ground tests carry no gravity label: their records do not state one. The names and material labels of the item's parts ("PMMA cast sheet", "Silicone rubber, ~1.5 mm") are illustrative details of the demo item, marked illustrative on the page, and are not claimed to match a tested sample. `tests/unit/passport-rules.test.mjs` and `tests/unit/fleet.test.mjs` check this for every test entry.

## Where each number comes from

- ISS cabin, 21% oxygen at 14.7 psia, maximum allowable 24.1%: two records from a 2026 NESC report on reduced-pressure atmospheres. The kPa value is 14.7 psia times 6.895, marked `computed`.
- ISS airlock, 30% oxygen at 10.2 psia: the worst-case airlock environment in the ISS safety requirements (SSP 51721). The kPa value is computed the same way.
- Lunar habitat, 34% oxygen at 8.2 psi (56.5 kPa): Artemis requirements for sustained missions, in the 2026 paper ICES-2026-324. It is a plan, not a built habitat. The same paper's architecture table lists a vehicle MOC of 37% at 8.2 psi for Architecture 1, one option for early Artemis surface vehicles; that is not shown as the habitat's maximum.
- Silicone 1.5 mm: limits of 28%, 23% and 21% oxygen at 48.2, 85.3 and 101.3 kPa, from a 2006 White Sands Test Facility paper on pressure and oxygen flammability thresholds.
- Black Kevlar/PBI webbing: a limit of 35% oxygen at 8.2 psia, from NESC bulletin TB 26-05.
- PMMA samples IV-2 and V-3: two tests (Saffire IV and V) in which, as the authors report, the flame stayed fixed at the leading edge of the sample; the oxygen and pressure listed are in the record's conditions.

The test `tests/unit/passport-rules.test.mjs` checks that each number appears in the claim, quote or conditions of the record that cites it.
