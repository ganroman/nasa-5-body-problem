// The duct: glass test section, straightener, exit screen, clamps, pedestals and the inlet fan.
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { bladesPath } from "./dynamic.mjs";
import { AX, D, L, P, R, S, WALL, X, at, ductFrame } from "./world.mjs";

const LEN = X.ductTo - X.ductFrom;
const band = (s0, s1, rIn, rOut, F) => G.ringBand(s0, s1, rIn, rOut, F, P, { hole: [s0, rIn] });
const path = (list, closed = false) => k.pathOf(list.map(at), closed);

export const PEDESTALS = [-72, 80];
export const CLAMPS = [-86, 40, 74];

/** Glass section, drawn as translucent layers around the parts inside it. */
export function glass() {
  const F = ductFrame(X.ductFrom);
  const hull = G.outlineOf([[0, R], [LEN, R]], F, P, { fill: "hull" }).fill;
  const sides = G.silhouetteOf([[0, R], [LEN, R]], F, P);
  const rings = [0, LEN].map((s) => [G.circleOf(F, s, R, P), G.circleOf(F, s, R - WALL, P)]);
  const back = `<path class="fd-glass-back" d="${hull}"/><path class="iso-line" data-tone="faint" d="${rings[0][1]}${rings[1][1]}"/>`;
  const glints = [0.62, 1.9].map((angle) => glint(F, angle, 5, LEN - 5, 3.6)).join("");
  const front = `<path class="fd-glass" d="${hull}"/>${glints}${L(sides, { tone: "mid" })}${L(rings[0].join("") + rings[1].join(""), { tone: "mid" })}`;
  return { back, front };
}

function glint(F, angle, s0, s1, width) {
  const half = width / (2 * R);
  const edge = (a, s) => at(G.pointOf(F, s, R - 0.4, a));
  const poly = [edge(angle - half, s0), edge(angle - half, s1), edge(angle + half, s1), edge(angle + half, s0)];
  return `<path class="fd-glint" d="${k.pathOf(poly, true)}"/>`;
}

export function clamps() {
  const out = [];
  for (const x of CLAMPS) {
    const F = ductFrame(x);
    out.push(S(band(0, 7, R + 0.2, R + 3.4, F), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x + 1, y: -4.5, w: 5, d: 9, r: 1 }, AX + R + 2.6, 4.4, P, 3, 0.4), { tone: "mid" }));
    out.push(D([at([x + 3.5, -2, AX + R + 7]), at([x + 3.5, 2, AX + R + 7])], { size: 0.45 }));
  }
  return out.join("");
}

export function pedestals() {
  const out = [];
  for (const x of PEDESTALS) {
    const plan = { x: x - 9, y: -22, w: 18, d: 44, r: 2.4 };
    out.push(`<path class="iso-halo" d="${k.haloOf(plan, 0, AX - R - 5, P)}" style="filter:blur(4px)"/>`);
    out.push(S(k.slabOf(plan, 0, AX - R - 5, P, 4, 0.7), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x - 10, y: -22, w: 20, d: 44, r: 2.4 }, AX - R - 5, 3, P, 4, 0.5), { tone: "mid" }));
    out.push(D([at([x - 5, -17, AX - R - 2]), at([x + 5, -17, AX - R - 2]), at([x - 5, 17, AX - R - 2]), at([x + 5, 17, AX - R - 2])], { size: 0.45 }));
  }
  return out.join("");
}

