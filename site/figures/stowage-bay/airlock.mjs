import { k, P, at, box, post, disc, band, ball, line, dots, onFace, strokes, circle, roundRect } from "./draw.mjs";

const HATCH_Y = 53;
const WHEEL = [8.5, HATCH_Y, 57];

function hatch() {
  const out = [box(0, 14, 8, 5, 78, 114, { r: 3, steps: 4, bevel: 0.6 })];
  out.push(onFace("a", [5, HATCH_Y, 65], strokes(roundRect(-35.5, -53.5, 35.5, 53.5, 5), "lo")));
  const bolts = [];
  for (let y = 20; y <= 86; y += 11) bolts.push([5, y, 11.5], [5, y, 118.5]);
  for (let z = 24; z <= 106; z += 14) bolts.push([5, 17, z], [5, 89, z]);
  out.push(dots(bolts, 0.5, "mid"));
  out.push(box(5, 20, 14, 3.5, 66, 102, { r: 3, steps: 4, bevel: 0.5, tone: "hi", crease: "lo" }));
  const door = [
    strokes(roundRect(-27, -45, 27, 45, 4), "faint"),
    circle(0, -30, 9.4, "iso-fill"),
    circle(0, -30, 9.4, "iso-line", "mid"),
    circle(0, -30, 7.4, "iso-line", "faint"),
    strokes("M-5.2 -33.2A6.4 6.4 0 0 1 -2 -36", "mid"),
    strokes(roundRect(-23, 31, -9, 41, 1.6), "lo"),
    strokes(roundRect(9, 31, 23, 41, 1.6), "lo"),
    circle(-16, 36, 1.4, "iso-line", "mid"),
  ];
  out.push(onFace("a", [8.5, HATCH_Y, 65], door.join("")));
  for (const z of [26, 62, 98]) out.push(box(3.5, 15, z, 5.5, 6, 9, { r: 1.2, steps: 2, tone: "mid" }));
  out.push(dots([[9, 18, 30.5], [9, 18, 66.5], [9, 18, 102.5]], 0.45, "mid"));
  out.push(box(8.5, 78, 48, 2.6, 5, 22, { r: 1, steps: 2 }));
  out.push(disc(WHEEL, [1, 0, 0], 0, 4.4, 3.2));
  out.push(band(WHEEL, [1, 0, 0], 3, 5.4, 8.4, 10.4, { tone: "hi", crease: "lo" }));
  const spokes = [0, 120, 240].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `M0 0L${(Math.cos(a) * 8.4).toFixed(2)} ${(Math.sin(a) * 8.4).toFixed(2)}`;
  }).join("");
  out.push(onFace("a", [WHEEL[0] + 5.4, WHEEL[1], WHEEL[2]], strokes(spokes, "mid", ' style="stroke-width:1.2"')));
  out.push(disc(WHEEL, [1, 0, 0], 4, 6.8, 3.2, { tone: "hi", crease: "lo" }));
  out.push(box(0, 96, 100, 1.6, 15, 9, { r: 1.2, steps: 2, tone: "lo" }));
  out.push(onFace("a", [1.6, 103.5, 106], ["M-5.5 0H5.5", "M-5.5 2.2H1.5", "M-5.5 4.4H4"].map((d) => strokes(d, "lo", ' data-free=""')).join("")));
  return out.join("");
}

