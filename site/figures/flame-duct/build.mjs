// node figures/flame-duct/build.mjs  (from the repository root)
// Writes assets/figures/flame-duct/{figure.html, figure.css, figure.js, standalone.html}.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { CTRL, FAN_SWITCH, GSW, GSW_AT, GSW_LAMPS, KNOB_AT, KNOB_TOP, controls, gravityBox, labelPlate, plate, sockets } from "./base.mjs";
import { camera, cameraLead, console_, holder, igniter, igniterGland, radiometer, radiometerLead, rod } from "./bench.mjs";
import { CAM, DYN } from "./config.mjs";
import { clamps, exitCollar, exitScreen, fan, fanStand, glass, neck, pedestals, straightener, streams } from "./duct.mjs";
import { flameShapes, leverPath, leverTip, pointerPath } from "./dynamic.mjs";
import { MODEL as model } from "./data.mjs";
import { HEIGHT, P, WIDTH, at } from "./world.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "assets", "figures", "flame-duct");

const LABEL =
  "A small bench flow duct for burning tests. A fan with a speed knob blows air through a honeycomb flow straightener into a clear duct and out through an exit screen. In the duct a holder carries a short acrylic rod with an igniter wire at its tip and the flame on it; a radiometer and a camera look at the flame from brackets. On the base are a fan switch, a gravity switch, and two dial gauges for air speed and oxygen.";

const proj = (point) => k.iso(point, P);
const first = { flow: model.weightless.full_at_cm_s, fan: true, gravity: "0g" };
const share = first.flow / model.bench.flow_range_cm_s.max;
const flame = flameShapes(proj, { ...DYN.flame, kind: "dome", size: 0.7, wobble: 0, sway: 0 });

const flameGroup = `<g class="fd-flame" data-part="flame" data-kind="dome"><path class="fd-f-glow" d="${flame.glow}"/><path class="fd-f-shell" d="${flame.shell}"/><path class="fd-f-inner" d="${flame.inner}"/><path class="fd-f-core" d="${flame.core}"/><path class="fd-f-rim" d="${flame.shell}"/></g>`;

const defs = `<defs>
<radialGradient id="fd-shell" cx="0.38" cy="0.5" r="0.62"><stop offset="0" style="stop-color:var(--fd-f-in)"/><stop offset="0.7" style="stop-color:var(--fd-f-mid)"/><stop offset="1" style="stop-color:var(--fd-f-out)"/></radialGradient>
<filter id="fd-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="fd-fine" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
</defs>`;

const lever = (name) => {
  const lean = name === "fan" ? 1 : -1;
  const [tx, ty] = leverTip(proj, DYN.levers[name], lean);
  return `<path class="iso-line fd-lever" data-part="lever-${name}" data-tone="hi" data-free="end" d="${leverPath(proj, DYN.levers[name], lean)}"/><circle class="fd-lever-tip" data-part="lever-${name}-tip" r="1.6" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}"/>`;
};
const lamps = Object.entries(GSW_LAMPS)
  .map(([id, [x, y]]) => `<circle class="fd-lamp" data-lamp="${id}" cx="${at([x, y, GSW.h])[0].toFixed(1)}" cy="${at([x, y, GSW.h])[1].toFixed(1)}" r="1.7"/>`)
  .join("");

const ellipseAt = (centre, radius) => k.onTop(Array.from({ length: 28 }, (_, i) => [centre[0] + radius * Math.cos((i / 28) * Math.PI * 2), centre[1] + radius * Math.sin((i / 28) * Math.PI * 2)]), centre[2], P, true);
const hit = (attrs, d, label) => `<g class="fd-hit" ${attrs} tabindex="0" aria-label="${label}"><path d="${d}"/></g>`;
const hits = [
  hit(`role="slider" data-control="knob" aria-valuemin="0" aria-valuemax="${model.bench.flow_range_cm_s.max}" aria-valuenow="${first.flow}"`, ellipseAt([KNOB_AT[0], KNOB_AT[1], KNOB_TOP], 13.4), "Air speed knob, arrow keys change the speed in centimetres per second"),
  hit(`role="switch" data-control="fan" aria-checked="true"`, ellipseAt([FAN_SWITCH[0], FAN_SWITCH[1], CTRL.h + 1.4], 12), "Fan switch"),
  hit(`role="switch" data-control="gravity" aria-checked="false"`, k.planOutline({ x: GSW_AT[0] - 21, y: GSW_AT[1] - 11, w: 42, d: 22, r: 3 }, GSW.h + 1, P, 4), "Gravity switch, off is weightless and on is Earth gravity"),
].join("");

