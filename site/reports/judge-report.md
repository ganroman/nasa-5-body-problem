# Judge report

- Date: 2026-11-15T20:29:14.326Z
- Model: ingested verdicts
- Mode: ingest
- Judge(s): claude-sonnet subagent, independent judge run of 15 Nov 2026
- Result: PASS

## Totals

- Support: 69 supported, 1 partial, 0 unsupported, 0 error
- Coverage: 94 assertions on 2 page(s), 94 backed, 0 unbacked, 0 page error(s)

## Support, per evidence item

| Evidence id | Verdict | Problems |
| --- | --- | --- |
| qf-mir-candle-nearly-invisible-lower-oxygen | supported | - |
| qf-eightfold-density-flame-lifts-flickers | supported | - |
| qf-earth-hot-gas-rises-sets-flame-shape | supported | - |
| qf-shuttle-candle-yellow-to-blue | supported | - |
| qf-pale-blue-almost-invisible | supported | - |
| qf-ventilation-replaces-convection | supported | - |
| qf-station-circulation-transports-oxygen | supported | - |
| qf-bass2-lower-oxygen-than-earth | supported | - |
| qf-bass2-flow-cut-flame-out-2s | supported | - |
| saffire-v-cotton-fan-off-70s-regrew | supported | - |
| fire-went-out-twice-flex | supported | - |
| cool-flames-discovered-2012-flex | supported | - |
| cameras-blind-radiometers-see-heat | supported | - |
| tb008-smoke-detectors-go-in-the-ventilation | supported | - |
| ices2020-well-mixed-air-dilutes-smoke | supported | - |
| friedman2000-shuttle-overheats-never-tripped-detector | supported | - |
| saffire6-alarm-after-most-hazardous-gas | supported | - |
| saffire6-heat-and-pressure-rise-small-versus-gases | supported | - |
| saffire6-co-co2-over-nasa-limits | supported | - |
| limit-liquid-then-gas-then-solid-programs | supported | - |
| little-known-about-cool-flame-chemistry | supported | - |
| pedley2001-airflow-conundrum | supported | - |
| qf-mir-weak-flames-not-sensed-by-smoke-detectors | supported | - |
| meyer2018-smoke-not-different-detectors-missed-some | supported | - |
| qf-saffire-still-air-not-rapid | supported | - |
| iss-cabin-nominal-14-7-psia-21-o2 | supported | - |
| iss-cabin-control-band-max-o2-24-1 | supported | - |
| ssp51721-iss-airlock-worst-case-10-2-psia-30-o2 | supported | - |
| iss-airlock-campout-10-2-psi-station-14-7 | supported | - |
| exploration-atmosphere-8-2-psi-34-o2-artemis-sustained | supported | - |
| early-artemis-surface-options-8-2-psi-37-moc-9-6-psi-30-moc | supported | - |
| saffire45-thick-pmma-flame-stays-at-leading-edge | supported | - |
| silicone-1p5mm-moc-vs-pressure | supported | - |
| kevlar-pbi-webbing-moc-8p2psia | supported | - |
| pmma-ignition-delay-shorter-at-58-6-kpa-and-32-o2 | supported | - |
| jsc29353d-liion-vs-alkaline-ignition-power | supported | - |
| jsc29353d-liion-in-stowage-bags | supported | - |
| ptfe-1p5mm-moc-vs-pressure | supported | - |
| ssp51721-ignition-source-definition | supported | - |
| olson2004-slight-flow-keeps-near-invisible-flame-alive | supported | - |
| tb008-ventilation-feeds-fire | supported | - |
| jsc29353b-open-cabin-use-keep-flammables-away-from-power-outlets | supported | - |
| jsc29353d-partial-g-2w-short-circuit | supported | - |
| jsc29353d-powered-in-locker | supported | - |
| jsc29353d-powered-hardware-higher-o2-vehicles | supported | - |
| ruff2021-lunar-g-oxygen-limits-lower-than-1g | supported | - |
| ferkul2026-1g-nonflammable-materials-burn-in-0g-flow-or-lunar-g | supported | - |
| moc-depends-on-geometry-thickness-pressure-gravity | supported | - |
| ssp51721-airlock-worst-case-o2 | supported | - |
| flex-heptane-dual-modes-cool-flame-second-stage | supported | - |
| saffire6-small-fire-by-terrestrial-standards | supported | - |
| saffire-v-cotton-flamelets-or-embers-undetermined | supported | - |
| saffire-v-cotton-flamelet-likely | supported | - |
| saffire-iv-v-objective-range-of-atmospheres | supported | - |
| nomex-ht90-40-single-layer-moc-10p2psia | supported | - |
| nomex-ht90-40-fabric-config-dependence-70p1kpa | supported | - |
| pmma-acrylic-rod-moc-14p7psia | supported | - |
| jsc29353b-abs-case-speaker-burned-completely-24-1-o2-aluminum-case-undamaged | partial | The claim and quote are fully stated, but the recorded pressure_kpa of 101.4 is a conversion of 14.7 psia that the excerpt does not state (the excerpt gives only 14.7 psia). |
| std6001-test1-worst-case-atmosphere | supported | - |
| air-data-not-conservative-for-higher-o2-lower-pressure | supported | - |
| jsc29353d-24-1-acceptable-24-5-flammable | supported | - |
| fortenberry-lunar-habitat-34pct-8-2psi | supported | - |
| materials-change-needed-21pct-10-2-26-5-70pct-8-2-34 | supported | - |
| abs-pc-case-limits | supported | - |
| jsc29353d-ignition-power-reevaluated | supported | - |
| flammable-hardware-accepted-if-crew-tended-and-stowed-in-nonflammable-container | supported | - |
| jsc29353d-assess-at-higher-o2 | supported | - |
| aga-portable-battery-powered-device | supported | - |
| aga-end-item-spec-21-percent-o2 | supported | - |
| eclss-tm-essentially-all-flammability-test-data-1g | supported | - |

