// The interactive passport. The generator writes the passport for one default state, so the page reads without
// JavaScript. This module hydrates it: the reader picks the air and the place (in the controls or in the drawing),
// assess() in passport-rules.js decides what the passport lists, and the page redraws from that result.
// Nothing is decided here: statuses, evidence ids, counts and numbers all come from assess() and data/passport.json.

import { assess } from "./passport-rules.js";
import { cite, claimParagraphs } from "./evidence.js";

const PASSPORT_URL = new URL("../../data/passport.json", import.meta.url);
const STATUSES = ["applies", "differs", "none"];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const root = document.querySelector("[data-passport]");
if (root) start(root);

function node(tag, props = {}, ...children) {
  const element = Object.assign(document.createElement(tag), props);
  element.append(...children);
  return element;
}

async function loadPassport() {
  try {
    const response = await fetch(PASSPORT_URL);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function start(root) {
  const card = root.querySelector("[data-pp-card]");
  const open = root.querySelector("[data-pp-open]");
  const controls = root.querySelector("[data-pp-controls]");
  const bay = root.querySelector('figure-host[name="stowage-bay"]');
  const item = root.querySelector('figure-host[name="instrument"]');
  if (!card || !open || !controls || !bay || !item) return;

  card.hidden = true;
  open.hidden = false;

  const passport = await loadPassport();
  if (!passport) {
    card.hidden = false;
    open.hidden = true;
    return;
  }

  controls.hidden = false;
  const state = { vehicle: root.dataset.vehicle, place: root.dataset.place, picked: null };
  const bayState = { env: null, place: state.place, flags: {} };
  const itemState = { apart: true, lit: null, flags: {} };
  const rows = new Map([...root.querySelectorAll("[data-component]")].map((row) => [row.dataset.component, row]));
  const chips = new Map([...root.querySelector("template[data-pp-chips]").content.querySelectorAll("[data-status]")].map((entry) => [entry.dataset.status, entry]));
  const air = root.querySelector("[data-pp-air-cited]");
  const note = root.querySelector("[data-pp-note]");
  const sharedBox = root.querySelector("[data-pp-shared]");
  let turn = 0;

  const reveal = (row) => {
    row.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  };

  const upgradeRow = (row) => {
    const name = row.querySelector(".pp-row__name");
    const button = node("button", { type: "button", className: "pp-row__pick" }, ...name.childNodes);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => pick(row.dataset.component));
    name.append(button);
  };
  rows.forEach(upgradeRow);

  function pick(id) {
    state.picked = state.picked === id ? null : id;
    render();
    if (state.picked) reveal(rows.get(id));
  }

  function choose(change) {
    Object.assign(state, change);
    render();
  }

  async function render() {
    const mine = ++turn;
    const result = assess(passport, state);
    const place = passport.places.find((entry) => entry.id === state.place);
    const vehicle = passport.vehicles.find((entry) => entry.id === state.vehicle);

    for (const input of controls.querySelectorAll("input")) {
      input.checked = input.value === (input.name === "pp-vehicle" ? state.vehicle : state.place);
    }
    root.querySelector("[data-pp-vehicle]").textContent = vehicle.label;
    root.querySelector("[data-pp-place]").textContent = place.label;

    Object.assign(bayState, {
      env: { label: result.env.label, o2_percent: result.env.o2_percent, pressure_kpa: result.env.pressure_kpa },
      place: state.place,
      flags: Object.fromEntries(result.places.map((entry) => [entry.id, entry.flagged ? "flag" : "none"])),
    });
    bay.state = { ...bayState };
    Object.assign(itemState, { lit: state.picked, flags: Object.fromEntries(result.components.map((entry) => [entry.id, entry.status])) });
    item.state = { ...itemState, flags: { ...itemState.flags } };

    root.querySelector("[data-pp-air-label]").textContent = result.env.label;
    root.querySelector("[data-pp-o2]").textContent = result.env.o2_percent;
    root.querySelector("[data-pp-pressure]").textContent = result.env.pressure_kpa;
    const psia = result.env.pressure_psia;
    root.querySelector("[data-pp-psia]").textContent = psia ?? "";
    root.querySelector("[data-pp-psia-box]").hidden = psia === null;
    root.querySelector("[data-pp-eq]").hidden = psia === null;
    air.querySelectorAll("ui-popover, .fn").forEach((marker) => marker.remove());
    await cite(air, result.env.evidence);

    for (const component of result.components) {
      const row = rows.get(component.id);
      row.dataset.status = component.status;
      row.dataset.picked = String(state.picked === component.id);
      row.querySelector(".pp-row__pick").setAttribute("aria-pressed", String(state.picked === component.id));
      row.querySelector("[data-pp-chip]").replaceChildren(chips.get(component.status).querySelector(".pp-chip").cloneNode(true));
    }
    for (const status of STATUSES) root.querySelector(`[data-pp-count="${status}"]`).textContent = result.summary[status];

    const thisPlace = result.places.find((entry) => entry.id === state.place);
    const whyPlace = await claimParagraphs(thisPlace.evidence);
    const shared = result.components.length ? result.components[0].evidence.filter((id) => result.components.every((component) => component.evidence.includes(id))) : [];
    const whyShared = await claimParagraphs(shared);
    const whyRows = await Promise.all(result.components.map((component) => claimParagraphs(component.evidence.filter((id) => !shared.includes(id)))));
    const caveats = await Promise.all(result.components.map((component) => (result.caveats.gravity_caveat_components.includes(component.id) ? claimParagraphs(result.caveats.gravity_evidence) : null)));
    if (mine !== turn) return;

    sharedBox.hidden = shared.length === 0;
    sharedBox.querySelector("[data-pp-shared-why]").replaceChildren(...whyShared);
    note.hidden = !thisPlace.flagged;
    note.querySelector("[data-pp-note-title]").textContent = place.label;
    note.querySelector("[data-pp-note-about]").textContent = place.about;
    note.querySelector("[data-pp-note-why]").replaceChildren(...(thisPlace.flagged ? whyPlace : []));

    result.components.forEach((component, index) => {
      const lead = chips.get(component.status).querySelector(".pp-row__lead").cloneNode(true);
      const why = rows.get(component.id).querySelector("[data-pp-why]");
      why.replaceChildren(lead, ...whyRows[index]);
      if (caveats[index]) why.append(node("div", { className: "pp-row__caveat" }, ...caveats[index]));
    });
  }

  controls.addEventListener("change", (event) => {
    const input = event.target.closest("input");
    if (input) choose(input.name === "pp-vehicle" ? { vehicle: input.value } : { place: input.value });
  });
  bay.addEventListener("figure:select", ({ detail }) => {
    if (passport.places.some((entry) => entry.id === detail.id) && detail.id !== state.place) choose({ place: detail.id });
  });
  item.addEventListener("figure:select", ({ detail }) => {
    if (!rows.has(detail.id)) return;
    state.picked = detail.id;
    render();
    reveal(rows.get(detail.id));
  });

  render();

  open.addEventListener("click", () => {
    card.hidden = false;
    open.setAttribute("aria-expanded", "true");
    open.disabled = true;
    card.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    card.focus({ preventScroll: true });
  });
}
