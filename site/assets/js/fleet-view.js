// <fleet-view mode="overview" | "scenario">: a CONCEPT view of the whole vehicle. When every item has a passport
// and a tag that says where it is, all cargo can be watched at once. Statuses and flags are never stored: they come
// from assess() in passport-rules.js, called once per item. No number or finding is written here; values come from
// data/fleet.json, data/passport.json and the cited records in data/evidence.json.
//
// The functions before the element are pure (no DOM), so tools/site/fleet.mjs can render the same markup at build time.

import { assess } from './passport-rules.js';

const BROWSER = typeof document !== 'undefined';

/* ------------------------------------------------------------------ text and small helpers */

export const STATUS_TEXT = { applies: 'Evidence applies', differs: 'Conditions differ', none: 'No evidence' };
const ALL_PRESENT = 'All checks present for this place and air';
const NOT_ADMITTED = 'No passport yet: no status';
const CONCEPT_NOTE = 'Concept. On this page the message is assembled from the cited records by fixed rules.';
const CHARGING_NOTE = 'The plan has outlets only on the charging shelf, so this story does not plug the instrument in.';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
const unique = (list) => [...new Set(list)];
const letterOf = (index) => String.fromCharCode(65 + index);

/* ------------------------------------------------------------------ geometry: one habitat module in plan view */

const BOX = { wide: { w: 1000, h: 420 }, tall: { w: 420, h: 1000 } };
const SLOTS = {
  airlock: [[206, 292], [250, 292], [294, 292], [206, 250], [250, 250], [294, 250]],
  vent: [[404, 176], [452, 176], [500, 176], [548, 176]],
  power: [[668, 152], [714, 152], [760, 152]],
  locker: [[388, 322], [458, 322], [528, 322], [598, 322], [668, 322]],
  rack: [[912, 117], [912, 179], [912, 241], [912, 303]],
  hatch: [[62, 210], [62, 160], [62, 260]],
};
const ZONES = {
  airlock: { x: 166, y: 64, w: 162, h: 292 },
  vent: { x: 346, y: 64, w: 254, h: 140 },
  power: { x: 614, y: 64, w: 190, h: 140 },
  locker: { x: 346, y: 270, w: 358, h: 88 },
  rack: { x: 816, y: 64, w: 140, h: 292 },
};
const LABELS = { airlock: [176, 84], vent: [358, 136], power: [624, 98], locker: [358, 282], rack: [824, 84] };

/** Module coordinates to drawing coordinates for the chosen layout (the tall layout turns the module a quarter turn). */
const at = (layout, x, y) => (layout === 'tall' ? [BOX.tall.w - y, x] : [x, y]);

