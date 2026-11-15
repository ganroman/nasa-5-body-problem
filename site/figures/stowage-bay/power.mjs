import { P, k, at, box, post, disc, line, dots, onFace, strokes, circle, roundRect } from "./draw.mjs";

function shelf() {
  const out = [];
  for (const x of [207, 252]) out.push(box(x, 0, 44, 3, 34, 18, { r: 0.6, steps: 2, tone: "lo" }));
  out.push(box(204, 0, 62, 54, 40, 4, { r: 1.6, bevel: 0.6 }));
  out.push(line(k.planOutline(k.insetPlan({ x: 204, y: 0, w: 54, d: 40, r: 1.6 }, 2.6), 66, P, 3), "faint"));
  out.push(dots([[207, 36.5, 66], [255, 36.5, 66]], 0.5, "mid"));
  return out.join("");
}

function outletPanel() {
  const out = [box(210, 0, 76, 42, 8, 38, { r: 2, bevel: 0.5, tone: "hi", crease: "lo" })];
  const sockets = [4, 24].map((u) => strokes(roundRect(u, 6, u + 14, 22, 2.4), "lo") + circle(u + 7, 14, 4.4, "iso-line", "mid") + circle(u + 7, 14, 1.2, "iso-line", "faint")
    + strokes(`M${u + 4} 10.6V12.2M${u + 10} 10.6V12.2`, "lo"));
  out.push(onFace("b", [210, 8, 114], sockets.join("") + strokes(roundRect(2.4, 2.4, 39.6, 35.6, 1.8), "faint")));
  out.push(disc([231, 8, 86], [0, 1, 0], 0, 2.4, 2.2, { tone: "hi", crease: "lo" }));
  out.push(onFace("b", [210, 8, 114], strokes("M16 33H26", "lo", ' data-free=""')));
  out.push(dots([[213, 8, 111], [249, 8, 111], [213, 8, 79], [249, 8, 79]], 0.5, "mid"));
  out.push(post(231, 5, 2.2, 114, 21, { steps: 14, crease: "none" }));
  out.push(post(231, 5, 3.2, 114, 2.4, { steps: 14, tone: "lo" }), post(231, 5, 3.2, 125, 2.4, { steps: 14, tone: "lo" }));
  return out.join("");
}

function cradle() {
  const out = [box(218, 9, 66, 28, 26, 2.5, { r: 2.4, bevel: 0.4, tone: "hi", crease: "lo" })];
  out.push(line(k.ring(232, 22, 9, 68.5, P, 28) + k.ring(232, 22, 5.6, 68.5, P, 22), "faint"));
  out.push(dots([[232, 22, 68.5]], 0.5, "lo"));
  return out.join("");
}

function cable() {
  const plug = box(219.6, 8, 98.4, 3.4, 2.4, 3.4, { r: 0.6, steps: 2, tone: "hi" });
  const run = [[221.3, 10.4, 99.8], [221.5, 12.5, 92], [223, 14.4, 80], [225.5, 12.4, 71], [226.6, 10.4, 68.5]];
  return plug + k.wireSvg(at(...run[0]), at(...run[4]), { via: run.slice(1, 4).map((point) => at(...point)), tone: "mid", size: 1 });
}

// Modelled at x 204 to 258, then mounted this far toward the vent so the locker does not hide the charging shelf.
const MOUNT_SHIFT = -8;
const mounted = (markup) => `<g transform="${k.translateAlong(P, [MOUNT_SHIFT, 0, 0])}">${markup}</g>`;

export function power() {
  const lens = k.ring(242.5, 32.5, 1.5, 69.4, P, 14);
  const led = post(242.5, 32.5, 2, 66, 3.4, { steps: 14, tone: "hi" })
    + `<path class="charge-lens" d="${lens}"/>`;
  return { back: mounted(shelf() + outletPanel() + cradle() + cable()), front: mounted(box(204, 38, 66, 54, 2, 3, { r: 0.8, steps: 2 }) + led) };
}