function oxygenLine() {
  const run = [5.5, 8, 134];
  const out = [];
  for (const y of [30, 72, 150, 190]) out.push(box(0, y - 2, 130, 3.4, 4, 8, { r: 0.8, steps: 2, tone: "lo" }));
  out.push(disc(run, [0, 1, 0], 0, 204, 3.2));
  for (const y of [30, 72, 150, 190]) out.push(band([5.5, y, 134], [0, 1, 0], -1.6, 1.6, 3.2, 4.4, { tone: "lo" }));
  out.push(band(run, [0, 1, 0], 0, 2.6, 3.2, 4.8, { tone: "mid" }));
  out.push(band([5.5, 212, 134], [0, 1, 0], -2.6, 0, 3.2, 4.8, { tone: "mid" }));
  out.push(post(5.5, 108, 2.6, 62, 72, { tone: "mid", crease: "none" }));
  out.push(ball([5.5, 108, 134], 4.4));
  out.push(line(k.sideArc(5.5, 108, 2.6, 118, P, 14) + k.sideArc(5.5, 108, 2.6, 100, P, 14), "faint"));
  out.push(post(5.5, 108, 4.8, 76, 12, { steps: 24, tone: "hi", crease: "lo" }));
  out.push(post(5.5, 108, 3.4, 88, 4, { steps: 18 }));
  out.push(disc([10.3, 108, 82], [1, 0, 0], 0, 5, 1.5));
  out.push(band([15, 108, 82], [1, 0, 0], 0, 2.2, 5.6, 7.2, { tone: "hi", crease: "lo" }));
  const bars = [0, 90].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const r = 5.6;
    return `M${(-Math.cos(a) * r).toFixed(2)} ${(-Math.sin(a) * r).toFixed(2)}L${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  }).join("");
  out.push(onFace("a", [17.2, 108, 82], strokes(bars, "mid", ' style="stroke-width:1.1"')));
  out.push(disc([15, 108, 82], [1, 0, 0], 0, 3.2, 1.9, { tone: "hi" }));
  out.push(post(5.5, 108, 3.4, 56, 6, { steps: 18 }));
  return out.join("");
}

function mask() {
  const out = [box(0, 119, 100, 2, 12, 8, { r: 1, steps: 2, tone: "lo" })];
  out.push(disc([2, 125, 104], [1, 0, 0], 0, 7, 1.1));
  out.push(ball([9, 125, 104], 1.5, { tone: "hi" }));
  out.push(line(k.segment([9, 125, 104], [8, 120.5, 92], P) + k.segment([9, 125, 104], [8, 129.5, 92], P), "mid"));
  out.push(box(4.5, 116, 70, 7, 18, 22, { r: 4, steps: 4, bevel: 0.6, tone: "hi", crease: "lo" }));
  out.push(onFace("a", [11.5, 125, 81], strokes(roundRect(-6.6, -8, 6.6, 8, 3), "faint") + circle(0, 1.5, 4.6, "iso-line", "mid") + circle(0, 1.5, 2.6, "iso-line", "faint")));
  out.push(disc([11.5, 126.5, 80], [1, 0, 0], 0, 3.6, 4.2, { tone: "hi", crease: "lo" }));
  out.push(disc([8, 125, 66], [0, 0, 1], 0, 4, 1.6));
  const hose = [at(5.5, 108, 56), at(6.5, 111, 49), at(9.5, 118, 48.5), at(10, 123, 56), at(8, 125, 66)];
  out.push(k.wireSvg(hose[0], hose[4], { via: hose.slice(1, 4), tone: "mid", size: 1.1 }));
  return out.join("");
}

function bench() {
  const out = [box(4, 20, 0, 44, 76, 18, { r: 2, steps: 3, bevel: 0.7 })];
  const top = k.insetPlan({ x: 4, y: 20, w: 44, d: 76, r: 2 }, 3);
  out.push(line(k.planOutline(top, 18, P, 3), "faint"));
  const ribs = [];
  for (let x = 10; x <= 42; x += 6) ribs.push(k.lineOnTop([x, top.y], [x, top.y + top.d], 18, P));
  out.push(line(ribs.join(""), "faint"));
  for (const y of [28, 80]) out.push(box(48, y, 5, 1.6, 8, 8, { r: 1, steps: 2, tone: "lo" }));
  out.push(line(k.segment([48, 20, 10], [48, 96, 10], P), "faint"));
  out.push(dots([[48.8, 32, 9], [48.8, 84, 9]], 0.45, "mid"));
  return out.join("");
}

export function airlock() {
  return hatch() + oxygenLine() + mask() + bench();
}