function geometry(uid) {
  const ids = (name) => `${name}-${uid}`;
  const sockets = [0, 1, 2, 3].map((i) => `<circle class="g-line" cx="${660 + 36 * i}" cy="74" r="5"/><path class="g-line" d="M${657 + 36 * i} 74h2M${662 + 36 * i} 74h2"/>`).join('');
  const slats = Array.from({ length: 11 }, (_, i) => `<line x1="${374 + 20 * i}" y1="72" x2="${374 + 20 * i}" y2="88"/>`).join('');
  const chevrons = [404, 480, 556].map((x) => `<path class="g-flow" d="M${x - 10} 108 L${x} 118 L${x + 10} 108"/><path class="g-flow g-flow--faint" d="M${x} 98V108M${x - 14} 100V104M${x + 14} 100V104"/>`).join('');
  const lockers = [0, 1, 2, 3, 4].map((i) => {
    const x = 356 + 70 * i;
    const door = i === 3
      ? `<path class="g-line g-dash" d="M${x} 288A64 64 0 0 1 ${x + 46} 227"/><path class="g-door" d="M${x + 64} 288L${x + 46} 227"/>`
      : `<path class="g-door" d="M${x + 2} 288H${x + 62}"/>`;
    return `<g><rect class="g-solid" x="${x}" y="288" width="64" height="64" rx="4"/><rect class="g-line" x="${x + 6}" y="294" width="52" height="52" rx="2"/>${door}</g>`;
  }).join('');
  const bays = [0, 1, 2, 3].map((i) => {
    const y = 90 + 62 * i;
    return `<rect class="g-line" x="880" y="${y}" width="64" height="54" rx="3"/><path class="g-line g-dash" d="M886 ${y + 8}H938M886 ${y + 46}H938"/>`;
  }).join('');
  const ribs = Array.from({ length: 19 }, (_, i) => `M${190 + 41 * i} 48v-7M${190 + 41 * i} 372v7`).join('');
  const ruler = Array.from({ length: 21 }, (_, i) => `M${150 + 41 * i} ${i % 5 ? 395 : 391}V401`).join('');
  return `<defs>
  <pattern id="${ids('wall')}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="g-hatch" x1="0" y1="0" x2="0" y2="7"/></pattern>
  <pattern id="${ids('floor')}" width="40" height="40" patternUnits="userSpaceOnUse"><path class="g-cross" d="M20 17v6M17 20h6"/></pattern>
  <mask id="${ids('gap')}" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="420"><rect width="1000" height="420" style="fill: #fff"/><rect x="136" y="178" width="40" height="64" style="fill: #000"/></mask>
</defs>
<rect class="g-floor" x="164" y="62" width="792" height="296" rx="14" style="fill: url(#${ids('floor')})"/>
<g mask="url(#${ids('gap')})"><path class="g-wall" style="fill: url(#${ids('wall')})" fill-rule="evenodd" d="M176 48H944a26 26 0 0 1 26 26V346a26 26 0 0 1-26 26H176a26 26 0 0 1-26-26V74a26 26 0 0 1 26-26ZM178 62H942a14 14 0 0 1 14 14V344a14 14 0 0 1-14 14H178a14 14 0 0 1-14-14V76a14 14 0 0 1 14-14Z"/></g>
<path class="g-rib" d="${ribs}"/>
<path class="g-edge" d="M150 178H164M150 242H164"/>
<path class="g-line" d="M100 178H150M100 242H150"/>
<path class="g-line g-dash" d="M100 164V256"/>
<path class="g-line g-dash" d="M164 178A64 64 0 0 1 224 220"/><path class="g-door" d="M164 242L224 220"/><circle class="g-dot" cx="164" cy="242" r="3.5"/>
<circle class="g-line" cx="970" cy="210" r="22"/><circle class="g-line" cx="970" cy="210" r="14"/>
<path class="g-axis" d="M176 210H944"/>
<g class="g-part" data-geo="airlock"><rect class="g-solid" x="330" y="62" width="8" height="114"/><rect class="g-solid" x="330" y="244" width="8" height="114"/><path class="g-line g-dash" d="M334 182V238"/>
  <rect class="g-solid" x="186" y="322" width="128" height="24" rx="4"/><path class="g-line g-dash" d="M186 314H314"/><circle class="g-dot" cx="204" cy="334" r="3"/><circle class="g-dot" cx="250" cy="334" r="3"/><circle class="g-dot" cx="296" cy="334" r="3"/></g>
<g class="g-part" data-geo="vent"><rect class="g-solid" x="352" y="64" width="8" height="32"/><rect class="g-solid" x="596" y="64" width="8" height="32"/><rect class="g-solid" x="360" y="66" width="236" height="28" rx="3"/><g class="g-grille">${slats}</g>${chevrons}
  <rect class="g-solid" x="372" y="150" width="212" height="52" rx="6"/><rect class="g-line" x="378" y="156" width="200" height="40" rx="3"/></g>
<g class="g-part" data-geo="power"><rect class="g-solid" x="640" y="66" width="140" height="16" rx="3"/>${sockets}<circle class="g-led" cx="792" cy="74" r="2.5"/>
  <path class="g-line" d="M696 82C696 94 712 94 712 104"/><rect class="g-solid" x="632" y="104" width="164" height="96" rx="6"/><rect class="g-line" x="638" y="110" width="152" height="84" rx="3"/></g>
<g class="g-part" data-geo="locker">${lockers}</g>
<g class="g-part" data-geo="rack"><rect class="g-solid" x="874" y="84" width="76" height="250" rx="3"/>${bays}<circle class="g-dot" cx="878" cy="88" r="3"/><circle class="g-dot" cx="946" cy="88" r="3"/><circle class="g-dot" cx="878" cy="330" r="3"/><circle class="g-dot" cx="946" cy="330" r="3"/></g>
<path class="g-rule" d="M150 398H970"/><path class="g-rule" d="${ruler}"/>`;
}

function marks(layout) {
  const corners = [[10, 10, 1, 1], [BOX[layout].w - 10, 10, -1, 1], [10, BOX[layout].h - 10, 1, -1], [BOX[layout].w - 10, BOX[layout].h - 10, -1, -1]];
  return corners.map(([x, y, dx, dy]) => `<path class="g-crop" d="M${x + 12 * dx} ${y}H${x}V${y + 12 * dy}"/>`).join('');
}

/* ------------------------------------------------------------------ the model: assess() once per item */

export const passportFor = (item, passport) => ({
  slug: item.id,
  name: item.name,
  purpose: item.purpose,
  provenance: item.provenance,
  components: item.components,
  environments: passport.environments,
  vehicles: passport.vehicles,
  places: passport.places,
  tolerances: passport.tolerances,
  rules: passport.rules,
});

/** The rules the element uses; tests and the generator pass the same module. */
export const DEFAULT_RULES = { assess };
export const assessItem = (item, passport, vehicle, place, rules = DEFAULT_RULES) => rules.assess(passportFor(item, passport), { vehicle, place });

/** What a result says: the place record, the components that are not "applies", and whether all checks are present. */
export function verdict(result, placeId) {
  const place = result.places.find((entry) => entry.id === placeId) ?? { flagged: false, evidence: [] };
  const gaps = result.components.filter((component) => component.status !== 'applies');
  return { place, placeFlagged: place.flagged === true, gaps, allPresent: gaps.length === 0 && place.flagged !== true };
}

export function initialOverview(fleet, passport) {
  return {
    vehicle: fleet.default_vehicle ?? passport.vehicles[0].id,
    selected: fleet.default_item ?? fleet.items[0].id,
    places: Object.fromEntries(fleet.items.map((item) => [item.id, item.place ?? null])),
    registered: Object.fromEntries(fleet.items.map((item) => [item.id, item.registered === true])),
  };
}

