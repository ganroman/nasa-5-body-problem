import { DIAL, GAUGES } from "./world.mjs";
import { box, dots, onFace, strokes, circle, roundRect, disc } from "./draw.mjs";

const polar = (angle, r) => {
  const a = (angle * Math.PI) / 180;
  return [Math.sin(a) * r, -Math.cos(a) * r];
};
const spot = ([u, v]) => `${u.toFixed(2)} ${v.toFixed(2)}`;
const tick = (angle, from, to) => `M${spot(polar(angle, from))}L${spot(polar(angle, to))}`;

export const gaugeAngle = (value, max) => -DIAL.sweep / 2 + (DIAL.sweep * Math.min(Math.max(value, 0), max)) / max;

function scale({ max, majorEvery, minorEvery }) {
  const outer = DIAL.r - 3.4;
  let minor = "";
  let major = "";
  for (let value = 0; value <= max + 1e-6; value += minorEvery) {
    const angle = gaugeAngle(value, max);
    if (value % majorEvery === 0) major += tick(angle, outer - 3.6, outer);
    else minor += tick(angle, outer - 2, outer);
  }
  return strokes(minor, "lo") + strokes(major, "mid");
}

function dial(gauge) {
  const { id, cx, unit } = gauge;
  const R = DIAL.r;
  const face = [
    circle(0, 0, R - 1.6, "iso-fill"),
    circle(0, 0, R - 1.6, "iso-line", "lo"),
    circle(0, 0, R - 2.6, "iso-line", "faint"),
    scale(gauge),
    strokes(`M-2.2 ${R - 4.6}L0 ${R - 9}L2.2 ${R - 4.6}Z`, "mid", ' data-stop="unknown"'),
    `<text class="iso-face-text" data-tone="lo" x="0" y="-7.5" font-size="3.6" text-anchor="middle">${unit}</text>`,
    `<g class="needle" data-needle="${id}" transform="rotate(${DIAL.parked})">${strokes(`M0 3.4V${-(R - 6.2)}`, "hi", ' style="stroke-width:1.2"')}</g>`,
    circle(0, 0, 2, "iso-fill"),
    circle(0, 0, 2, "iso-line", "mid"),
    circle(0, 0, 0.6, "iso-line", "hi"),
  ];
  const bezel = disc([cx, 4, DIAL.cz], [0, 1, 0], 0, 5, R, { tone: "hi", crease: "lo" });
  return bezel + onFace("b", [cx, DIAL.face, DIAL.cz], face.join(""), ` data-dial="${id}"`);
}

export function gaugePanel() {
  const plate = { x: 9, y: 0, w: 82, d: 4, r: 2.5 };
  const out = [box(plate.x, 0, 74, plate.w, plate.d, 58, { r: 2.5, steps: 4, bevel: 0.6, tone: "hi", crease: "lo" })];
  out.push(onFace("b", [plate.x, 4, 74], strokes(roundRect(3.2, 3.2, plate.w - 3.2, 54.8, 1.8), "faint")));
  const screws = [[13, 4, 78], [87, 4, 78], [13, 4, 128], [87, 4, 128]];
  out.push(dots(screws, 0.5, "mid"));
  out.push(Object.values(GAUGES).map(dial).join(""));
  const rules = ["M0 0H24", "M0 1.6H16", "M0 3.2H20"].map((d) => strokes(d, "lo", ' data-free=""')).join("");
  out.push(box(30, 4, 76.4, 40, 0.8, 4.6, { r: 0.8, steps: 2, tone: "lo", crease: "none" }));
  out.push(onFace("b", [36, 4.8, 80], rules));
  return out.join("");
}
