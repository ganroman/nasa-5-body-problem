import { P, k, box, post, disc, line, dots, onFace, strokes, circle, roundRect } from "./draw.mjs";

const RAIL_FROM = 70;
const RAIL_LENGTH = 232;

// Cargo tie-down rails let in flush with the deck, with an anchor fitting every 29 units.
export function deckRails() {
  const out = [];
  for (const y of [92, 152]) {
    out.push(box(RAIL_FROM, y, 0, RAIL_LENGTH, 6, 1.2, { r: 1, steps: 2, tone: "lo", crease: "faint" }));
    out.push(line(k.planOutline({ x: RAIL_FROM + 3, y: y + 1.6, w: RAIL_LENGTH - 6, d: 2.8, r: 1.2 }, 1.2, P, 2), "mid"));
    const anchors = [];
    for (let x = RAIL_FROM + 14.5; x < RAIL_FROM + RAIL_LENGTH - 8; x += 29) anchors.push(x);
    for (const x of anchors) out.push(post(x, y + 3, 2.2, 1.2, 1.8, { steps: 14, tone: "mid" }));
    out.push(dots(anchors.map((x) => [x, y + 3, 3]), 0.5, "hi"));
  }
  return out.join("");
}

// An access hatch and an air return let into the deck at the open end of the bay.
export function deckPlates() {
  const hatch = { x: 128, y: 170, w: 40, d: 40, r: 2.4 };
  const out = [box(hatch.x, hatch.y, 0, hatch.w, hatch.d, 0.8, { r: hatch.r, steps: 3, tone: "lo", flat: true })];
  out.push(line(k.planOutline(k.insetPlan(hatch, 3), 0.8, P, 3) + k.planOutline({ x: hatch.x + 14, y: hatch.y + 16.5, w: 12, d: 7, r: 3 }, 0.8, P, 3), "faint"));
  out.push(dots([[132, 174, 0.8], [164, 174, 0.8], [132, 206, 0.8], [164, 206, 0.8]], 0.5, "mid"));
  const grille = { x: 232, y: 176, w: 36, d: 28, r: 2 };
  out.push(box(grille.x, grille.y, 0, grille.w, grille.d, 0.8, { r: grille.r, steps: 3, tone: "lo", flat: true }));
  const slots = [0, 1, 2, 3, 4].map((i) => k.planOutline({ x: grille.x + 4, y: grille.y + 4 + i * 4.4, w: grille.w - 8, d: 2, r: 1 }, 0.8, P, 2));
  out.push(line(slots.join("") + k.planOutline(k.insetPlan(grille, 2), 0.8, P, 3), "faint"));
  return out.join("");
}

// A fire extinguisher strapped to the hatch-end wall, above the rack and beside the mask hook.
export function extinguisher() {
  const [x, y, base] = [6.6, 148, 62];
  const out = [box(0, y - 5.4, base - 4, 3, 10.8, 46, { r: 1, steps: 2, tone: "lo" })];
  out.push(post(x, y, 5, base, 36, { steps: 28, tone: "hi", crease: "lo" }));
  out.push(line(k.sideArc(x, y, 5, base + 6, P, 16) + k.sideArc(x, y, 5, base + 28, P, 16), "faint"));
  for (const z of [base + 10, base + 24]) out.push(post(x, y, 5.5, z, 3, { steps: 28, tone: "mid" }));
  out.push(post(x, y, 3.4, base + 36, 3, { steps: 20, tone: "mid" }));
  out.push(box(x - 3.4, y - 3, base + 39, 9, 6, 5, { r: 1.2, steps: 3, bevel: 0.4, tone: "hi" }));
  out.push(box(x - 3.4, y - 1, base + 44, 11, 2, 1.8, { r: 0.6, steps: 2, tone: "mid" }));
  out.push(disc([x + 3.4, y - 6, base + 42], [0, 1, 0], 0, 3, 1.5, { tone: "mid" }));
  out.push(onFace("a", [x + 5.1, y, base + 18], circle(0, 0, 3.4, "iso-line", "lo") + strokes("M-2 0H2M0 -2V2", "faint")));
  return out.join("");
}

// A grab rail under the atmosphere panel.
export function handrail() {
  const out = [];
  for (const x of [16, 52, 88]) out.push(box(x, 0, 44, 3, 7, 5, { r: 0.8, steps: 2, tone: "lo" }));
  out.push(box(12, 5, 46, 84, 3, 3, { r: 1.4, steps: 3, bevel: 0.4 }));
  out.push(dots([[17.5, 7, 49], [53.5, 7, 49], [89.5, 7, 49]], 0.45, "mid"));
  return out.join("");
}

// A status lamp over the equipment lock.
export function hatchLamp() {
  const out = [box(0, 40, 123, 4, 26, 6.4, { r: 1.6, steps: 3, bevel: 0.4, tone: "hi", crease: "lo" })];
  out.push(onFace("a", [4, 53, 129.4], strokes(roundRect(-9.6, 1.2, 9.6, 5.2, 1.4), "faint") + circle(-5, 3.2, 1, "iso-line", "mid") + circle(0, 3.2, 1, "iso-line", "mid") + circle(5, 3.2, 1, "iso-line", "mid")));
  return out.join("");
}

// An emergency lamp above the locker.
export function lampBar() {
  const out = [box(264, 0, 108, 32, 3.4, 12, { r: 1.6, steps: 3, bevel: 0.5, tone: "hi", crease: "lo" })];
  out.push(onFace("b", [264, 3.4, 120], strokes(roundRect(2.4, 2.4, 29.6, 9.6, 1.6), "faint") + strokes("M6 6H26", "lo", ' data-free=""')));
  out.push(dots([[266.6, 3.4, 110.6], [293.4, 3.4, 110.6]], 0.5, "mid"));
  return out.join("");
}
