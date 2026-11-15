// Pure shape functions for everything that moves or changes shape: fan blades, needles, pointer, levers and the flame.
// Each takes a projection `proj([x, y, z]) -> [sx, sy]` and a plain config object, so build.mjs draws the first frame
// with them and figure.js redraws every later frame with the very same source.

const TAU = Math.PI * 2;
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const pathOf = (points, closed = true) => `M${points.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L")}${closed ? "Z" : ""}`;

export function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

export function bladesPath(proj, b, angle) {
  const parts = [];
  for (let i = 0; i < b.count; i++) {
    const a = angle + (i / b.count) * TAU;
    const at = (r, da) => proj([b.x, r * Math.cos(a + da), b.z + r * Math.sin(a + da)]);
    const tip = b.outer - 2.4;
    parts.push(pathOf([at(b.hub - 1, -0.16), at(14, -0.3), at(24, -0.2), at(tip, -0.02), at(tip, 0.24), at(24, 0.42), at(14, 0.4), at(b.hub - 1, 0.22)]));
  }
  return parts.join("");
}

const dialAngle = (g, value) => ((-135 + (270 * (value - g.min)) / (g.max - g.min)) * Math.PI) / 180;

export function needlePath(proj, g, value) {
  const a = dialAngle(g, value);
  const at = (r) => proj([g.x + r * Math.sin(a), g.y, g.z + r * Math.cos(a)]);
  return pathOf([at(g.tail), at(g.tip)], false);
}

export const leverTip = (proj, lv, lean) => proj([lv.x + lean * lv.lean, lv.y, lv.z + lv.rise * (1 - 0.18 * Math.abs(lean))]);

export function leverPath(proj, lv, lean) {
  return pathOf([proj([lv.x, lv.y, lv.z]), leverTip(proj, lv, lean)], false);
}

export function pointerPath(proj, kn, share) {
  const a = kn.from + share * kn.span;
  const sx = Math.sin(a);
  const sy = -Math.cos(a);
  return pathOf([proj([kn.x + sx * kn.r0, kn.y + sy * kn.r0, kn.z]), proj([kn.x + sx * kn.r1, kn.y + sy * kn.r1, kn.z])], false);
}

const revolve = (proj, makers, steps) => {
  const points = [];
  for (const make of makers) for (let j = 0; j < steps; j++) points.push(proj(make((j / steps) * TAU)));
  return hull(points);
};

/**
 * Flame layers as screen paths. `f` holds the drawing numbers (cfg.flame) and the moment:
 * kind "dome" (weightless) or "teardrop" (Earth), size 0..1, wobble -1..1, sway -1..1.
 */
export function flameShapes(proj, f) {
  return f.kind === "teardrop" ? teardrop(proj, f) : dome(proj, f);
}

function dome(proj, f) {
  const size = Math.max(0, Math.min(1, f.size));
  const R0 = (f.r_min + (f.r_max - f.r_min) * size) * (1 + 0.07 * f.wobble);
  const standoff = f.standoff_min + (f.standoff_max - f.standoff_min) * size;
  const tail = f.tail_min + (f.tail_max - f.tail_min) * size;
  const apex = f.x - standoff;
  const build = (scale, grow, stretch) => {
    const rows = [];
    const cap = R0 * scale;
    const length = cap + tail * stretch;
    const centre = (s, r) => (angle) => [apex + (standoff * (1 - scale) + s) * 1, r * Math.cos(angle), f.z + r * Math.sin(angle)];
    for (let i = 0; i <= 14; i++) {
      const s = (i / 14) * cap * grow;
      const u = (cap - s) / cap;
      rows.push(centre(s, cap * Math.sqrt(Math.max(0, 1 - u * u))));
    }
    for (let i = 1; i <= 12; i++) {
      const u = i / 12;
      rows.push(centre(cap + u * (length - cap), cap * Math.pow(1 - Math.pow(u, 2.1), 0.75)));
    }
    return revolve(proj, rows, 26);
  };
  const outer = build(1, 1, 1);
  const inner = build(0.66, 1, 0.78);
  const core = build(0.3, 1, 0.5);
  const glow = build(1.9, 1, 1.3);
  const base = proj([f.x, 0, f.z]);
  return { glow: pathOf(glow), shell: pathOf(outer), inner: pathOf(inner), core: pathOf(core), anchor: base };
}

function teardrop(proj, f) {
  const size = Math.max(0, Math.min(1, f.size));
  const R1 = f.tear_r * (0.7 + 0.3 * size);
  const H = f.tear_h * (0.55 + 0.45 * size) * (1 + 0.1 * f.wobble);
  const z0 = f.z + f.rod_r + f.tear_gap;
  const build = (scale, tall) => {
    const rows = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const r = R1 * scale * 2.9 * Math.sqrt(u) * Math.pow(1 - u, 1.3);
      const sway = f.sway * 3.2 * u * u * scale;
      rows.push((angle) => [f.x + 2 + sway + r * Math.cos(angle), r * Math.sin(angle), z0 + u * H * tall]);
    }
    return revolve(proj, rows, 22);
  };
  return { glow: pathOf(build(1.8, 1.15)), shell: pathOf(build(1, 1)), inner: pathOf(build(0.62, 0.8)), core: pathOf(build(0.28, 0.4)), anchor: proj([f.x, 0, z0]) };
}