const hexPoints = (cy, cz, h, x) => Array.from({ length: 6 }, (_, i) => [x, cy + h * Math.cos((i * Math.PI) / 3 + Math.PI / 6), AX + cz + h * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);

/** Flow straightener: a honeycomb block across the duct, seen on its inlet face. */
export function straightener() {
  const [x0, x1] = X.honey;
  const F = ductFrame(x0);
  const out = [S(G.disc(0, x1 - x0, R - WALL - 0.4, F, P), { tone: "mid" })];
  const h = 3.7;
  const cells = [];
  for (let row = -8; row <= 8; row++) {
    for (let col = -8; col <= 8; col++) {
      const cy = col * h * Math.sqrt(3) + (row % 2) * h * Math.sqrt(3) * 0.5;
      const cz = row * h * 1.5;
      if (Math.hypot(cy, cz) + h < R - WALL - 2.4) cells.push(path(hexPoints(cy, cz, h * 0.86, x0), true));
    }
  }
  out.push(L(G.circleOf(F, 0, R - WALL - 2.2, P), { tone: "lo" }));
  out.push(L(cells.join(""), { tone: "lo" }));
  return out.join("");
}

/** Exit screen: a mesh disc across the far end and the end collar that holds it. */
export function exitScreen() {
  const F = ductFrame(X.ductTo - 8);
  const out = [S(G.disc(0, 2.2, R - WALL - 0.4, F, P), { tone: "lo" })];
  const dots = [];
  for (let y = -26; y <= 26; y += 4.2) for (let z = -26; z <= 26; z += 4.2) if (Math.hypot(y, z) < R - WALL - 3.6) dots.push(at([X.ductTo - 8, y, AX + z]));
  out.push(L(G.circleOf(F, 0, R - WALL - 2.2, P), { tone: "lo" }));
  out.push(D(dots, { size: 0.55, tone: "mid" }));
  return out.join("");
}

export function exitCollar() {
  const F = ductFrame(X.ductTo);
  const out = [S(band(0, 7, R - 0.4, R + 5, F), { tone: "mid" })];
  out.push(S(band(7, X.exitTo - X.ductTo, R + 0.4, R + 2.6, F), { tone: "mid" }));
  const bolts = Array.from({ length: 10 }, (_, i) => at(G.pointOf(F, 0, R + 2.8, (i / 10) * Math.PI * 2 + 0.3)));
  out.push(D(bolts, { size: 0.42 }));
  return out.join("");
}

/** Three streamlines drawn inside the glass; the live script sets their speed and strength from the air speed. */
export function streams() {
  const lines = [[0, 17], [0, -17], [-17, 0]].map(([y, z]) => L(k.segment([X.honey[1] + 3, y, AX + z], [X.ductTo - 12, y, AX + z], P), { tone: "mid", flow: true, free: true, className: "fd-stream" }));
  return `<g class="fd-streams" data-part="streams">${lines.join("")}</g>`;
}

/** Rubber coupling from the fan shroud to the glass section, with a flange at the glass end. */
export function neck() {
  const F = ductFrame(X.fanTo);
  const flange = ductFrame(X.neck - 5);
  return [
    S(band(0, X.neck - X.fanTo - 5, R + 0.6, R + 3.2, F), { tone: "lo" }),
    S(band(0, 5, R - 0.4, R + 5.4, flange), { tone: "mid" }),
    D(Array.from({ length: 12 }, (_, i) => at(G.pointOf(flange, 0, R + 3, (i / 12) * Math.PI * 2))), { size: 0.42 }),
  ].join("");
}

export const BLADES = 7;
export const FAN_X = X.fanFrom + 11;
export const HUB_R = 8.5;
export const SHROUD_R = 33;

export function fan() {
  const F = ductFrame(X.fanFrom);
  const out = [];
  out.push(S(band(0, X.fanTo - X.fanFrom, SHROUD_R - 3, SHROUD_R, F), { tone: "mid" }));
  out.push(S(band(-3, 3, SHROUD_R - 3, SHROUD_R + 3.4, F), { tone: "mid" }));
  const inner = [];
  inner.push(S(G.disc(19, 21, SHROUD_R - 3.2, F, P), { tone: "lo" }));
  inner.push(S(G.disc(8, 21, HUB_R, F, P), { tone: "hi" }));
  inner.push(`<path class="fd-blades" data-part="blades" d="${bladesPath(at, { x: FAN_X, z: AX, hub: HUB_R, outer: SHROUD_R, count: BLADES }, 0)}"/>`);
  inner.push(S(G.disc(5.4, 8, 3.6, F, P), { tone: "mid" }));
  inner.push(L(G.circleOf(F, 2.2, SHROUD_R - 3.6, P), { tone: "mid" }));
  inner.push(L(G.circleOf(F, 2.2, 20, P), { tone: "lo" }));
  inner.push(L(G.circleOf(F, 2.2, 10.4, P), { tone: "lo" }));
  inner.push(L(G.spokesOf(F, 2.2, 10.4, SHROUD_R - 3.6, 8, P, { phase: 0.2 }), { tone: "lo" }));
  inner.push(S(G.disc(2.2, 4.2, 4.2, F, P), { tone: "hi" }));
  out.push(`<clipPath id="fd-mouth"><path d="${G.circleOf(F, 0, SHROUD_R - 3, P)}"/></clipPath><g clip-path="url(#fd-mouth)">${inner.join("")}</g>`);
  out.push(D(Array.from({ length: 12 }, (_, i) => at(G.pointOf(F, -3, SHROUD_R + 1.4, (i / 12) * Math.PI * 2 + 0.26))), { size: 0.42 }));
  return out.join("");
}

export function fanStand() {
  const x = X.fanFrom + 14;
  const plan = { x: x - 11, y: -24, w: 22, d: 48, r: 2.6 };
  return [
    `<path class="iso-halo" d="${k.haloOf(plan, 0, AX - SHROUD_R - 2, P)}" style="filter:blur(4px)"/>`,
    S(k.slabOf(plan, 0, AX - SHROUD_R - 2, P, 4, 0.7), { tone: "mid" }),
    D([at([x - 6, -18, AX - SHROUD_R - 2]), at([x + 6, -18, AX - SHROUD_R - 2]), at([x - 6, 18, AX - SHROUD_R - 2]), at([x + 6, 18, AX - SHROUD_R - 2])], { size: 0.45 }),
  ].join("");
}

