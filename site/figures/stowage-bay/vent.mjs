import { P, k, box, post, line, dots, onFace, strokes, roundRect, circle } from "./draw.mjs";

const COLUMN = { x: 112, y: 0, w: 60, d: 30, r: 1.5 };

function column() {
  const seams = [60, 92].map((z) => line(k.sideSeam(COLUMN, z, P, 3), "faint")).join("");
  const out = [box(109, 0, 0, 66, 33, 6, { r: 1.5, bevel: 0.6, tone: "lo" })];
  out.push(box(COLUMN.x, 0, 6, COLUMN.w, COLUMN.d, 128, { r: COLUMN.r, bevel: 0.6, inner: seams }));
  return out.join("");
}

function accessPanel() {
  const hinges = [10, 30].map((v) => box(172, 28 - 9, 6 + 128 - v - 6, 1, 2.6, 6, { r: 0.4, steps: 2, tone: "lo" }));
  const plate = onFace("a", [172, 14, 100], strokes(roundRect(-10, -26, 10, 26, 1.6), "lo") + strokes(roundRect(-8, -24, 8, 24, 1), "faint") + circle(5.6, 0, 1.2, "iso-line", "mid") + strokes("M5.6 -5V5", "mid"));
  return hinges.join("") + plate + dots([[172, 4.6, 76], [172, 23.4, 76], [172, 4.6, 124], [172, 23.4, 124]], 0.5, "mid");
}

function diffuser() {
  const out = [box(120, 30, 94, 44, 2.4, 36, { r: 1.5, steps: 2, bevel: 0.4, tone: "hi" })];
  const slots = [];
  for (let i = 0; i < 6; i++) slots.push(roundRect(5, 5 + i * 5, 39, 7.6 + i * 5, 1.2));
  out.push(onFace("b", [120, 32.4, 130], strokes(roundRect(2.4, 2.4, 41.6, 33.6, 1.8), "faint") + strokes(slots.join(""), "lo")));
  out.push(dots([[123, 33, 97], [161, 33, 97], [123, 33, 127], [161, 33, 127]], 0.5, "mid"));
  return out.join("");
}

function returnGrille() {
  const out = [box(120, 30, 10, 44, 2.4, 32, { r: 1.5, steps: 2, bevel: 0.4, tone: "hi" })];
  out.push(onFace("b", [120, 32.4, 42], strokes(roundRect(2.4, 2.4, 41.6, 29.6, 1.8), "faint")));
  const holes = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) holes.push([124.4 + i * 4.4, 32.8, 38.6 - j * 4.6]);
  out.push(dots(holes, 0.55, "lo"));
  return out.join("");
}

function returnDuct() {
  const plan = { x: 172, y: 6, w: 20, d: 18, r: 1.2 };
  const out = [box(plan.x, plan.y, 20, plan.w, plan.d, 24, { r: 1.2, steps: 2, inner: line(k.sideSeam(plan, 32, P, 2), "faint") })];
  out.push(box(192, 4, 18, 2, 22, 28, { r: 1, steps: 2, tone: "lo", bevel: 0.4 }));
  out.push(dots([[194, 6.4, 20.4], [194, 21.6, 20.4], [194, 6.4, 43.6], [194, 21.6, 43.6]], 0.45, "mid"));
  out.push(post(182, 15, 6.2, 44, 4.8, { steps: 28, tone: "hi", crease: "lo" }));
  out.push(line(k.knurl(182, 15, 6.2, 44, 48.8, 30, P), "lo"));
  out.push(post(182, 15, 4, 48.8, 1.6, { steps: 22, tone: "mid" }));
  out.push(line(k.ring(182, 15, 2.6, 50.4, P, 16), "lo"));
  out.push(dots([[182, 15, 50.4]], 0.8, "hi"));
  out.push(post(176, 15, 1.3, 44, 2.6, { steps: 10, tone: "mid", crease: "none" }));
  return out.join("");
}

function tray() {
  const out = [];
  for (const x of [118, 157]) out.push(box(x, 30, 42, 3, 28, 10, { r: 0.6, steps: 2, tone: "lo" }));
  out.push(box(116, 30, 52, 46, 32, 3, { r: 1.4, bevel: 0.5, tone: "hi", crease: "lo" }));
  out.push(box(116, 32, 55, 2, 28, 2.6, { r: 0.6, steps: 2 }), box(160, 32, 55, 2, 28, 2.6, { r: 0.6, steps: 2 }));
  const grid = [];
  for (let x = 122; x <= 156; x += 6) for (let y = 36; y <= 56; y += 6) grid.push([x, y, 55]);
  out.push(dots(grid, 0.5, "lo"));
  return out.join("");
}

export function vent() {
  return { back: column() + accessPanel() + diffuser() + returnGrille() + returnDuct() + tray(), front: box(116, 60, 55, 46, 2, 4, { r: 0.8, steps: 2 }) };
}