export function overviewModel(state, { fleet, passport, rules }) {
  const items = fleet.items.map((item, index) => {
    const base = { item, index, letter: letterOf(index), registered: state.registered[item.id] === true, place: state.places[item.id] ?? null, justRegistered: state.justRegistered === item.id };
    if (!base.registered) return { ...base, result: null, checkPlace: null, v: null, flagged: false };
    const checkPlace = base.place ?? fleet.hatch_check_place;
    const result = assessItem(item, passport, state.vehicle, checkPlace, rules);
    const v = verdict(result, checkPlace);
    return { ...base, checkPlace, result, v, flagged: !v.allPresent };
  });
  const registered = items.filter((entry) => entry.registered);
  return {
    items,
    vehicle: passport.vehicles.find((entry) => entry.id === state.vehicle),
    counts: { items: registered.length, flags: registered.filter((entry) => entry.flagged).length, waiting: items.length - registered.length },
  };
}

export function scenarioModel(stepIndex, { fleet, passport, rules }) {
  const { scenario } = fleet;
  const item = fleet.items.find((entry) => entry.id === scenario.item);
  const steps = scenario.steps.map((step) => ({ step, result: assessItem(item, passport, scenario.vehicle, step.place, rules) }));
  steps.forEach((entry, index) => {
    entry.v = verdict(entry.result, entry.step.place);
    // What changed is measured from where the item last was somewhere else, not from the step before.
    let from = index - 1;
    while (from >= 0 && steps[from].step.place === entry.step.place) from -= 1;
    entry.from = from >= 0 ? from : null;
    const before = entry.from === null ? null : steps[entry.from].result;
    entry.lost = before
      ? entry.result.components.filter((component) => component.status !== 'applies' && before.components.find((c) => c.id === component.id)?.status === 'applies')
      : [];
    entry.raised = entry.v.placeFlagged || entry.lost.length > 0;
  });
  const watch = steps.findIndex((entry) => entry.step.actor === 'watch');
  steps.forEach((entry, index) => { entry.shown = entry.raised && watch >= 0 && index >= watch; });
  return { item, steps, watch, current: Math.min(Math.max(stepIndex, 0), steps.length - 1), vehicle: passport.vehicles.find((entry) => entry.id === scenario.vehicle) };
}

/* ------------------------------------------------------------------ markup */

const placeLabel = (passport, id) => passport.places.find((place) => place.id === id)?.label ?? id;
const shortLabel = (fleet, id) => fleet.places.find((place) => place.id === id)?.short ?? id;

const GLYPH = {
  applies: '<circle cx="10" cy="10" r="8" fill="currentColor"/>',
  differs: '<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.5a7.5 7.5 0 0 0 0 15z" fill="currentColor"/>',
  none: '<circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.4"/>',
};
const glyph = (status) => `<svg class="fleet-chip__glyph" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">${GLYPH[status]}</svg>`;
export const chip = (status) => `<span class="fleet-chip" data-status="${status}">${glyph(status)}<span>${STATUS_TEXT[status]}</span></span>`;
const flagGlyph = '<svg class="fleet-mark__glyph" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><path d="M5 18V3M5 4h11l-3 4 3 4H5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const okGlyph = '<svg class="fleet-mark__glyph" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 10.3l2.6 2.6L14 7.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const lockGlyph = '<svg class="fleet-mark__glyph" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.4"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** The state of one tag: what it looks like on the plan and in the list. */
export function tagState(entry) {
  if (!entry.registered) return 'none';
  return entry.flagged ? 'flag' : 'ok';
}
const STATE_TEXT = { flag: 'Flag', ok: 'Checks present', none: 'No passport' };
const stateMark = (state) => (state === 'flag' ? flagGlyph : state === 'ok' ? okGlyph : lockGlyph);

/** Slot positions: items at the same place take its slots in list order. */
export function slotsFor(entries) {
  const taken = new Map();
  return entries.map((entry) => {
    const key = entry.place ?? 'hatch';
    const used = taken.get(key) ?? 0;
    taken.set(key, used + 1);
    const slots = SLOTS[key] ?? SLOTS.hatch;
    const slot = slots[used % slots.length];
    const lap = Math.floor(used / slots.length);
    return [slot[0] + lap * 6, slot[1] + lap * 6];
  });
}

const tagSvg = ({ id, letter, name, state, selected, layout, x, y, where, label }) => {
  const [px, py] = at(layout, x, y);
  return `<g class="fleet-tag" data-item="${esc(id)}" data-state="${state}"${selected ? ' data-selected' : ''} role="button" tabindex="0" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${esc(label)}" style="transform: translate(${px}px, ${py}px)">
    <g class="fleet-tag__ping" aria-hidden="true"><circle r="22"/><circle r="22"/></g>
    <path class="fleet-tag__brackets" aria-hidden="true" d="M-24 -10V-19H-15M15 -19H24V-10M24 10V19H15M-15 19H-24V10"/>
    <rect class="fleet-tag__ring" x="-21" y="-16" width="42" height="32" rx="9"/>
    <rect class="fleet-tag__body" x="-17" y="-13" width="34" height="26" rx="6"/>
    <text class="fleet-tag__id" y="5" text-anchor="middle">${esc(letter)}</text>
    <g class="fleet-tag__flag" aria-hidden="true"><path d="M13 -13V-31"/><path d="M13 -31H29L25 -26L29 -21H13Z"/></g>
    <g class="fleet-tag__ok" aria-hidden="true"><circle cx="15" cy="-13" r="7"/><path d="M11.5 -13L14 -10.5L18.5 -15.5"/></g>
    <title>${esc(name)}</title>
  </g>`;
};

