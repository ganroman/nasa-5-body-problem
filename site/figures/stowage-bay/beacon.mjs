import { P, k, post, onFace } from "./draw.mjs";

const MAST_TOP = 26;

// A hoist mast on the floor beside a place: its pennant rises and its lamp lights when the place is flagged.
export function beacon(id, [x, y]) {
  const lens = k.ring(x, y, 1.9, MAST_TOP + 3, P, 16);
  const tab = `<g class="pennant"><path class="iso-line flag-tab" data-tone="hi" d="M0.9 0L15 3.4L0.9 6.8Z"/></g>`;
  return `<g class="beacon" data-beacon="${id}">`
    + post(x, y, 3.2, 0, 1.6, { tone: "lo", steps: 16 })
    + post(x, y, 0.9, 1.6, MAST_TOP - 1.6, { tone: "mid", steps: 10, crease: "none" })
    + onFace("b", [x, y, MAST_TOP - 2], tab)
    + `<path class="lamp-glow" d="${k.cylinder(x, y, 4.2, MAST_TOP, 3, P, 18).fill}"/>`
    + post(x, y, 2.4, MAST_TOP, 3, { tone: "hi", steps: 16, crease: "lo" })
    + `<path class="lamp-lens" d="${lens}"/>`
    + `</g>`;
}
