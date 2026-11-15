// What stands in and around the duct: sample holder with its acrylic rod, igniter loop, camera, radiometer and the gauge console.
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { MODEL } from "./data.mjs";
import { needlePath } from "./dynamic.mjs";
import { AX, DIALS, DIAL_FACE_Y, DIAL_R, D, L, P, PANEL, R, ROD_R, S, X, at, ductFrame, faceFrame, postFrame } from "./world.mjs";

const TAU = Math.PI * 2;
export const RING_X = X.rodTip - 6.5;
export const RING_R = 6.6;
const COLLAR_TOP = AX + R + 4;

/** Post, gland collar, holder block and the rod. Lower and inside parts are returned apart so the glass can sit between. */
export function holder() {
  const x = X.post;
  const lower = [
    S(k.cylinder(x, 0, 9, 0, 4, P, 32, 0.4), { tone: "lo" }),
    S(k.cylinder(x, 0, 4.2, 4, AX - R - 4 - 4, P, 24), { tone: "mid", crease: "none" }),
    L(k.sideArc(x, 0, 4.2, 14, P, 14), { tone: "faint" }),
    S(G.disc(0, 6, 6.6, postFrame(x, 0, AX - R - 4), P), { tone: "mid" }),
    L(k.sideArc(x, 0, 6.6, AX - R - 1.6, P, 20), { tone: "faint" }),
  ];
  const inside = [S(G.disc(0, R - 4 - 0, 2.6, postFrame(x, 0, AX - R + 1), P), { tone: "mid" })];
  const blockPlan = { x: X.rodEnd - 5, y: -6, w: X.holderTo - X.rodEnd + 5, d: 12, r: 1.6 };
  inside.push(S(k.slabOf(blockPlan, AX - 6, 12, P, 3, 0.5), { tone: "mid" }));
  inside.push(D([at([blockPlan.x + blockPlan.w - 3, 3.4, AX + 6]), at([blockPlan.x + blockPlan.w - 3, -3.4, AX + 6])], { size: 0.45 }));
  inside.push(S(G.disc(0, 1.4, ROD_R + 1.6, ductFrame(blockPlan.x - 1.4), P), { tone: "lo" }));
  const screw = [blockPlan.x + blockPlan.w - 5, 0];
  inside.push(S(k.cylinder(screw[0], screw[1], 2.6, AX + 6, 2.4, P, 20), { tone: "mid" }));
  inside.push(L(k.knurl(screw[0], screw[1], 2.6, AX + 6, AX + 8.4, 14, P), { tone: "lo" }));
  return { lower: lower.join(""), inside: inside.join("") };
}

export function rod(lit = true) {
  const F = ductFrame(X.rodTip);
  const profile = [
    [0, ROD_R - 0.9],
    [0.7, ROD_R - 0.2],
    [1.4, ROD_R],
    [X.rodEnd - 5 - X.rodTip, ROD_R],
  ];
  const body = S(G.solidOf(profile, F, P), { tone: "hi", lit });
  const seams = [8, 20, 32].map((s) => G.arcOf(F, s, ROD_R, P, { steps: 12 })).join("");
  const edge = (angle, s) => at(G.pointOf(F, s, ROD_R - 0.3, angle));
  const glint = k.pathOf([edge(0.5, 3), edge(0.5, 38), edge(0.9, 38), edge(0.9, 3)], true);
  return body + L(seams, { tone: "faint" }) + `<path class="fd-glint" d="${glint}"/>`;
}

/** Igniter: a small wire loop just ahead of the rod tip and two legs that rise through a gland on the duct top. */
export function igniter() {
  const F = ductFrame(RING_X);
  const legTop = AX + R - 0.6;
  const ring = G.circleOf(F, 0, RING_R, P);
  const legs = [-1.6, 1.6].map((y) => {
    const z = AX + Math.sqrt(RING_R * RING_R - y * y);
    return k.segment([RING_X, y, z], [RING_X, y, legTop], P);
  });
  return `<g class="fd-igniter" data-part="igniter">${L(ring, { tone: "mid", className: "fd-wire" })}${legs.map((d) => L(d, { tone: "mid", className: "fd-wire" })).join("")}</g>`;
}