function labelsSvg(fleet, layout, lit, waiting) {
  const anchor = layout === 'tall' ? 'end' : 'start';
  const place = (id) => {
    const apart = layout === 'tall' && id === 'rack'; // in the tall layout the rack label sits above its frame, not inside the power zone
    const [x, y] = at(layout, ...(apart ? [866, 340] : LABELS[id]));
    return `<text class="fleet-label${lit.has(id) ? ' is-lit' : ''}" data-place-label="${id}" x="${x}" y="${y}" text-anchor="${apart ? 'start' : anchor}">${esc(shortLabel(fleet, id))}</text>`;
  };
  const quiet = (x, y, text, extra = '') => {
    const [px, py] = at(layout, x, y);
    return `<text class="fleet-label fleet-label--quiet" x="${px}" y="${py}" text-anchor="middle"${extra}>${text}</text>`;
  };
  const gate = `<g class="fleet-wait"${waiting ? '' : ' data-off'}>${layout === 'tall' ? `${quiet(62, 312, 'No passport:')}${quiet(78, 312, 'not admitted')}` : `${quiet(62, 292, 'No passport:')}${quiet(62, 306, 'not admitted')}`}</g>`;
  return `${Object.keys(LABELS).map(place).join('')}${quiet(125, 158, 'Hatch')}${quiet(62, 128, 'Outside')}${gate}`;
}

/** The plan with its tags. `tags` are { id, letter, name, state, selected, x, y, label }. */
export function planSvg({ fleet, layout, uid, tags, litPlaces, caption, waiting = false }) {
  const box = BOX[layout];
  const turn = layout === 'tall' ? ` transform="translate(${BOX.tall.w} 0) rotate(90)"` : '';
  const zones = Object.entries(ZONES).map(([id, z]) => `<rect class="fleet-zone" data-place="${id}"${litPlaces.has(id) ? ' data-lit' : ''} x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="8"/>`).join('');
  return `<svg class="fleet-svg" data-layout="${layout}" viewBox="0 0 ${box.w} ${box.h}" role="group" aria-label="${esc(caption)}" focusable="false">
  <g class="fleet-geo"${turn}>${geometry(uid)}<g class="fleet-zones">${zones}</g></g>
  <g class="fleet-crops" aria-hidden="true">${marks(layout)}</g>
  <g class="fleet-labels" aria-hidden="true">${labelsSvg(fleet, layout, litPlaces, waiting)}</g>
  <g class="fleet-tags">${tags.map((tag) => tagSvg({ ...tag, layout })).join('')}</g>
</svg>`;
}

/** Claims of evidence ids: a callback, because the page builds them with footnotes and the browser with popovers. */
const claimsBlock = (claims, ids) => `<div class="fleet-claims" data-claims="${esc(unique(ids).join(' '))}">${claims(unique(ids))}</div>`;

const envLine = (env, mark = () => '') => {
  const oxygen = typeof env.o2_percent === 'number' ? `${env.o2_percent}% oxygen` : null;
  const pressure = typeof env.pressure_psia === 'number' ? `${env.pressure_psia} psia` : typeof env.pressure_kpa === 'number' ? `${env.pressure_kpa} kPa` : null;
  const numbers = [oxygen, pressure].filter(Boolean).join(', ');
  const ids = env.evidence.join(' ');
  return `<span data-evidence="${esc(ids)}">${esc(env.label)}${numbers ? `: ${esc(numbers)}` : ''}${mark(env.evidence)}</span>`;
};

function componentRow(component, spec, claims) {
  const ids = component.evidence;
  const lead = component.status === 'none' ? 'Related records, not a test of this material' : '';
  const body = ids.length
    ? `${lead ? `<p class="fleet-comp__lead small">${lead}</p>` : ''}${claimsBlock(claims, ids)}`
    : '<p class="fleet-comp__none small" data-computed="components without a test in data/fleet.json">No test of this material is in the passport.</p>';
  return `<li class="fleet-comp" data-status="${component.status}">
      <div class="fleet-comp__head"><span class="fleet-comp__name" data-illustrative>${esc(spec.name)}</span> <span class="fleet-comp__mat small" data-illustrative>${esc(spec.material)}</span> ${chip(component.status)}</div>
      ${body}
    </li>`;
}

function placeButtons(entry, passport, fleet) {
  return `<div class="fleet-place" role="group" aria-label="Place ${esc(entry.item.name)}">
      <span class="fleet-place__label small">${entry.place ? 'Move to' : 'Place it in'}</span>
      ${passport.places.map((place) => `<button type="button" class="fleet-pill" data-place-to="${esc(place.id)}" aria-pressed="${entry.place === place.id ? 'true' : 'false'}">${esc(shortLabel(fleet, place.id))}</button>`).join('')}
    </div>`;
}

