import { INSTRUMENT } from "./world.mjs";
import { P, k, box, post, line, dots } from "./draw.mjs";

const { w, d, h } = INSTRUMENT;
const PLAN = { x: -w / 2, y: -d / 2, w, d, r: 3 };

// The portable instrument, built centred on the origin with its base at z = 0.
export function instrument() {
  const out = [];
  const grip = line(k.sideSeam(PLAN, 3.4, P, 4), "mid");
  out.push(box(PLAN.x, PLAN.y, 0, w, d, h, { r: PLAN.r, steps: 4, bevel: 0.6, tone: "hi", lit: true, inner: grip }));
  const screen = k.insetPlan(PLAN, 3);
  out.push(line(k.planOutline({ ...screen, w: screen.w * 0.62, r: 1.2 }, h, P, 3), "hi"));
  out.push(dots([[-w / 2 + 14, 0, h], [-w / 2 + 17.4, 0, h], [-w / 2 + 20.8, 0, h]].map(([x, y, z]) => [x, y + d * 0.2, z]), 0.6, "hi"));
  const strapX = -w / 2 - 3;
  out.push(box(strapX, -3.4, 1.6, 3, 6.8, 5.4, { r: 1.2, steps: 3, lit: true, tone: "hi" }));
  out.push(post(w / 2 - 3.5, -d / 2 + 4, 1.4, h, 1.4, { steps: 12, lit: true, tone: "hi" }));
  return `<g class="instrument">${out.join("")}</g>`;
}

export function instrumentShadow() {
  return `<path class="instrument-shadow" d="${k.haloOf({ ...PLAN, r: 5 }, 0, 0.1, P)}"/>`;
}