export function igniterGland() {
  const out = [S(G.disc(0, 5, 5.4, postFrame(RING_X, 0, AX + R - 1), P), { tone: "mid" })];
  out.push(S(G.disc(0, 5.4, 2.2, postFrame(RING_X, -1.6, AX + R + 4), P), { tone: "lo" }));
  out.push(S(G.disc(0, 5.4, 2.2, postFrame(RING_X, 1.6, AX + R + 4), P), { tone: "lo" }));
  out.push(D([at([RING_X, -1.6, COLLAR_TOP + 5.4]), at([RING_X, 1.6, COLLAR_TOP + 5.4])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

/** Camera on a post behind the duct, its lens aimed through the glass at the rod tip. */
export function camera() {
  const cx = X.rodTip - 4;
  const out = [];
  const foot = { x: cx - 16, y: -70, w: 32, d: 16, r: 2.4 };
  out.push(S(k.slabOf(foot, 0, 4, P, 3, 0.5), { tone: "lo" }));
  out.push(D(k.corners(foot, 3).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
  out.push(S(k.cylinder(cx, -62, 3.4, 4, AX - 14, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([20, 34].map((z) => k.sideArc(cx, -62, 3.4, z, P, 12)).join(""), { tone: "faint" }));
  const body = { x: cx - 14, y: -70, w: 28, d: 20, r: 2.6 };
  out.push(S(k.slabOf({ x: cx - 6, y: -66, w: 12, d: 8, r: 1.4 }, AX - 18, 9, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf(body, AX - 9, 18, P, 4, 0.7), { tone: "hi" }));
  out.push(L(k.sideSeam(body, AX + 0.5, P, 4), { tone: "faint" }));
  out.push(D([at([cx + 8, -70 + 3.4, AX + 9]), at([cx - 8, -70 + 3.4, AX + 9]), at([cx + 11, -70 + 4, AX + 9])], { size: 0.45 }));
  const F = faceFrame(cx, body.y + body.d, AX);
  out.push(S(G.solidOf([[0, 6.4], [4, 6.4], [4.8, 5.6], [10, 5.6]], F, P), { tone: "mid" }));
  out.push(S(G.disc(10, 11, 5.6, F, P), { tone: "lo" }));
  out.push(L(G.circleOf(F, 11, 3.6, P), { tone: "faint" }));
  out.push(L(G.circleOf(F, 11, 5.0, P), { tone: "lo" }));
  out.push(S(G.disc(11, 11.4, 3.3, F, P), { tone: "hi", lit: false }));
  out.push(L(G.arcOf(F, 6.5, 6.4, P, { steps: 16 }), { tone: "faint" }));
  return out.join("");
}

const lead = (points) => {
  const route = G.fillet(points, 5, 7).map(at);
  return k.wireSvg(route[0], route[route.length - 1], { via: route.slice(1, -1), tone: "mid", size: 1 });
};

/** Camera lead: from the camera body to a connector block on the base. */
export function cameraLead() {
  const cx = X.rodTip - 4;
  const block = { x: cx + 22, y: -68, w: 16, d: 9, r: 1.6 };
  const out = [S(k.slabOf(block, 0, 5, P, 3, 0.5), { tone: "mid" })];
  out.push(D([at([block.x + 3, block.y + 4.5, 5]), at([block.x + block.w - 3, block.y + 4.5, 5])], { size: 0.5, tone: "hi" }));
  out.push(lead([[cx + 14, -60, AX], [cx + 22, -60, AX - 2], [cx + 22, -62, 26], [block.x + 8, block.y + 4.5, 12], [block.x + 8, block.y + 4.5, 5]]));
  return out.join("");
}

/** Radiometer lead: from the rear of the sensor head to a jack on the console top. */
export function radiometerLead() {
  return lead([[62, 64.2, AX], [62, 70, AX - 4], [66, 72, 56], [74, 70, 46], [74, 58, PANEL.h]]);
}

/** Radiometer: a sensor head on a bracket over the console, window toward the flame. */
export function radiometer() {
  const px = 62;
  const topZ = PANEL.h;
  const out = [];
  out.push(S(k.cylinder(px, PANEL.y + 7, 2.6, topZ, AX - 8 - topZ, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: px - 5.5, y: PANEL.y + 1, w: 11, d: 12, r: 1.6 }, topZ, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: px - 4.5, y: PANEL.y + 3, w: 9, d: 9, r: 1.4 }, AX - 9, 3.4, P, 3), { tone: "mid" }));
  const F = G.frameOf([px, PANEL.y + 12, AX], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.solidOf([[0, 6], [18, 6], [19.6, 5.2], [22, 5.2]], F, P), { tone: "mid" }));
  out.push(L([4, 10, 15].map((s) => G.arcOf(F, s, 6, P, { steps: 14 })).join(""), { tone: "faint" }));
  out.push(S(G.disc(22, 24, 5.2, F, P), { tone: "lo" }));
  out.push(S(G.disc(24, 24.6, 3.6, F, P), { tone: "hi" }));
  out.push(L(G.circleOf(F, 24.6, 2, P), { tone: "faint" }));
  out.push(S(G.disc(-3, 0, 4.2, F, P), { tone: "lo" }));
  return out.join("");
}

const angleOf = (spec, value) => ((-135 + (270 * (value - spec.min)) / (spec.max - spec.min)) * Math.PI) / 180;
const onFace = (spec, r, a, lift = 0) => [spec.x + r * Math.sin(a), DIAL_FACE_Y + spec.depth + lift, spec.z + r * Math.cos(a)];
export const gaugeSpec = (spec) => ({ ...spec, y: DIAL_FACE_Y + spec.depth + 0.3, tail: -4, tip: DIAL_R - 3.6 });
export const GAUGES = {
  air: { ...DIALS.air, min: MODEL.bench.flow_range_cm_s.min, max: MODEL.bench.flow_range_cm_s.max, major: 10, minor: 2, depth: 6.4 },
  o2: { ...DIALS.o2, min: MODEL.bench.o2_range_pct.min, max: MODEL.bench.o2_range_pct.max, major: 5, minor: 1, depth: 6.4 },
};

function sector(spec, from, to, r0, r1, steps = 14) {
  const a0 = angleOf(spec, from);
  const a1 = angleOf(spec, to);
  const outer = Array.from({ length: steps + 1 }, (_, i) => onFace(spec, r1, a0 + ((a1 - a0) * i) / steps, 0.2));
  const inner = Array.from({ length: steps + 1 }, (_, i) => onFace(spec, r0, a1 - ((a1 - a0) * i) / steps, 0.2));
  return k.pathOf([...outer, ...inner].map(at), true);
}

function dialFace(spec, tag, unit) {
  const out = [];
  const F = faceFrame(spec.x, DIAL_FACE_Y, spec.z);
  out.push(S(G.disc(0, 4.6, DIAL_R + 1.4, F, P), { tone: "mid" }));
  out.push(S(G.ringBand(4.6, 6.6, DIAL_R - 2.6, DIAL_R + 1.4, F, P), { tone: "hi" }));
  out.push(S(G.disc(4.6, 5.4, DIAL_R - 2.6, F, P), { tone: "lo" }));
  const minor = [];
  const major = [];
  const count = (spec.max - spec.min) / spec.minor;
  for (let i = 0; i <= count; i++) {
    const value = spec.min + i * spec.minor;
    const big = Math.abs((value - spec.min) % spec.major) < 1e-9;
    const a = angleOf(spec, value);
    const from = onFace(spec, DIAL_R - 4.4 - (big ? 2.2 : 0), a);
    const to = onFace(spec, DIAL_R - 4.4 + 0.8, a);
    (big ? major : minor).push(k.segment(from, to, P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "hi" }));
  out.push(L(k.pathOf(Array.from({ length: 40 }, (_, i) => at(onFace(spec, DIAL_R - 4.4 + 0.8, angleOf(spec, spec.min) + (angleOf(spec, spec.max) - angleOf(spec, spec.min)) * (i / 39)))), false), { tone: "lo" }));
  out.push(`<g data-gauge="${tag}">${unit}</g>`);
  return out.join("");
}

function marks(spec, values) {
  return values
    .map((value) => {
      const a = angleOf(spec, value);
      const tip = onFace(spec, DIAL_R - 4.1, a, 0.2);
      const left = onFace(spec, DIAL_R - 8.6, a - 0.085, 0.2);
      const right = onFace(spec, DIAL_R - 8.6, a + 0.085, 0.2);
      return `<path class="fd-mark" d="${k.pathOf([tip, left, right].map(at), true)}"/>`;
    })
    .join("");
}

const face = (spec) => (text, dx, dz) => k.faceTextSvg(k.sideMatrix([spec.x + dx, DIAL_FACE_Y + spec.depth], spec.z + dz, P, "left"), text, { size: 2.7, tone: "mid", anchor: "middle" });

export function console_(initial) {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(PANEL, 0, PANEL.h, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(PANEL, 0, PANEL.h, P, 4, 0.9), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 2.2), PANEL.h, P, 4), { tone: "faint" }));
  out.push(D(k.corners(PANEL, 4.6).map(([x, y]) => at([x, y, PANEL.h])), { size: 0.45 }));
  const slots = [-6, -1, 4, 9].map((o) => k.lineOnTop([PANEL.x + 12, PANEL.y + PANEL.d / 2 + o * 0.5], [PANEL.x + 44, PANEL.y + PANEL.d / 2 + o * 0.5], PANEL.h, P));
  out.push(L(slots.join(""), { tone: "faint", free: true }));
  for (const [tag, spec, unit, hot] of [
    ["air", GAUGES.air, face(GAUGES.air)("cm/s", 0, -8.6), [[MODEL.weightless.burn_from_cm_s, MODEL.weightless.full_at_cm_s]]],
    ["o2", GAUGES.o2, face(GAUGES.o2)("O2", 0, -8.6), []],
  ]) {
    out.push(dialFace(spec, tag, unit));
    for (const [from, to] of hot) out.push(`<path class="fd-band" d="${sector(spec, from, to, DIAL_R - 7.4, DIAL_R - 5.4)}"/>`);
  }
  out.push(marks(GAUGES.o2, Object.values(MODEL.bench.o2_pct)));
  out.push(marks(GAUGES.air, [MODEL.weightless.full_at_cm_s]));
  for (const spec of Object.values(GAUGES)) {
    out.push(`<path class="iso-line" data-tone="lit" data-free="start" data-part="needle-${spec === GAUGES.air ? "air" : "o2"}" d="${needlePath(at, gaugeSpec(spec), initial[spec === GAUGES.air ? "air" : "o2"])}" style="stroke-width:1.1"/>`);
    out.push(S(G.disc(5.4, 7.8, 2.2, faceFrame(spec.x, DIAL_FACE_Y, spec.z), P), { tone: "mid" }));
  }
  return out.join("");
}
