// The bench: base plate on feet, ruler strip, control box with the speed knob and fan switch, gravity switch box.
import * as k from "../kit/iso-kit.mjs";
import { D, FOOT_H, L, P, PLATE, PLATE_H, S, at, byDepth } from "./world.mjs";

export const CTRL = { x: -178, y: 42, w: 46, d: 26, r: 3, h: 16 };
export const KNOB_AT = [-166, 55];
export const KNOB_TOP = CTRL.h + 9;
export const FAN_SWITCH = [-139, 55];
export const GSW = { x: -112, y: 44, w: 46, d: 22, r: 3, h: 12 };
export const GSW_AT = [-89, 55];
export const GSW_LAMPS = { "0g": [-102, 62], "1g": [-76, 62] };
export const LEVER = { rise: 11, lean: 5.5 };

export function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -150, y: PLATE.y + PLATE.d - 13, w: 300, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [1.8, 3.2], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  return out.join("");
}

/** Cable clips and a plug on the base, so the two leads have somewhere to end. */
export function sockets() {
  const out = [];
  const plan = { x: 108, y: 34, w: 30, d: 14, r: 2 };
  out.push(S(k.slabOf(plan, 0, 7, P, 3, 0.5), { tone: "mid" }));
  const holes = [118, 128].map((x) => [x, plan.y + plan.d / 2]);
  out.push(L(holes.map(([x, y]) => k.ring(x, y, 2.6, 7, P, 16)).join(""), { tone: "lo" }));
  out.push(D(holes.map(([x, y]) => at([x, y, 7])), { size: 0.55, tone: "hi" }));
  out.push(D([at([plan.x + 3, plan.y + 3, 7]), at([plan.x + plan.w - 3, plan.y + 3, 7])], { size: 0.4 }));
  return out.join("");
}

/** Label plate with three rule lines that stand for printed text. */
export function labelPlate() {
  const plan = { x: 106, y: 49, w: 44, d: 9, r: 1.4 };
  const out = [S(k.slabOf(plan, 0, 0.8, P, 3), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(plan, 1.4), 0.8, P, 3), { tone: "faint" }));
  for (const [i, length] of [[0, 30], [1, 22], [2, 26]]) out.push(L(k.lineOnTop([plan.x + 5, plan.y + 2.6 + i * 1.7], [plan.x + 5 + length, plan.y + 2.6 + i * 1.7], 0.8, P), { tone: "lo", free: true }));
  out.push(D([at([plan.x + 2.4, plan.y + 2.4, 0.8]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.8])], { size: 0.42 }));
  return out.join("");
}

function box(plan) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, plan.h, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(plan, 0, plan.h, P, 4, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 2.6), plan.h, P, 4), { tone: "faint" }));
  const screws = k.corners(plan, 5.4).map(([x, y]) => at([x, y, plan.h]));
  out.push(D(screws, { size: 0.45 }));
  return out.join("");
}

/** Control box at the inlet: the speed knob, its scale and the fan switch. The knob pointer is drawn by `knobPointer`. */
export function controls() {
  const out = [box(CTRL)];
  const [kx, ky] = KNOB_AT;
  out.push(S(k.cylinder(kx, ky, 10.6, CTRL.h, 1.2, P, 40), { tone: "lo" }));
  const ticks = k.radialTicks(kx, ky, 10.2, 18, 3, CTRL.h + 1.2, [1.2, 2.4], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(S(k.cylinder(kx, ky, 7, CTRL.h + 1.2, KNOB_TOP - CTRL.h - 1.2, P, 36, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(kx, ky, 7, CTRL.h + 1.2, KNOB_TOP, 40, P), { tone: "lo" }));
  out.push(L(k.ring(kx, ky, 4.6, KNOB_TOP, P, 28), { tone: "faint" }));
  const [sx, sy] = FAN_SWITCH;
  out.push(S(k.cylinder(sx, sy, 5.4, CTRL.h, 1.4, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(sx, sy, 3.2, CTRL.h + 1.4, 2.2, P, 24), { tone: "mid" }));
  out.push(D([at([sx - 8.4, sy - 6, CTRL.h]), at([sx + 8.4, sy - 6, CTRL.h])], { size: 0.45 }));
  return out.join("");
}

export function gravityBox() {
  const out = [box(GSW)];
  const [sx, sy] = GSW_AT;
  out.push(S(k.slabOf({ x: sx - 12, y: sy - 5, w: 24, d: 10, r: 2.4 }, GSW.h, 1.2, P, 4), { tone: "lo" }));
  out.push(S(k.cylinder(sx, sy, 3.2, GSW.h + 1.2, 2.2, P, 24), { tone: "mid" }));
  out.push(D([at([sx - 12, sy, GSW.h + 1.2]), at([sx + 12, sy, GSW.h + 1.2])], { size: 0.5, tone: "mid" }));
  for (const [id, text] of [["0g", "0 g"], ["1g", "1 g"]]) {
    const [x, y] = GSW_LAMPS[id];
    out.push(k.faceTextSvg(k.topMatrix([x - 2.6, y + 4.6], GSW.h, P, "x"), text, { size: 2.6, tone: "mid" }));
  }
  return out.join("");
}