export function overviewCard(entry, ctx) {
  const { fleet, passport, claims, air } = ctx;
  const { item } = entry;
  const head = `<header class="fleet-card__head">
      <span class="fleet-card__letter" aria-hidden="true">${esc(entry.letter)}</span>
      <div><h3 id="fleet-card-title" data-illustrative>${esc(item.name)}</h3>
      <p class="fleet-card__purpose small" data-illustrative>${esc(item.purpose)}</p></div>
      <span class="beat__mark" data-illustrative>Illustrative item</span>
    </header>`;
  if (!entry.registered) {
    return `<article class="fleet-card" data-state="none" aria-labelledby="fleet-card-title">${head}
    <p class="fleet-where"><span class="fleet-where__k">Where</span> Waiting outside the hatch</p>
    <p class="fleet-verdict" data-state="none">${lockGlyph}<span><strong>${NOT_ADMITTED}</strong><br><span class="small">Registration at the hatch is the concept: an item gets a status once it has a passport.</span></span></p>
    <p class="fleet-comps-note small">Components, listed but not assessed: <span data-illustrative>${item.components.map((c) => esc(`${c.name} (${c.material})`)).join('; ')}</span></p>
    <div class="fleet-actions"><button type="button" class="btn btn--primary" data-register="${esc(item.id)}">Register</button></div>
  </article>`;
  }
  const { result, v } = entry;
  const where = entry.place ? placeLabel(passport, entry.place) : 'Registered, still at the hatch';
  const checked = entry.place ? '' : `<p class="small fleet-checked">Checked as stowed in a locker, unpowered. Place it to check its place.</p>`;
  const state = tagState(entry);
  const reasons = [];
  if (v.placeFlagged) reasons.push(`the place (${esc(placeLabel(passport, entry.checkPlace))})`);
  for (const gap of v.gaps) reasons.push(`${esc(item.components.find((c) => c.id === gap.id).name)}: ${STATUS_TEXT[gap.status].toLowerCase()}`);
  const verdictBlock = v.allPresent
    ? `<p class="fleet-verdict" data-state="ok">${okGlyph}<span><strong>${ALL_PRESENT}</strong></span></p>`
    : `<p class="fleet-verdict" data-state="flag">${flagGlyph}<span><strong>Flag</strong> <span class="small">raised by ${reasons.join('; ')}</span></span></p>`;
  /* A record the rules attach to every component (for example the one for powered hardware) is shown once, not once per row. */
  const counts = new Map();
  for (const component of result.components) for (const id of unique(component.evidence)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const shared = result.components.length > 1 ? [...counts].filter(([, n]) => n === result.components.length).map(([id]) => id) : [];
  const sharedOnly = shared;
  const sharedBlock = sharedOnly.length ? `<section class="fleet-about"><h4 class="fleet-h">Same for every component here</h4>${claimsBlock(claims, sharedOnly)}</section>` : '';
  const inRows = new Set(result.components.flatMap((component) => component.evidence.filter((id) => !shared.includes(id))));
  const placeOnly = (v.place.evidence ?? []).filter((id) => !inRows.has(id));
  const placeEvidence = placeOnly.length
    ? `<section class="fleet-about"><h4 class="fleet-h">About this place</h4>${claimsBlock(claims, placeOnly)}</section>`
    : '';
  return `<article class="fleet-card" data-state="${state}" aria-labelledby="fleet-card-title">${head}
    <p class="fleet-where"><span class="fleet-where__k">Where</span> ${esc(where)} <span class="fleet-where__k">Air</span> ${envLine(result.env, ctx.mark)}</p>
    ${checked}${verdictBlock}
    <ul class="fleet-comps" aria-label="Components">${result.components.map((component) => componentRow({ ...component, evidence: component.evidence.filter((id) => !shared.includes(id)) }, item.components.find((c) => c.id === component.id), claims)).join('')}</ul>
    ${placeEvidence}${sharedBlock}
    ${entry.justRegistered ? '<p class="small fleet-checked">Registered. Its passport was built from the components and tests already in the data.</p>' : ''}
    ${placeButtons(entry, passport, fleet)}
  </article>`;
}

function listRow(entry, selected, label) {
  const state = tagState(entry);
  return `<li><button type="button" class="fleet-row" data-pick="${esc(entry.item.id)}" data-state="${state}" aria-pressed="${selected ? 'true' : 'false'}">
      <span class="fleet-row__id" aria-hidden="true">${esc(entry.letter)}</span>
      <span class="fleet-row__name" data-illustrative>${esc(entry.item.name)}</span>
      <span class="fleet-row__where small">${entry.registered ? esc(entry.place ? label(entry.place) : 'At the hatch') : 'Outside the hatch'}</span>
      <span class="fleet-mark" data-state="${state}">${stateMark(state)}<span>${STATE_TEXT[state]}</span></span>
    </button></li>`;
}

const countsLine = (counts) => `<p class="fleet-count"><span data-computed="registered items in data/fleet.json">${counts.items}</span> items, <span data-computed="items with a flag mark, from assess() in assets/js/passport-rules.js">${counts.flags}</span> flags<span class="fleet-count__wait">, <span data-computed="items without a passport in data/fleet.json">${counts.waiting}</span> waiting at the hatch</span></p>`;

const airControl = (passport, vehicle) => `<fieldset class="fleet-air"><legend>Which air</legend>
      ${passport.vehicles.map((entry) => `<label class="fleet-air__opt"><input type="radio" name="fleet-air" value="${esc(entry.id)}" data-air${entry.id === vehicle ? ' checked' : ''}><span>${esc(entry.label)}</span></label>`).join('')}
    </fieldset>`;

/** The overview in its markup. `claims(ids)` returns the cited paragraphs of those evidence ids. */
export function renderOverview(state, ctx) {
  const { fleet, passport, rules } = ctx;
  const model = overviewModel(state, { fleet, passport, rules });
  const slots = slotsFor(model.items);
  const tags = model.items.map((entry, index) => ({
    id: entry.item.id, letter: entry.letter, name: entry.item.name, state: tagState(entry), selected: entry.item.id === state.selected,
    x: slots[index][0], y: slots[index][1],
    label: `${entry.letter}, ${entry.item.name}. ${entry.registered ? `${entry.place ? placeLabel(passport, entry.place) : 'at the hatch'}. ${STATE_TEXT[tagState(entry)]}.` : `${NOT_ADMITTED}.`} Illustrative item.`,
  }));
  const picked = model.items.find((entry) => entry.item.id === state.selected) ?? model.items[0];
  const lit = new Set(picked.place ? [picked.place] : []);
  const plan = planSvg({ fleet, layout: ctx.layout ?? 'wide', uid: ctx.uid ?? 'o', tags, litPlaces: lit, waiting: model.counts.waiting > 0, caption: 'Plan of one habitat module seen from above, with its cargo tags. Concept.' });
  return `<div class="fleet" data-mode="overview" data-vehicle="${esc(state.vehicle)}">
  <div class="fleet-bar">
    ${airControl(passport, state.vehicle)}
    ${countsLine(model.counts)}
  </div>
  <figure class="fleet-plan">${plan}<figcaption class="small" data-concept>One habitat module from above. Each item carries a tag that says where it is; the tag is a concept, not a product.</figcaption></figure>
  <div class="fleet-lower">
    <ul class="fleet-list" aria-label="Cargo items">${model.items.map((entry) => listRow(entry, entry.item.id === state.selected, (id) => placeLabel(passport, id))).join('')}</ul>
    <div class="fleet-cardwrap" data-card tabindex="-1">${overviewCard(picked, { ...ctx, claims: ctx.claims, air: model.vehicle })}</div>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite" data-announce></p>
</div>`;
}

function watchPanel(entry, from, ctx) {
  const { passport, claims, fleet } = ctx;
  const place = placeLabel(passport, entry.step.place);
  if (!entry.raised) {
    return `<h3 class="fleet-panel__title">The watch compared place and air with the passport</h3>
      <p>No flag raised for <span data-illustrative>${esc(entry.step.place)}</span>.</p>`;
  }
  const lostNames = entry.lost.map((c) => ctx.item.components.find((x) => x.id === c.id).name);
  const ids = unique([...(entry.v.placeFlagged ? entry.v.place.evidence : []), ...entry.result.env.evidence, ...entry.lost.flatMap((c) => c.evidence)]);
  return `<h3 class="fleet-panel__title">Flag raised by the watch</h3>
    <p class="fleet-panel__moved">Moved from ${esc(placeLabel(passport, from.step.place))} to ${esc(place)}. The air there: ${envLine(entry.result.env, ctx.mark)}</p>
    ${lostNames.length ? `<p class="fleet-panel__lost small">No longer covered by evidence: <span data-illustrative>${lostNames.map(esc).join(', ')}</span></p>` : ''}
    ${claimsBlock(claims, ids)}
    <p class="fleet-panel__person"><strong>A person decides.</strong></p>`;
}

function stepPanel(model, ctx) {
  const entry = model.steps[model.current];
  const from = entry.from === null ? entry : model.steps[entry.from];
  const { passport } = ctx;
  const where = placeLabel(passport, entry.step.place);
  const title = entry.step.actor === 'watch' ? '' : `<h3 class="fleet-panel__title">${esc(entry.step.label)}</h3>`;
  let body;
  if (entry.step.actor === 'watch') {
    body = watchPanel(entry, from, { ...ctx, item: model.item });
  } else if (entry.step.actor === 'person') {
    body = `<p><strong>A person decides.</strong></p><p>Decision: <span data-concept>${esc(entry.step.label.toLowerCase())}</span>. The flag stays up until the item has moved.</p>`;
  } else {
    const placeEvidence = entry.v.place.evidence?.length ? claimsBlock(ctx.claims, entry.v.place.evidence) : '';
    body = `<p class="fleet-where"><span class="fleet-where__k">Where</span> ${esc(where)} <span class="fleet-where__k">Air</span> ${envLine(entry.result.env, ctx.mark)}</p>${placeEvidence}
      <p class="small">The watch compares place and air with the passport after every move.</p>`;
  }
  return `<div class="fleet-panel" data-actor="${entry.step.actor}" data-raised="${entry.shown ? 'true' : 'false'}">
    <p class="fleet-panel__concept small" data-concept>${CONCEPT_NOTE}</p>
    ${title}${body}
  </div>`;
}

export function renderScenario(stepIndex, ctx) {
  const { fleet, passport, rules } = ctx;
  const model = scenarioModel(stepIndex, { fleet, passport, rules });
  const entry = model.steps[model.current];
  const itemIndex = fleet.items.findIndex((item) => item.id === model.item.id);
  const visited = model.steps.slice(0, model.current).map((s) => s.step.place);
  const trail = unique(visited).filter((place) => place !== entry.step.place);
  const slotAt = (place) => SLOTS[place][0];
  const [x, y] = slotAt(entry.step.place);
  const state = entry.shown ? 'flag' : 'ok';
  const tags = [{
    id: model.item.id, letter: letterOf(itemIndex), name: model.item.name, state: entry.shown ? 'flag' : 'plain', selected: true, x, y,
    label: `${letterOf(itemIndex)}, ${model.item.name}. ${placeLabel(passport, entry.step.place)}.${entry.shown ? ' Flag.' : ''} Illustrative item.`,
  }];
  const ghosts = trail.map((place) => ({ id: `ghost-${place}`, letter: letterOf(itemIndex), name: model.item.name, state: 'ghost', selected: false, x: slotAt(place)[0], y: slotAt(place)[1], label: `${model.item.name}, earlier at ${placeLabel(passport, place)}` }));
  const plan = planSvg({ fleet, layout: ctx.layout ?? 'wide', uid: ctx.uid ?? 's', tags: [...ghosts, ...tags], litPlaces: new Set([entry.step.place]), caption: 'Plan of one habitat module seen from above, with the instrument at its current place. Concept.' });
  const stepList = model.steps.map((s, index) => `<li><button type="button" class="fleet-step" data-step="${index}" data-actor="${s.step.actor}"${index === model.current ? ' aria-current="step"' : ''}><span class="fleet-step__label">${esc(s.step.label)}</span><span class="fleet-step__who small">${esc(s.step.actor)}</span></button></li>`).join('');
  return `<div class="fleet" data-mode="scenario" data-vehicle="${esc(fleet.scenario.vehicle)}" data-step="${model.current}" data-state="${state}">
  <div class="fleet-bar">
    <p class="fleet-air fleet-air--fixed"><span class="fleet-air__k">Air</span> ${esc(model.vehicle.label)}</p>
    <p class="fleet-count">Step <span data-computed="index of the current step in data/fleet.json">${model.current + 1}</span> of <span data-computed="number of steps in data/fleet.json">${model.steps.length}</span></p>
  </div>
  <figure class="fleet-plan">${plan}<figcaption class="small" data-concept>${CHARGING_NOTE}</figcaption></figure>
  <div class="fleet-lower fleet-lower--steps">
    <div class="fleet-steps">
      <div class="fleet-steps__nav"><button type="button" class="btn" data-step-back${model.current === 0 ? ' disabled' : ''}>Back</button><button type="button" class="btn btn--primary" data-step-next${model.current === model.steps.length - 1 ? ' disabled' : ''}>Next</button></div>
      <ol class="fleet-steps__list" aria-label="Steps of the story">${stepList}</ol>
    </div>
    <div class="fleet-cardwrap" data-card tabindex="-1">${stepPanel(model, ctx)}</div>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite" data-announce></p>
</div>`;
}

export const renderFleet = (mode, state, ctx) => (mode === 'scenario' ? renderScenario(state, ctx) : renderOverview(state, ctx));

/* ------------------------------------------------------------------ the element */

const DATA = { fleet: new URL('../../data/fleet.json', import.meta.url), passport: new URL('../../data/passport.json', import.meta.url) };
const loadJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
};

