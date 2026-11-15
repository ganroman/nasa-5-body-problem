import { DOOR } from "./world.mjs";
import { P, k, box, disc, line, dots, onFace, strokes, roundRect } from "./draw.mjs";

function cabinet() {
  const out = [box(260, 0, 0, 82, 48, 6, { r: 1.5, bevel: 0.6, tone: "lo" })];
  out.push(box(262, 0, 6, 78, 46, 2, { r: 0.6, steps: 2, tone: "lo" }));
  out.push(box(304, 8, 8, 32, 36, 2, { r: 2, steps: 3, tone: "lo", crease: "faint" }));
  out.push(line(k.planOutline({ x: 305.4, y: 24.8, w: 25.2, d: 16.4, r: 3.4 }, 10, P, 3), "faint"));
  const pegs = [];
  for (let x = 308; x <= 334; x += 5.2) for (let z = 16; z <= 84; z += 7) pegs.push([x, 0.2, z]);
  out.push(dots(pegs, 0.4, "lo"));
  out.push(box(306, 2, 60, 30, 1.6, 3, { r: 0.6, steps: 2, tone: "lo" }));
  out.push(dots([[311, 3.6, 61.5], [319, 3.6, 61.5], [327, 3.6, 61.5]], 0.6, "hi"));
  out.push(box(304, 2, 52, 33, 42, 2, { r: 0.8, steps: 2, tone: "lo" }));
  out.push(box(262, 0, 8, 4, 46, 82, { r: 0.8, steps: 2 }));
  out.push(box(300, 0, 8, 4, 46, 82, { r: 0.8, steps: 2 }));
  const slots = [];
  for (let v = 12; v <= 72; v += 12) slots.push(roundRect(33, v, 39, v + 2.6, 1.1));
  out.push(onFace("a", [304, 46, 88], strokes(roundRect(31, 6, 41, 78, 1.6), "lo") + strokes(slots.join(""), "faint")));
  out.push(box(337, 0, 8, 3, 46, 82, { r: 0.8, steps: 2 }));
  out.push(box(266, 44, 10, 34, 2, 76, { r: 1, steps: 2, tone: "hi", crease: "lo" }));
  const vents = [];
  for (let i = 0; i < 4; i++) vents.push(roundRect(6, 6 + i * 4.2, 28, 7.8 + i * 4.2, 0.8));
  out.push(onFace("b", [266, 46, 86], strokes(vents.join(""), "lo") + strokes(roundRect(2.4, 2.4, 31.6, 73.6, 1.6), "faint")));
  out.push(box(272, 46, 30, 22, 0.8, 12, { r: 1, steps: 2, tone: "lo", crease: "none" }));
  out.push(onFace("b", [276, 46.8, 40], ["M0 0H14", "M0 2.4H9", "M0 4.8H12"].map((d) => strokes(d, "lo", ' data-free=""')).join("")));
  out.push(dots([[270, 46, 26], [296, 46, 26]], 0.5, "mid"));
  const lid = { x: 260, y: 0, w: 82, d: 48, r: 1.5 };
  out.push(box(lid.x, 0, 90, lid.w, lid.d, 6, { r: 1.5, bevel: 0.6 }));
  out.push(line(k.planOutline(k.insetPlan(lid, 4), 96, P, 3), "faint"));
  const louvres = [0, 1, 2, 3].map((i) => k.planOutline({ x: 272 + i * 14, y: 10, w: 8, d: 2.4, r: 1.1 }, 96, P, 2));
  out.push(line(louvres.join(""), "lo"));
  out.push(dots([[264, 4, 96], [338, 4, 96], [264, 44, 96], [338, 44, 96]], 0.5, "mid"));
  out.push(box(262, 46, 86, 78, 4, 4, { r: 0.8, steps: 2, tone: "lo" }));
  out.push(dots([[266, 50, 88], [336, 50, 88]], 0.5, "mid"));
  return out.join("");
}

function door() {
  const out = [box(303, 47, 9, 34, 2.4, 77, { r: 1.6, bevel: 0.5, tone: "hi", crease: "lo" })];
  out.push(box(307, 47.4, 84, 5, 2, 3.6, { r: 0.6, steps: 2, tone: "lo" }), box(327, 47.4, 84, 5, 2, 3.6, { r: 0.6, steps: 2, tone: "lo" }));
  out.push(onFace("b", [303, 49.4, 86], strokes(roundRect(3, 5, 31, 74, 2), "faint") + strokes(roundRect(4.6, 28, 8.4, 46, 1.6), "lo")));
  out.push(box(305.4, 49.4, 40, 3, 2.4, 20, { r: 1, steps: 2 }));
  out.push(disc([320, 49.4, 58], [0, 1, 0], 0, 2, 2.6, { tone: "hi", crease: "lo" }));
  out.push(onFace("b", [320, 51.4, 58], strokes("M-1.8 0H1.8", "mid")));
  return `<g class="locker-door" data-door data-slide="${DOOR.slide}">${out.join("")}</g>`;
}

export function locker() {
  return { back: cabinet(), front: door() };
}