const svg = k
  .figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: LABEL,
    body: [
      defs,
      plate(),
      sockets(),
      labelPlate(),
      camera(),
      cameraLead(),
      fanStand(),
      pedestals(),
      exitCollar(),
      holder().lower,
      glass().back,
      straightener(),
      exitScreen(),
      streams(),
      holder().inside,
      rod(),
      igniter(),
      flameGroup,
      glass().front,
      igniterGland(),
      clamps(),
      neck(),
      fan(),
      controls(),
      gravityBox(),
      console_({ air: first.flow, o2: model.bench.o2_pct["0g"] }),
      radiometer(),
      radiometerLead(),
      `<path class="iso-line" data-tone="lit" data-free="start" data-part="pointer" d="${pointerPath(proj, DYN.knob, share)}" style="stroke-width:1.1"/>`,
      lever("fan"),
      lever("gravity"),
      lamps,
      `<g class="fd-hits">${hits}</g>`,
    ],
  })
  .replace('role="img"', 'role="group"');

const readout = `<dl class="fd-readout" data-readout>
<div><dt>Air speed</dt><dd data-out="air">${first.flow} cm/s</dd></div>
<div><dt>Fan</dt><dd data-out="fan">on</dd></div>
<div><dt>Gravity</dt><dd data-out="gravity">weightless</dd></div>
<div><dt>Flame</dt><dd data-out="flame">fuller blue dome, leaning with the air</dd></div>
</dl><p class="fd-live" data-live aria-live="polite"></p>`;

const CAPTION =
  "A bench duct of the kind used for burning tests in a glovebox, with one acrylic rod. In weightlessness the flame is a small blue dome: turn the air down and it shrinks and goes out, turn it up toward ventilation speed and it holds. On Earth the drawing shows a tall teardrop that burns whatever the fan does. The marked values come from the BASS-II summary report (oxygen 17.5 percent in weightlessness and 19 on the ground; flame out within 2 s of cutting the flow on a thin film), the ISS Researcher's Guide to Combustion Science (about 10 cm/s, a spacecraft ventilation speed) and a Space Shuttle candle study (stand-off about 7 mm in space, 1 to 2 mm on Earth). The flame outline, its flicker, the timing and the relight by the igniter are illustration, not measurement.";

const fragment = `<figure class="iso anatomy-figure" data-figure="flame-duct" data-theme="dark"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Flame duct</span><span class="iso-plate-corner" data-corner="title">Weightless flame</span><span class="iso-plate-corner" data-corner="hint">Turn the knob, flip fan and gravity</span></div>${svg}${readout}</div><figcaption class="iso-legend"><span class="iso-caption">${CAPTION}</span></figcaption></figure>`;

const topLevelRules = (source) => {
  const rules = [];
  let depth = 0;
  let from = 0;
  for (let at = 0; at < source.length; at++) {
    if (source[at] === "{") depth++;
    if (source[at] === "}" && --depth === 0) {
      rules.push(source.slice(from, at + 1).trim());
      from = at + 1;
    }
  }
  return rules;
};
const kitRules = topLevelRules(readFileSync(join(HERE, "..", "kit", "iso.css"), "utf8")).filter((rule) => /^(\.iso|@keyframes iso-|@media)/.test(rule));
const css = `${kitRules.join("\n")}\n${readFileSync(join(HERE, "figure.css"), "utf8")}`;

const stripExports = (text) => text.replace(/^export /gm, "");
const config = { CAM, DYN, VIEW: { width: WIDTH, height: HEIGHT }, TOUR: JSON.parse(readFileSync(join(HERE, "tour.json"), "utf8")) };
const script = `// Generated by figures/flame-duct/build.mjs from live.js, dynamic.mjs, model.mjs and model.json. Edit those, not this file.
const MODEL = ${JSON.stringify(model)};
const CONFIG = ${JSON.stringify(config)};
${stripExports(readFileSync(join(HERE, "model.mjs"), "utf8"))}
${stripExports(readFileSync(join(HERE, "dynamic.mjs"), "utf8"))}
${readFileSync(join(HERE, "live.js"), "utf8")}`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "figure.html"), fragment);
writeFileSync(join(OUT, "figure.css"), css);
writeFileSync(join(OUT, "figure.js"), script);

const inline = script.replace(/^export function mount/m, "function mount");
const page = k.pageHtml({
  title: "Flame duct figure",
  theme: "dark",
  width: 800,
  body: `<style>${css}</style>${fragment}`,
  script: `${inline}\nwindow.figure = mount(document.querySelector("[data-figure='flame-duct']"));`,
});
writeFileSync(join(OUT, "standalone.html"), page);
console.log("wrote", OUT);