## Coverage, per page

### index.html

| Line | Assertion | Evidence |
| --- | --- | --- |
| 132 | The International Space Station was designed and is operated to approximate Earth-equivalent air, at 14.7 psia with 21 percent oxygen. | iss-cabin-nominal-14-7-psia-21-o2 |
| 132 | ISS safety requirements name a worst-case oxygen environment of 14.7 psia with 24.1 percent oxygen for all locations except the US-segment airlock, where it is 10.2 psia with 30 percent oxygen. | ssp51721-iss-airlock-worst-case-10-2-psia-30-o2, ssp51721-airlock-worst-case-o2 |
| 132 | In one report, a portable, battery-powered device that measures specific atmospheric constituents is not required by its specification to operate in oxygen concentrations other than the nominal ISS level of 21 percent. | aga-portable-battery-powered-device, aga-end-item-spec-21-percent-o2 |
| 132 | A white paper says material flammability limits are not expected to meet current requirements under the 34 percent oxygen and 8.2 psi planned for future lunar habitats. | fortenberry-lunar-habitat-34pct-8-2psi |
| 132 | One paper concludes that data from lower-oxygen, higher-pressure air cannot be conservatively applied to higher-oxygen, lower-pressure air, despite equivalent partial pressures. | air-data-not-conservative-for-higher-o2-lower-pressure |
| 134 | a material that is acceptable in 24.1 percent oxygen may be flammable in 24.5 percent oxygen at the same pressure. | jsc29353d-24-1-acceptable-24-5-flammable |
| 152 | In a table of oxygen-concentration flammability limits at three total pressures, silicone is listed at 28 percent oxygen at 48.2 kPa, 23 percent at 85.3 kPa and 21 percent at 101.3 kPa. | silicone-1p5mm-moc-vs-pressure |
| 152 | Silicone has a different listed limit at each pressure. | silicone-1p5mm-moc-vs-pressure |
| 152 | The JSC 29353D flammability guidance says small, low-voltage alkaline and coin batteries are still believed unable to deliver the powers required for ignition, although larger batteries, such as lithium-ion rechargeables for portable electronic devices, can certainly reach higher power levels. | jsc29353d-liion-vs-alkaline-ignition-power |
| 169 | In the Saffire VI experiments, the smoke from the fire event was readily detected, but a typical alarm threshold was reached only at 981 seconds, and by then, the authors say, most of the hazardous gas release had occurred. | saffire6-alarm-after-most-hazardous-gas |
| 226 | Lunar habitat (planned, not built) | fortenberry-lunar-habitat-34pct-8-2psi, exploration-atmosphere-8-2-psi-34-o2-artemis-sustained |
| 236 | ISS cabin: 21 % oxygen, 14.7 psia | iss-cabin-nominal-14-7-psia-21-o2 |
| 240 | 14.7 psia = 101.4 kPa | iss-cabin-nominal-14-7-psia-21-o2 |
| 265 | In the Saffire IV and V tests, both concurrent PMMA samples (IV-2 and V-3) did not spread appreciably and instead remained fixed at the leading edge of the sample, advancing through surface regression only, which the authors call typical for thick fuels in low gravity but different from normal gravity. | saffire45-thick-pmma-flame-stays-at-leading-edge |
| 272 | The JSC 29353D handbook says small, low-voltage alkaline and coin batteries are still believed to be incapable of delivering the powers required for ignition, although larger batteries such as lithium-ion rechargeable batteries for portable electronic devices can certainly achieve higher power levels. | jsc29353d-liion-vs-alkaline-ignition-power |
| 272 | Stowage bags can have flammable items stowed inside provided they do not contain ignition sources (such as electrical power) and are not susceptible to spontaneous ignition or chemical reaction, and the ISS and MPCV Programs allow fully certified and undamaged batteries, including lithium-ion rechargeable batteries, to be stowed inside such bags without additional containment. | jsc29353d-liion-in-stowage-bags |
| 279 | In a table of oxygen-concentration flammability limits at three total pressures, silicone is listed at 28% oxygen at 48.2 kPa, 23% at 85.3 kPa and 21% at 101.3 kPa. | silicone-1p5mm-moc-vs-pressure |
| 279 | A NASA reduced-pressure-atmospheres report says that essentially all existing test data for flammability of flight materials are from 1-g testing, and that consequently minimal flammability data exists at varying oxygen concentrations in partial-gravity environments. | eclss-tm-essentially-all-flammability-test-data-1g |
| 279 | Theory and experimental results indicate that oxygen flammability limits in lunar-g are lower than those measured in 1-g. | ruff2021-lunar-g-oxygen-limits-lower-than-1g |
| 279 | Theoretical and experimental results have demonstrated that some materials that will not burn in 1-g will burn in 0-g with a low-speed flow or in partial gravity such as lunar gravity. | ferkul2026-1g-nonflammable-materials-burn-in-0g-flow-or-lunar-g |
| 286 | In a table of oxygen-concentration flammability limits at three total pressures, PTFE is listed with a maximum oxygen concentration (MOC) of 53% oxygen at 48.2 kPa, 46% at 85.3 kPa and 42% at 101.3 kPa. | ptfe-1p5mm-moc-vs-pressure |
| 286 | For flammability considerations, any high-power electrical wire is a potential ignition source, and any item that could cause sparks, such as a brush motor, is also considered a potential ignition source. | ssp51721-ignition-source-definition |
| 293 | The webbings had maximum oxygen concentrations (MOCs) of 37% for the natural webbing and 35% for the black webbing at 8.2 psia. | kevlar-pbi-webbing-moc-8p2psia |
| 443 | Air: ISS cabin: 21% oxygen, 14.7 psia | iss-cabin-nominal-14-7-psia-21-o2 |
| 447 | In the Saffire IV and V tests, both concurrent PMMA samples (IV-2 and V-3) did not spread appreciably and instead remained fixed at the leading edge of the sample, advancing through surface regression only, which the authors call typical for thick fuels in low gravity but different from normal gravity. | saffire45-thick-pmma-flame-stays-at-leading-edge |
| 450 | The JSC 29353D handbook says small, low-voltage alkaline and coin batteries are still believed to be incapable of delivering the powers required for ignition, although larger batteries such as lithium-ion rechargeable batteries for portable electronic devices can certainly achieve higher power levels. | jsc29353d-liion-vs-alkaline-ignition-power |
| 450 | Stowage bags can have flammable items stowed inside provided they do not contain ignition sources (such as electrical power) and are not susceptible to spontaneous ignition or chemical reaction, and the ISS and MPCV Programs allow fully certified and undamaged batteries, including lithium-ion rechargeable batteries, to be stowed inside such bags without additional containment. | jsc29353d-liion-in-stowage-bags |
| 453 | In a table of oxygen-concentration flammability limits at three total pressures, silicone is listed at 28% oxygen at 48.2 kPa, 23% at 85.3 kPa and 21% at 101.3 kPa. | silicone-1p5mm-moc-vs-pressure |
| 456 | In a table of oxygen-concentration flammability limits at three total pressures, PTFE is listed with a maximum oxygen concentration (MOC) of 53% oxygen at 48.2 kPa, 46% at 85.3 kPa and 42% at 101.3 kPa. | ptfe-1p5mm-moc-vs-pressure |
| 456 | For flammability considerations, any high-power electrical wire is a potential ignition source, and any item that could cause sparks, such as a brush motor, is also considered a potential ignition source. | ssp51721-ignition-source-definition |
| 459 | The webbings had maximum oxygen concentrations (MOCs) of 37% for the natural webbing and 35% for the black webbing at 8.2 psia. | kevlar-pbi-webbing-moc-8p2psia |
| 461 | The text of the ISS operational control OCAD 101882 says that, when deployed in the open cabin for use, the flammable items it covers will be kept away from rack power outlets, utility outlet panels (UOPs) and power strips. | jsc29353b-open-cabin-use-keep-flammables-away-from-power-outlets |
| 461 | Flammable materials stowed in these containers do not constitute a fire risk while in the containers provided they are unpowered, but powered payloads or experiments stowed in lockers for an entire mission, or located in place of a locker, are to be evaluated from a flammability standpoint because they present a potential fire hazard. | jsc29353d-powered-in-locker |
| 483 | ISS safety requirements say end item materials should be tested or evaluated in the worst-case airlock environment if they intend to operate in the airlock during preparations for a spacewalk (EVA). | ssp51721-airlock-worst-case-o2 |
| 537 | Air: ISS cabin: 21% oxygen, 14.7 psia | iss-cabin-nominal-14-7-psia-21-o2 |
| 537 | Hardware designed for internal or external use on ISS is acceptable for transport in pressurized areas of vehicles with higher oxygen concentrations, provided it is unpowered and stowed in a locker or validated fire barrier stowage bag, and unpowered metal boxes, which may be painted, are also acceptable. | jsc29353d-powered-hardware-higher-o2-vehicles |
| 555 | The flammability standard NASA-STD-6001B says Test 1 shall evaluate a material in the worst-case atmosphere to which it could be exposed. | std6001-test1-worst-case-atmosphere |
| 555 | The JSC 29353D flammability guidance says hardware designed for use on ISS is acceptable for transport in pressurized areas of vehicles with higher oxygen concentrations, provided it is unpowered and stowed in a locker or validated fire barrier stowage bag, and that unpowered metal boxes are also acceptable. | jsc29353d-powered-hardware-higher-o2-vehicles |
| 555 | The same guidance says hardware not meeting these constraints is to be assessed for flammability at the higher oxygen concentration and pressure. | jsc29353d-assess-at-higher-o2 |
| 555 | One report says that historically, programs with up to 30 percent oxygen at 10.2 psia have accepted some flammable hardware by material usage agreement, based on the hardware being largely crew-tended while in use and stowed in a nonflammable container when not in use. | flammable-hardware-accepted-if-crew-tended-and-stowed-in-nonflammable-container |
| - | data/passport.json environment 'ISS cabin' (nominal operating atmosphere): 21% oxygen, 14.7 psia, 101.4 kPa | iss-cabin-nominal-14-7-psia-21-o2 |
| - | data/passport.json environment 'ISS cabin': o2_max_percent 24.1 (maximum allowable oxygen in the cabin) | iss-cabin-control-band-max-o2-24-1 |
| - | data/passport.json environment 'ISS airlock, spacewalk preparation' (certification worst case): 30% oxygen, 10.2 psia, 70.3 kPa | ssp51721-iss-airlock-worst-case-10-2-psia-30-o2, ssp51721-airlock-worst-case-o2 |
| - | data/passport.json environment 'Lunar habitat (planned)': 34% oxygen, 8.2 psia, 56.5 kPa | exploration-atmosphere-8-2-psi-34-o2-artemis-sustained, fortenberry-lunar-habitat-34pct-8-2psi |
| - | data/passport.json place 'Airlock': The station airlock, used for spacewalk preparation. | ssp51721-airlock-worst-case-o2, iss-airlock-campout-10-2-psi-station-14-7 |
| - | data/passport.json PMMA test records: PMMA samples IV-2 at 22.0% O2, 100.0 kPa and V-3 at 25.4% O2, 71.3 kPa, low gravity, result burned-at | saffire45-thick-pmma-flame-stays-at-leading-edge |
| - | data/passport.json and data/fleet.json silicone test records: self-extinguished up to 28% O2 at 48.2 kPa, 23% at 85.3 kPa, 21% at 101.3 kPa | silicone-1p5mm-moc-vs-pressure |
| - | data/passport.json and data/fleet.json Kevlar/PBI black webbing: passed at 35% O2 at 56.5 kPa | kevlar-pbi-webbing-moc-8p2psia |
| - | data/fleet.json Kevlar/PBI natural webbing: passed at 37% O2 at 56.5 kPa | kevlar-pbi-webbing-moc-8p2psia |
| - | data/fleet.json PTFE test records: self-extinguished up to 53% O2 at 48.2 kPa, 46% at 85.3 kPa, 42% at 101.3 kPa | ptfe-1p5mm-moc-vs-pressure |
| - | data/fleet.json Nomex HT90-40 test record: self-extinguished up to 25% O2 at 70.3 kPa | nomex-ht90-40-single-layer-moc-10p2psia |
| - | data/fleet.json Nomex test record: failed at 30% O2 at 70.1 kPa | nomex-ht90-40-fabric-config-dependence-70p1kpa |
| - | data/fleet.json handheld speaker case test record: burned at 24.1% O2 at 101.4 kPa (Bluetooth speaker) | jsc29353b-abs-case-speaker-burned-completely-24-1-o2-aluminum-case-undamaged |

