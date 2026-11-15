import { BAY, PLACES, PARKED } from "./world.mjs";
import { k, P, box, line, dots, byDepth } from "./draw.mjs";

const { x: X, y: Y, h: H, wall: T } = BAY;
const DECK = { x: -T, y: -T, w: X + T + 4, d: Y + T + 4, r: 4 };
const TILE = 44;

export function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(DECK, -17, 10, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(DECK, 18).map(([cx, cy]) => [cx, cy, 0]))) {
    out.push(k.solidSvg(k.cylinder(x, y, 7, -17, 1.6, P, 24), { tone: "lo" }));
    out.push(k.solidSvg(k.cylinder(x, y, 5.4, -15.4, 5.4, P, 24), { tone: "mid" }));
  }
  out.push(k.solidSvg(k.slabOf(DECK, -10, 10, P, 6, 1.2), { tone: "lo" }));
  out.push(line(k.planOutline(k.insetPlan(DECK, 3), 0, P, 6), "faint"));
  const tiles = [];
  const screws = [];
  for (let x = 0; x < X; x += TILE) {
    for (let y = 0; y < Y; y += TILE) {
      tiles.push(k.planOutline(k.insetPlan({ x, y, w: TILE, d: TILE, r: 2 }, 1.2), 0, P, 2));
      screws.push([x + 4.2, y + 4.2, 0], [x + TILE - 4.2, y + TILE - 4.2, 0]);
    }
  }
  out.push(line(tiles.join(""), "faint"), dots(screws, 0.4, "lo"));
  return out.join("");
}

export function zones() {
  return PLACES.map(({ id, zone }) => {
    const tape = k.planOutline(zone, 0.05, P, 3) + k.planOutline(k.insetPlan(zone, 2.4), 0.05, P, 3);
    return `<g class="zone" data-zone="${id}">${line(tape, "lo")}</g>`;
  }).join("");
}

export function parkedMat() {
  const [x, y] = PARKED.spot;
  const plan = { x: x - PARKED.size / 2, y: y - PARKED.size / 2 + 4, w: PARKED.size, d: PARKED.size - 8, r: 2 };
  return `<g class="parked-mat">${line(k.planOutline(plan, 0.05, P, 3), "lo")}${line(k.planOutline(k.insetPlan(plan, 2.4), 0.05, P, 3), "faint")}</g>`;
}

export function walls() {
  const out = [];
  out.push(box(-T, -T, 0, T, Y + T, H, { tone: "lo", steps: 2, r: 0 }));
  out.push(box(0, -T, 0, X, T, H, { tone: "lo", steps: 2, r: 0 }));
  const seams = [];
  for (const y of [100, 146, 198]) seams.push(k.segment([0, y, 0], [0, y, H], P));
  for (const x of [106, 198, 260]) seams.push(k.segment([x, 0, 0], [x, 0, H], P));
  const belt = (z) => [
    k.segment([-T, Y, z], [0, Y, z], P) + k.segment([0, Y, z], [0, 0, z], P) + k.segment([0, 0, z], [X, 0, z], P) + k.segment([X, 0, z], [X, -T, z], P),
  ];
  out.push(line([...seams, ...belt(30), ...belt(6)].join(""), "faint"));
  out.push(box(-T - 1, -T - 1, H, T + 2, Y + T + 2, 2.5, { tone: "mid", steps: 2, bevel: 0.5 }));
  out.push(box(1, -T - 1, H, X, T + 2, 2.5, { tone: "mid", steps: 2, bevel: 0.5 }));
  out.push(box(-T, -T, 0, T + 6, T + 6, H + 2.5, { tone: "mid", steps: 2, r: 1.5, bevel: 0.6, inner: "" }));
  const rings = [30, 76, 122].map((z) => k.sideSeam({ x: -T, y: -T, w: T + 6, d: T + 6, r: 1.5 }, z, P, 2));
  out.push(line(rings.join(""), "faint"));
  return out.join("");
}

export function ceilingRun() {
  const out = [box(6, 0, 134, X - 6, 12, 13, { tone: "mid", steps: 2, bevel: 0.6 })];
  const joints = [];
  for (let x = 64; x < X - 6; x += 58) joints.push(k.segment([x, 12, 134], [x, 12, 147], P));
  out.push(line(joints.join(""), "faint"));
  for (const x of [34, 150, 280]) out.push(box(x, 0, 133, 4, 13.6, 15, { tone: "lo", steps: 2 }));
  out.push(dots([34, 150, 280].map((x) => [x + 2, 13.6, 140.5]), 0.5, "mid"));
  return out.join("");
}
