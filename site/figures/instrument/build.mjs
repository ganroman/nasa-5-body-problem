// node figures/instrument/build.mjs  (from the repository root)
// Writes assets/figures/instrument/{figure.html, figure.css, figure.js, standalone.html}.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { BODY, TOP, parts } from "./parts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(ROOT, "assets", "figures", "instrument");
const light = process.argv.includes("--light");

const passport = JSON.parse(readFileSync(join(ROOT, "data", "passport.json"), "utf8"));
const byId = Object.fromEntries(passport.components.map((item) => [item.id, item]));
const need = (id) => {
  if (!byId[id]) throw new Error(`passport.json has no component "${id}"`);
  return id;
};

const WIDTH = 640;
const HEIGHT = 560;
const LIFT = { tray: 0, battery: 26, gasket: 52, wiring: 76, top: 102, strap: 48 };
const AZIMUTH = 42;

// Paint order, back to front. The tray is drawn twice around the battery: its far walls first, its near walls after.
const IDS = Object.fromEntries(["enclosure", "battery", "gasket", "wiring", "strap"].map((role) => [role, need(role)]));
const LAYERS = [
  { id: "strap-pins", component: IDS.strap, part: "pins", lift: LIFT.strap, delay: 2 },
  { id: "tray", component: IDS.enclosure, part: "tray.back", lift: LIFT.tray, delay: 5, focus: true },
  { id: "strap", component: IDS.strap, part: "strap", lift: LIFT.strap, delay: 2, focus: true },
  { id: "battery", component: IDS.battery, part: "battery", lift: LIFT.battery, delay: 3, focus: true },
  { id: "tray-front", component: IDS.enclosure, part: "tray.over", lift: LIFT.tray, delay: 5 },
  { id: "gasket", component: IDS.gasket, part: "gasket", lift: LIFT.gasket, delay: 2, focus: true },
  { id: "wiring", component: IDS.wiring, part: "wiring", lift: LIFT.wiring, delay: 1, focus: true },
  { id: "top", component: IDS.enclosure, part: "top", lift: LIFT.top, delay: 0 },
  { id: "wiring-head", component: IDS.wiring, part: "head", lift: LIFT.wiring, delay: 1 },
];

const extremes = [
  ...k.boxCorners(BODY, 0, 20),
  ...k.boxCorners(BODY, LIFT.top + 21.6, LIFT.top + TOP),
  [-122, -28, LIFT.strap],
  [-122, 28, LIFT.strap + 12],
  [86, 0, LIFT.wiring + 28],
];
const P = k.fitProjection(extremes, WIDTH, HEIGHT, { pad: 34, azimuth: AZIMUTH, elevation: 30 });

const drawn = parts(P, IDS);
const pick = (path) => path.split(".").reduce((value, key) => (typeof value === "string" ? value : value[key]), drawn);
const aria = (item) => `${item.name}, ${item.material}, ${Math.round(item.mass_share * 100)} percent of mass`;

const stage = k.axisVector(P, [0, 0, (LIFT.top + TOP) / 2 - TOP / 2])[1];
const groups = LAYERS.map((layer) => {
  const item = byId[layer.component];
  const attributes = layer.focus ? ` tabindex="0" role="button" aria-label="${aria(item)}"` : ' aria-hidden="true"';
  return `<g class="in-piece" data-piece="${layer.id}" data-component="${layer.component}"${attributes}>${pick(layer.part)}</g>`;
}).join("");

const label = `Exploded view of the illustrative ${passport.name.toLowerCase()}: enclosure shell halves, battery pack, gasket ring, circuit board with sensor head, and carry strap, lifted apart along one vertical axis.`;
const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label, body: `<g data-stage>${groups}</g>` });

const plate = k.plateHtml({
  fig: "Fig 1",
  title: passport.name,
  hint: "Select a part",
  readout: "",
  body: `<div class="in-stage">${svg}</div>`,
});
const theme = light ? "light" : "dark";
const markup = plate.replace('<figure class="iso-figure">', `<figure class="iso anatomy-figure" data-figure="instrument" data-theme="${theme}">`);

const data = {
  idle: `${passport.provenance} item · ${passport.components.length} components`,
  stage,
  components: passport.components.map(({ id, name, material, mass_share }) => ({ id, name, material, mass_share })),
  pieces: LAYERS.map((layer) => ({ id: layer.id, delay: layer.delay, shift: k.axisVector(P, [0, 0, layer.lift]).map((value) => Math.round(value * 100) / 100) })),
};

const css = readFileSync(join(HERE, "figure.css"), "utf8");
const kitCss = readFileSync(join(HERE, "..", "kit", "iso.css"), "utf8");
const source = readFileSync(join(HERE, "live.js"), "utf8").replace("/*DATA*/", JSON.stringify(data));

mkdirSync(OUT, { recursive: true });
if (!light) {
  writeFileSync(join(OUT, "figure.html"), markup);
  writeFileSync(join(OUT, "figure.css"), `${kitCss}\n${css}`);
  writeFileSync(join(OUT, "figure.js"), source);
}

const inline = source.replace("export function mount", "function mount");
const boot = `${inline}\nwindow.figure = mount(document.querySelector("[data-figure='instrument']"));`;
const page = k.pageHtml({ title: "Instrument figure", theme, width: 720, body: `<style>${css}</style>${markup}`, script: boot });
writeFileSync(join(OUT, light ? "standalone-light.html" : "standalone.html"), page);
console.log(`wrote ${OUT} (${theme})`);
