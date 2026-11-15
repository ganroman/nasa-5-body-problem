// Pure rules of the flame duct figure. All numbers come from model.json.
// Node tests import this file; build.mjs inlines it into figure.js, so keep it free of imports.

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const smoothstep = (t) => t * t * (3 - 2 * t);

export function parseModel(raw) {
  const ids = new Set(Object.keys(raw.evidence));
  const cited = [
    ...raw.bench.o2_ids,
    ...raw.flow_points.flatMap((point) => point.ids),
    ...raw.weightless.fan_cut_ids,
    ...raw.weightless.standoff_ids,
    ...raw.weightless.quench_ids,
    ...raw.earth.standoff_ids,
    ...raw.earth.shape_ids,
    ...raw.earth.air_ids,
  ];
  const missing = cited.filter((id) => !ids.has(id));
  if (missing.length) throw new Error(`model.json cites evidence ids it does not hold: ${missing.join(", ")}`);
  const { burn_from_cm_s: from, full_at_cm_s: full } = raw.weightless;
  if (!(from < full)) throw new Error("model.json: burn_from_cm_s must be below full_at_cm_s");
  return raw;
}

export function normalise(model, state) {
  const { min, max } = model.bench.flow_range_cm_s;
  const flow = Number.isFinite(state.flow_cm_s) ? clamp(state.flow_cm_s, min, max) : min;
  return { flow_cm_s: flow, fan: Boolean(state.fan), gravity: state.gravity === "1g" ? "1g" : "0g" };
}

export function vigourAt(model, flow_cm_s) {
  const { burn_from_cm_s: from, full_at_cm_s: full } = model.weightless;
  return smoothstep(clamp((flow_cm_s - from) / (full - from), 0, 1));
}

/** What the model asks of the flame for a state: where it wants to be, before any dwell time. */
export function regimeOf(model, state) {
  if (state.gravity === "1g") return { regime: "earth", vigour: 1 };
  if (!state.fan) return { regime: "cut", vigour: 0 };
  if (state.flow_cm_s < model.weightless.burn_from_cm_s) return { regime: "quench", vigour: 0 };
  return { regime: "burn", vigour: vigourAt(model, state.flow_cm_s) };
}

export const o2Of = (model, gravity) => model.bench.o2_pct[gravity];

export function airOf(state) {
  return state.fan ? state.flow_cm_s : 0;
}

const FLAME_WORDS = {
  lit: (gravity, vigour) => (gravity === "1g" ? "tall yellow teardrop, rising" : vigour < 0.34 ? "small pale-blue dome" : vigour < 0.8 ? "blue dome, leaning with the air" : "fuller blue dome, leaning with the air"),
  quench: () => "small blue dome, close to going out",
  dying: () => "going out",
  out: () => "out",
  lighting: () => "igniter glowing",
};

export function flameWords(phase, gravity, vigour) {
  return FLAME_WORDS[phase](gravity, vigour);
}

/** Evidence ids behind what the figure shows for a state and flame phase. */
export function evidenceIds(model, state, phase) {
  const ids = new Set(model.bench.o2_ids);
  if (state.gravity === "1g") {
    for (const id of [...model.earth.shape_ids, ...model.earth.air_ids, ...model.earth.standoff_ids]) ids.add(id);
    return [...ids];
  }
  for (const id of model.weightless.standoff_ids) ids.add(id);
  if (!state.fan || phase === "dying") for (const id of model.weightless.fan_cut_ids) ids.add(id);
  if (phase === "quench") for (const id of model.weightless.quench_ids) ids.add(id);
  const nearest = [...model.flow_points].reverse().find((point) => state.flow_cm_s >= point.flow_cm_s && state.fan);
  if (nearest && phase !== "out") for (const id of nearest.ids) ids.add(id);
  return [...ids];
}