const browserClaims = () => '';

if (BROWSER && typeof customElements !== 'undefined' && !customElements.get('fleet-view')) {
  const evidenceModule = import('./evidence.js');
  let sequence = 0;

  customElements.define('fleet-view', class FleetView extends HTMLElement {
    connectedCallback() {
      this.mode = this.getAttribute('mode') === 'scenario' ? 'scenario' : 'overview';
      this.uid = `${this.mode[0]}${(sequence += 1)}`;
      this.layout = 'wide';
      this.addEventListener('click', (event) => this.onClick(event));
      this.addEventListener('change', (event) => this.onChange(event));
      this.addEventListener('keydown', (event) => this.onKey(event));
      this.query = matchMedia('(max-width: 640px)');
      this.query.addEventListener('change', () => this.relayout());
      this.start();
    }

    async start() {
      try {
        const [fleet, passport] = await Promise.all([loadJson(DATA.fleet), loadJson(DATA.passport)]);
        this.ctx = { fleet, passport, rules: { assess }, claims: browserClaims, layout: this.layout, uid: this.uid };
        this.state = this.mode === 'scenario' ? 0 : initialOverview(fleet, passport);
        const staticDom = this.querySelector('.fleet');
        this.layout = this.query.matches ? 'tall' : 'wide';
        this.ctx.layout = this.layout;
        if (!staticDom || this.layout === 'tall') this.draw();
        else this.after();
      } catch (error) {
        if (!this.querySelector('.fleet')) this.innerHTML = '<p class="fleet-frame small">The whole-vehicle view is in preparation.</p>';
      }
    }

    relayout() {
      const next = this.query.matches ? 'tall' : 'wide';
      if (!this.ctx || next === this.layout) return;
      this.layout = next;
      this.ctx.layout = next;
      this.draw();
    }

    /** Full redraw: used at start and when the layout changes; tags then glide on later updates. */
    draw(focusKey) {
      this.innerHTML = renderFleet(this.mode, this.state, this.ctx);
      this.after();
      this.refocus(focusKey);
    }

    /** Light update: the plan keeps its elements so tags can move; the list, card and counts are replaced. */
    update(announce, focusKey) {
      const fresh = document.createElement('div');
      fresh.innerHTML = renderFleet(this.mode, this.state, this.ctx);
      const live = this.querySelector('.fleet');
      if (!live) return this.draw(focusKey);
      live.dataset.vehicle = fresh.querySelector('.fleet').dataset.vehicle;
      for (const attr of ['step', 'state']) {
        const value = fresh.querySelector('.fleet').dataset[attr];
        if (value === undefined) delete live.dataset[attr]; else live.dataset[attr] = value;
      }
      for (const selector of ['.fleet-bar', '.fleet-lower']) live.querySelector(selector).replaceWith(fresh.querySelector(selector));
      this.syncPlan(fresh);
      this.after();
      if (announce) this.querySelector('[data-announce]').textContent = announce;
      this.refocus(focusKey);
    }

    /** Focus the first of the keys that names an enabled element, so a keyboard user stays where they were. */
    refocus(keys) {
      for (const key of [keys].flat().filter(Boolean)) {
        const target = this.querySelector(key);
        if (target && !target.disabled) return target.focus({ preventScroll: true });
      }
      return undefined;
    }

    syncPlan(fresh) {
      const livePlan = this.querySelector('.fleet-plan svg');
      const nextPlan = fresh.querySelector('.fleet-plan svg');
      const liveTags = new Map([...livePlan.querySelectorAll('.fleet-tag')].map((tag) => [tag.dataset.item, tag]));
      const holder = livePlan.querySelector('.fleet-tags');
      const wanted = new Set();
      for (const next of nextPlan.querySelectorAll('.fleet-tag')) {
        wanted.add(next.dataset.item);
        const live = liveTags.get(next.dataset.item);
        if (!live) { holder.append(next.cloneNode(true)); continue; }
        live.style.transform = next.style.transform;
        for (const name of ['data-state', 'aria-pressed', 'aria-label']) live.setAttribute(name, next.getAttribute(name));
        if (next.hasAttribute('data-selected')) live.setAttribute('data-selected', ''); else live.removeAttribute('data-selected');
      }
      for (const [id, tag] of liveTags) if (!wanted.has(id)) tag.remove();
      for (const zone of livePlan.querySelectorAll('.fleet-zone')) {
        const lit = nextPlan.querySelector(`.fleet-zone[data-place="${zone.dataset.place}"]`).hasAttribute('data-lit');
        zone.toggleAttribute('data-lit', lit);
      }
      livePlan.querySelector('.fleet-wait')?.toggleAttribute('data-off', nextPlan.querySelector('.fleet-wait').hasAttribute('data-off'));
      for (const label of livePlan.querySelectorAll('[data-place-label]')) {
        label.classList.toggle('is-lit', nextPlan.querySelector(`[data-place-label="${label.dataset.placeLabel}"]`).classList.contains('is-lit'));
      }
    }

    /** Fill the empty claim containers with cited paragraphs and give unmarked citation spans their markers. */
    async after() {
      const boxes = [...this.querySelectorAll('.fleet-claims[data-claims]')].filter((box) => !box.children.length);
      const spans = [...this.querySelectorAll('span[data-evidence]')].filter((span) => !span.querySelector('.fn, ui-popover, .cite'));
      if (!boxes.length && !spans.length) return;
      const { claimParagraphs } = await evidenceModule;
      for (const box of boxes) box.replaceChildren(...(await claimParagraphs(box.dataset.claims.split(/\s+/).filter(Boolean))));
      for (const span of spans) {
        for (const id of span.dataset.evidence.split(/\s+/).filter(Boolean)) {
          const [paragraph] = await claimParagraphs([id]);
          const marker = paragraph?.querySelector('ui-popover');
          if (marker) span.append(marker);
        }
      }
    }

    pick(id, focusKey) {
      this.state.selected = id;
      this.state.justRegistered = null;
      const entry = overviewModel(this.state, this.ctx).items.find((item) => item.item.id === id);
      const text = `${entry.item.name}. ${entry.registered ? `${entry.place ? placeLabel(this.ctx.passport, entry.place) : 'At the hatch'}. ${STATE_TEXT[tagState(entry)]}.` : `${NOT_ADMITTED}.`}`;
      this.update(`Selected ${text}`, focusKey ?? `[data-pick="${CSS.escape(id)}"]`);
    }

    go(index, focusKey) {
      const last = this.ctx.fleet.scenario.steps.length - 1;
      this.state = Math.min(Math.max(index, 0), last);
      const step = this.ctx.fleet.scenario.steps[this.state];
      this.update(`Step ${this.state + 1} of ${last + 1}: ${step.label}.`, [focusKey, `[data-step="${this.state}"]`]);
    }

    onClick(event) {
      if (!this.ctx) return;
      const target = event.target.closest('[data-pick], .fleet-tag, [data-register], [data-place-to], [data-step], [data-step-back], [data-step-next]');
      if (!target) return;
      if (target.matches('[data-pick], .fleet-tag')) {
        const id = target.dataset.pick ?? target.dataset.item;
        if (this.mode === 'overview' && !id.startsWith('ghost-')) this.pick(id, target.matches('.fleet-tag') ? `.fleet-tag[data-item="${CSS.escape(id)}"]` : undefined);
      } else if (target.matches('[data-register]')) {
        const id = target.dataset.register;
        this.state.registered[id] = true;
        this.state.selected = id;
        this.state.justRegistered = id;
        this.update(`${this.ctx.fleet.items.find((item) => item.id === id).name} is registered. Its passport has been checked.`, '[data-place-to]');
      } else if (target.matches('[data-place-to]')) {
        this.state.places[this.state.selected] = target.dataset.placeTo;
        this.update(`Moved to ${placeLabel(this.ctx.passport, target.dataset.placeTo)}.`, `[data-place-to="${target.dataset.placeTo}"]`);
      } else if (target.matches('[data-step]')) {
        this.go(Number(target.dataset.step));
      } else if (target.matches('[data-step-back]')) {
        this.go(this.state - 1, '[data-step-back]');
      } else if (target.matches('[data-step-next]')) {
        this.go(this.state + 1, '[data-step-next]');
      }
    }

    onChange(event) {
      if (!this.ctx || !event.target.matches('[data-air]')) return;
      this.state.vehicle = event.target.value;
      const label = this.ctx.passport.vehicles.find((entry) => entry.id === this.state.vehicle).label;
      this.update(`Air: ${label}.`, '[data-air]:checked');
    }

    onKey(event) {
      const tag = event.target.closest?.('.fleet-tag');
      if (tag && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        tag.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }
  });
}

