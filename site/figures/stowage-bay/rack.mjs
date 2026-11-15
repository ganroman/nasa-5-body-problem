import { P, k, box, line, dots } from "./draw.mjs";

const SHELF = { x: 4, y: 160, w: 40, d: 52 };
const STRAP_Y = 211.6;
const bar = (x, y, z, w, d) => box(x, y, z, w, d, 3, { r: 0.6, steps: 2 });
const upright = (x, y) => box(x, y, 0, 3.6, 3.6, 70, { r: 0.6, steps: 2, bevel: 0.3 });

function strap(z) {
  const out = [box(SHELF.x + 0.4, STRAP_Y, z, 39.2, 1.4, 3.4, { r: 0.5, steps: 2, tone: "lo" })];
  out.push(box(20, STRAP_Y - 0.4, z - 0.6, 7, 2.2, 4.6, { r: 1, steps: 2, tone: "hi", crease: "lo" }));
  out.push(line(k.segment([21.5, STRAP_Y + 1.8, z - 0.6], [21.5, STRAP_Y + 1.8, z + 4], P), "mid"));
  return out.join("");
}

function back() {
  const out = [upright(4.4, 160.4), upright(40.4, 160.4)];
  out.push(box(SHELF.x, SHELF.y, 19.6, SHELF.w, SHELF.d, 2.4, { r: 1.2, bevel: 0.5, tone: "lo" }));
  const seam = line(k.sideSeam({ x: 9, y: 168, w: 30, d: 34, r: 3 }, 40, P, 3), "faint");
  out.push(box(9, 168, 22, 30, 34, 22, { r: 3, bevel: 0.7, tone: "hi", crease: "lo", inner: seam }));
  out.push(bar(4.4, 160.4, 38, 3.6, 51.2), bar(40.4, 160.4, 38, 3.6, 51.2), bar(4.4, 160.4, 40, 39.6, 3.6));
  out.push(box(SHELF.x, SHELF.y, 59.6, SHELF.w, SHELF.d, 2.4, { r: 1.2, bevel: 0.5 }));
  const slots = [9, 16, 31, 38].map((x) => k.planOutline({ x, y: 166, w: 2.6, d: 40, r: 1.2 }, 62, P, 2));
  out.push(line(slots.join(""), "lo"));
  out.push(bar(4.4, 160.4, 67, 39.6, 3.6), bar(4.4, 160.4, 67, 3.6, 51.2));
  return out.join("");
}

function front() {
  const out = [upright(4.4, 208), upright(40.4, 208), bar(40.4, 160.4, 67, 3.6, 51.2)];
  out.push(strap(62.6), strap(26));
  out.push(dots([[6.2, STRAP_Y + 1.4, 65], [41.8, STRAP_Y + 1.4, 65], [6.2, STRAP_Y + 1.4, 28.5], [41.8, STRAP_Y + 1.4, 28.5]], 0.5, "hi"));
  return out.join("");
}

export function rack() {
  return { back: back(), front: front() };
}