### stories/quiet-fire/index.html

| Line | Assertion | Evidence |
| --- | --- | --- |
| 119 | On the Mir station, a candle's flame in weightlessness was nearly invisible to the naked eye. | qf-mir-candle-nearly-invisible-lower-oxygen |
| 119 | It burned slowly, yet it burned down to a lower oxygen level than the identical candle would on Earth. | qf-mir-candle-nearly-invisible-lower-oxygen |
| 119 | A NASA summary says that smoke detectors would be unable to sense these kinds of weak, non-smoking flames, but adds that they are so weak as to be non-hazardous. | qf-mir-weak-flames-not-sensed-by-smoke-detectors |
| 134 | On Earth, as hot gas rises from the flame, gravity pulls cooler, denser air in at the bottom of it. | qf-earth-hot-gas-rises-sets-flame-shape |
| 134 | NASA's fire-protection brief says that in microgravity this flow does not occur. | qf-earth-hot-gas-rises-sets-flame-shape |
| 134 | Another candle, lit in weightlessness, began as a spherical, bright yellow flame. | qf-shuttle-candle-yellow-to-blue |
| 134 | After 8 to 10 seconds the yellow disappeared, and the flame became blue and nearly hemispherical. | qf-shuttle-candle-yellow-to-blue |
| 136 | Flames in near quiescent or low-oxygen environments are often pale blue and almost invisible. | qf-pale-blue-almost-invisible |
| 152 | On a spacecraft, NASA's fire-protection brief says, ventilation fans replace natural convection and can supply the air a fire needs to burn. | qf-ventilation-replaces-convection, tb008-ventilation-feeds-fire |
| 152 | In the BASS-II experiments, flames spread over black PMMA (acrylic) rods in weightlessness at oxygen levels as low as 17.5 percent. | qf-bass2-lower-oxygen-than-earth |
| 152 | On the ground, spread was not seen below 19 percent. | qf-bass2-lower-oxygen-than-earth |
| 152 | The report says this is probably due to slower air flowing against the flame in the weightless tests. | qf-bass2-lower-oxygen-than-earth |
| 152 | In one test on a 100-micrometre PMMA film, the flame went out within 2 seconds of the flow being cut off. | qf-bass2-flow-cut-flame-out-2s |
| 152 | Yet in one Saffire V test on thin cotton fabric, the fan was off for 70 seconds, but the flame grew back when the flow returned. | saffire-v-cotton-fan-off-70s-regrew |
| 152 | Both flamelets and embers were present when imaging stopped, so the authors cannot tell whether the flame survived the next 60 seconds. | saffire-v-cotton-flamelets-or-embers-undetermined |
| 152 | The Saffire flights aimed to observe fires at a range of atmospheres, including those expected for exploration missions. | saffire-iv-v-objective-range-of-atmospheres |
| 173 | On the space station, a burning droplet of heptane fuel appeared to go out but kept burning with no visible flame. | fire-went-out-twice-flex, flex-heptane-dual-modes-cool-flame-second-stage |
| 173 | NASA says the fire went out twice, and that the second stage was sustained by what is known as cool flame chemical heat release. | fire-went-out-twice-flex, flex-heptane-dual-modes-cool-flame-second-stage |
| 173 | In one decane droplet test, the colour and ultraviolet cameras were not sensitive enough to register any flame image in the cool stage. | cameras-blind-radiometers-see-heat |
| 173 | Radiometers, which measure radiated heat, still recorded heat from the droplet, which the authors read as active chemical heat release. | cameras-blind-radiometers-see-heat |
| 175 | A fuel droplet appeared to extinguish but actually continued to burn without a visible flame. The fire went out twice-once with and once without a visible flame. | fire-went-out-twice-flex |
| 191 | In space, smoke does not rise, so detectors sit inside the ventilation system. | tb008-smoke-detectors-go-in-the-ventilation |
| 191 | In about 20 years of Space Shuttle operations, five potential fire-causing incidents (overheating or electrical short circuits) occurred, and in none was the early fire signal strong enough to set off a smoke detector. | friedman2000-shuttle-overheats-never-tripped-detector |
| 191 | In the Saffire VI experiments, the smoke from the fire event was readily detected. | saffire6-alarm-after-most-hazardous-gas |
| 191 | But a typical alarm threshold was reached only at 981 seconds, and by then, the authors say, most of the hazardous gas release had occurred. | saffire6-alarm-after-most-hazardous-gas |
| 193 | On Earth, smoke detectors are installed on the ceiling or upper section of a wall because that's the direction in which smoke travels. In space, smoke doesn't rise, so detectors are placed within the ventilation system. | tb008-smoke-detectors-go-in-the-ventilation |
| 209 | In the Saffire VI tests, the authors found the rise in temperature and pressure less significant than the rise in carbon dioxide and carbon monoxide. | saffire6-heat-and-pressure-rise-small-versus-gases |
| 209 | The paper says the fires were generally 1.5 to 3 kilowatts, which it calls a small fire by terrestrial standards. | saffire6-small-fire-by-terrestrial-standards |
| 209 | In two PMMA tests, carbon monoxide rose by 308 and 320 parts per million (ppm), well above the 24-hour SMAC (100 ppm) and quite close to the 1-hour level (425 ppm), the authors say. | saffire6-co-co2-over-nasa-limits |
| 224 | In 2001, a NASA ISS materials manager listed a conundrum: air flow is needed to transport smoke to traditional sensors, yet air flow is the worst thing for microgravity fires. | pedley2001-airflow-conundrum |
| 235 | The Saffire VI fire tests in this story ran in an uncrewed spacecraft, not in a crewed cabin. | saffire6-co-co2-over-nasa-limits |
| - | data/passport.json environment: ISS cabin, nominal operating atmosphere, 21% O2 (up to 24.1% O2), 14.7 psia (101.4 kPa). | iss-cabin-nominal-14-7-psia-21-o2, iss-cabin-control-band-max-o2-24-1 |
| - | data/passport.json environment: ISS airlock, spacewalk preparation, certification worst case, 30% O2, 10.2 psia (70.3 kPa). | ssp51721-iss-airlock-worst-case-10-2-psia-30-o2, iss-airlock-campout-10-2-psi-station-14-7 |
| - | data/passport.json environment/vehicle: Lunar habitat (planned, not built), 34% O2, 8.2 psia (56.5 kPa). | exploration-atmosphere-8-2-psi-34-o2-artemis-sustained, fortenberry-lunar-habitat-34pct-8-2psi |
| - | data/passport.json place: The station airlock, used for spacewalk preparation. | iss-airlock-campout-10-2-psi-station-14-7, ssp51721-airlock-worst-case-o2 |
| - | data/passport.json test: PMMA sample IV-2 burned (flame stayed at the leading edge) at 22.0% O2, 100.0 kPa, low gravity. | saffire45-thick-pmma-flame-stays-at-leading-edge |
| - | data/passport.json test: PMMA sample V-3 burned (flame stayed at the leading edge) at 25.4% O2, 71.3 kPa, low gravity. | saffire45-thick-pmma-flame-stays-at-leading-edge |
| - | data/passport.json test: silicone self-extinguished up to 28% O2 at 48.2 kPa. | silicone-1p5mm-moc-vs-pressure |
| - | data/passport.json test: silicone self-extinguished up to 23% O2 at 85.3 kPa. | silicone-1p5mm-moc-vs-pressure |
| - | data/passport.json test: silicone self-extinguished up to 21% O2 at 101.3 kPa. | silicone-1p5mm-moc-vs-pressure |
| - | data/passport.json test: black Kevlar/PBI webbing passed at 35% O2 at 56.5 kPa (8.2 psia). | kevlar-pbi-webbing-moc-8p2psia |
