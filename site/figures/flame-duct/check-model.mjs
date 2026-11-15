// node figures/flame-duct/check-model.mjs
// Fails when a number in model.json is not backed by the quote or conditions of the evidence id it cites.
import { MODEL } from "./data.mjs";
import { evidenceIds, normalise, regimeOf } from "./model.mjs";

const { evidence: ev, weightless: w, earth, bench } = MODEL;
const failures = [];
const expect = (label, ok) => {
  if (!ok) failures.push(label);
};
const quote = (id) => ev[id].quote;
const flowText = (id) => ev[id].conditions.flow_text;

expect("full_at_cm_s is the 10 cm/s of the ventilation quote", /\b10 cm\/s/.test(quote("qf-ventilation-speed-10cms")) && w.full_at_cm_s === 10);
expect("burn_from_cm_s is the low end of the 3 to 9 cm/s Mir flows", /3 to 9 cm\/s/.test(flowText("qf-mir-flow-stop-self-extinguish")) && w.burn_from_cm_s === 3);
expect("fan_cut_out_s is the 2 s of the flow-cut quote", /within 2 s/.test(quote("qf-bass2-flow-cut-flame-out-2s")) && w.fan_cut_out_s === 2);
expect("weightless oxygen is the 17.5 percent of the BASS-II quote", /17\.5 percent/.test(quote("qf-bass2-lower-oxygen-than-earth")) && bench.o2_pct["0g"] === 17.5);
expect("ground oxygen is the 19 percent of the BASS-II quote", /below 19 percent/.test(quote("qf-bass2-lower-oxygen-than-earth")) && bench.o2_pct["1g"] === 19);
expect("weightless stand-off is the 7 mm of the candle quote", /7 mm/.test(quote("qf-weightless-candle-standoff-7mm")) && w.standoff_mm === 7);
expect("Earth stand-off is the 1-2 mm of the candle quote", /1-2 mm/.test(quote("qf-weightless-candle-standoff-7mm")) && earth.standoff_mm[0] === 1 && earth.standoff_mm[1] === 2);
expect("quench ids describe the blue hemispherical flame", w.quench_ids.every((id) => /hemispherical blue flame/.test(quote(id))));
expect("Earth shape ids describe a flame that lifts and points upward", /point upward/.test(quote(earth.shape_ids[0])));
expect("every dial range holds the documented marks", bench.flow_range_cm_s.max > w.full_at_cm_s && bench.o2_range_pct.min < bench.o2_pct["0g"] && bench.o2_range_pct.max > bench.o2_pct["1g"]);

const state = (flow_cm_s, fan, gravity) => normalise(MODEL, { flow_cm_s, fan, gravity });
const regime = (...args) => regimeOf(MODEL, state(...args)).regime;
expect("fan off in weightlessness cuts the flame", regime(10, false, "0g") === "cut");
expect("below the Mir flows the flame quenches", regime(1.5, true, "0g") === "quench");
expect("at ventilation speed the flame burns at full vigour", regimeOf(MODEL, state(10, true, "0g")).vigour === 1);
expect("on Earth the fan does not decide", regime(0, false, "1g") === "earth" && regime(10, true, "1g") === "earth");
expect("every id a state reports exists", ["0g", "1g"].every((g) => [true, false].every((fan) => evidenceIds(MODEL, state(5, fan, g), "lit").every((id) => ev[id]))));
expect("a speed outside the dial is clamped", normalise(MODEL, { flow_cm_s: 999, fan: true, gravity: "0g" }).flow_cm_s === bench.flow_range_cm_s.max);

if (failures.length) {
  console.error(`model check failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("model check passed");
