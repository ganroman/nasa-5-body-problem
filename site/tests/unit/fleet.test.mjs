import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { assess } from '../../assets/js/passport-rules.js';
import {
  DEFAULT_RULES, STATUS_TEXT, initialOverview, overviewModel, passportFor, renderFleet, scenarioModel,
} from '../../assets/js/fleet-view.js';
import { createCites } from '../../tools/site/cites.mjs';
import { renderFleetStatic } from '../../tools/site/fleet.mjs';
import { toHtml } from '../../tools/site/html.mjs';
import { loadSite } from '../../tools/site/load.mjs';
import { scanHtml, scanJs } from '../../tools/page-scan.mjs';
import { REPO, removeDir, tempDir, unstatedWords } from './support.mjs';

const read = (path) => readFileSync(`${REPO}/${path}`, 'utf8');
const fleet = JSON.parse(read('data/fleet.json'));
const passport = JSON.parse(read('data/passport.json'));
const evidence = new Map(JSON.parse(read('data/evidence.json')).map((record) => [record.id, record]));
const ctx = { fleet, passport, rules: DEFAULT_RULES, claims: () => '', mark: () => '' };
const PLACES = ['airlock', 'vent', 'power', 'locker', 'rack'];
const testsOf = (item) => item.components.flatMap((component) => component.tests.map((test) => ({ item, component, test })));
const numbersIn = (text) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);

describe('data/fleet.json shape', () => {
  it('has six to eight illustrative items with unique ids and components', () => {
    assert.ok(fleet.items.length >= 6 && fleet.items.length <= 8);
    assert.equal(new Set(fleet.items.map((item) => item.id)).size, fleet.items.length);
    for (const item of fleet.items) {
      assert.equal(item.provenance, 'illustrative', item.id);
      assert.equal(typeof item.registered, 'boolean', item.id);
      assert.equal(typeof item.powered, 'boolean', item.id);
      assert.ok(item.name && item.purpose, item.id);
      assert.ok(item.components.length > 0, item.id);
      assert.equal(new Set(item.components.map((component) => component.id)).size, item.components.length, item.id);
      for (const component of item.components) {
        for (const field of ['id', 'name', 'material']) assert.ok(component[field], `${item.id} ${field}`);
        assert.ok(Array.isArray(component.tests) && Array.isArray(component.notes), `${item.id}/${component.id}`);
      }
    }
  });

  it('places match the passport place ids, and an item is powered only where the place is', () => {
    assert.deepEqual(passport.places.map((place) => place.id).sort(), [...PLACES].sort());
    assert.deepEqual(fleet.places.map((place) => place.id).sort(), [...PLACES].sort());
    for (const item of fleet.items) {
      if (item.place === null) continue;
      assert.ok(PLACES.includes(item.place), `${item.id} place ${item.place}`);
      assert.equal(item.powered, passport.places.find((place) => place.id === item.place).powered, `${item.id} powered`);
    }
  });

  it('exactly one item has no passport and waits at the hatch', () => {
    const waiting = fleet.items.filter((item) => !item.registered);
    assert.equal(waiting.length, 1);
    assert.equal(waiting[0].place, null);
  });

  it('keeps the five items of the seed and the instrument with the passport component ids', () => {
    const names = fleet.items.map((item) => item.name);
    for (const name of ['Crew clothing kit', 'Portable science instrument', 'Coolant hose assembly', 'Seal and gasket spares kit', 'Crew restraint net']) {
      assert.ok(names.includes(name), name);
    }
    const instrument = fleet.items.find((item) => item.id === passport.slug);
    assert.deepEqual(instrument.components.map((component) => component.id), passport.components.map((component) => component.id));
    for (const component of instrument.components) {
      const source = passport.components.find((entry) => entry.id === component.id);
      assert.deepEqual(component.tests, source.tests, `tests of ${component.id} are copied from data/passport.json`);
      assert.equal(component.material, source.material);
    }
  });

  it('gives the same material the same tests as data/passport.json when that file tests it', () => {
    for (const source of passport.components) {
      if (!source.tests.length) continue;
      for (const { item, component } of fleet.items.flatMap((entry) => entry.components.map((c) => ({ item: entry, component: c })))) {
        if (component.material === source.material) assert.deepEqual(component.tests, source.tests, `${item.id}/${component.id}`);
      }
    }
  });

  it('builds every test in the shape of the passport and never gives an untested material a result', () => {
    const results = Object.keys(passport.rules.result_types);
    for (const { item, component, test } of fleet.items.flatMap(testsOf)) {
      const where = `${item.id}/${component.id}`;
      assert.deepEqual(Object.keys(test).sort(), ['evidence', 'form', 'gravity', 'o2_percent', 'pressure_kpa', 'result'], where);
      assert.ok(results.includes(test.result), `${where} result ${test.result}`);
      assert.equal(typeof test.o2_percent, 'number', where);
      assert.equal(typeof test.pressure_kpa, 'number', where);
    }
    const lithium = fleet.items.flatMap((item) => item.components).filter((component) => /lithium/i.test(component.material));
    assert.ok(lithium.length > 0);
    for (const component of lithium) assert.deepEqual(component.tests, [], 'a material with no verified test has an empty list');
  });

  it('describes a scenario of steps with short labels, an actor, and places that exist', () => {
    const { steps } = fleet.scenario;
    assert.ok(steps.length >= 5);
    for (const step of steps) {
      assert.ok(['crew', 'watch', 'person'].includes(step.actor), step.id);
      assert.ok(step.label.split(/\s+/).length >= 2 && step.label.split(/\s+/).length <= 3, `label "${step.label}"`);
      assert.equal(step.item, fleet.scenario.item);
      assert.ok(PLACES.includes(step.place), step.id);
      assert.equal(typeof step.powered, 'boolean');
      assert.ok(!/\d/.test(step.label), 'no figures in labels');
    }
    assert.ok(passport.vehicles.some((vehicle) => vehicle.id === fleet.scenario.vehicle));
  });
});

describe('evidence ids and numbers', () => {
  const cited = new Set(fleet.items.flatMap((item) => item.components.flatMap((component) => [...component.tests.map((test) => test.evidence), ...component.notes])));

  it('every evidence id fleet.json cites exists in data/evidence.json after the merge', () => {
    assert.ok(cited.size > 0);
    for (const id of cited) assert.ok(evidence.has(id), `missing evidence record ${id}`);
  });

  it('every number in a test appears in its record (claim, quote or conditions)', () => {
    for (const { item, component, test } of fleet.items.flatMap(testsOf)) {
      const record = evidence.get(test.evidence);
      const pool = new Set(numbersIn(`${record.claim} ${record.quote} ${JSON.stringify(record.conditions)}`));
      for (const key of ['o2_percent', 'pressure_kpa']) {
        assert.ok(pool.has(test[key]), `${item.id}/${component.id}: ${key} ${test[key]} is not in record ${test.evidence}`);
      }
    }
  });

  it('no test entry has a gravity or form that its record does not state', () => {
    const entries = fleet.items.flatMap(testsOf);
    assert.ok(entries.length >= 15);
    for (const { item, component, test } of entries) {
      const record = evidence.get(test.evidence);
      for (const key of ['gravity', 'form']) {
        assert.deepEqual(unstatedWords(test[key], record), [], `${item.id}/${component.id}: ${key} "${test[key]}" has words that the claim and quote of ${test.evidence} do not state`);
      }
    }
    const gravities = new Set(entries.map(({ test }) => test.gravity));
    assert.deepEqual([...gravities].sort(), [null, 'low gravity'].sort(), 'only the Saffire record says low gravity; ground tests carry no gravity label');
  });

  it('every id the rules show for the items exists too, in every air and at every place', () => {
    const ids = new Set();
    for (const item of fleet.items) {
      for (const vehicle of passport.vehicles) {
        for (const place of PLACES) {
          const result = assess(passportFor(item, passport), { vehicle: vehicle.id, place });
          for (const id of [...result.env.evidence, ...result.components.flatMap((c) => c.evidence), ...result.places.flatMap((p) => p.evidence)]) ids.add(id);
        }
      }
    }
    for (const id of ids) assert.ok(evidence.has(id), `missing evidence record ${id}`);
  });
});

describe('statuses come from assess()', () => {
  const state = initialOverview(fleet, passport);

  it('an item without a passport gets no status; registering gives it one from the same rules', () => {
    const before = overviewModel(state, ctx).items.find((entry) => !entry.item.registered);
    assert.equal(before.result, null);
    assert.equal(before.flagged, false);
    const card = renderFleet('overview', { ...state, selected: before.item.id }, ctx);
    assert.ok(!/class="fleet-chip"/.test(card.split('class="fleet-card"')[1].split('</article>')[0]), 'no status chip on the unregistered item card');
    assert.ok(card.includes('No passport yet: no status'));
    const after = overviewModel({ ...state, registered: { ...state.registered, [before.item.id]: true } }, ctx).items.find((entry) => entry.item.id === before.item.id);
    assert.ok(after.result);
    assert.deepEqual(after.result.components.map((c) => c.id), before.item.components.map((c) => c.id));
  });

  it('every shown status equals what assess() returns for that item, place and air', () => {
    for (const vehicle of passport.vehicles) {
      const model = overviewModel({ ...state, vehicle: vehicle.id }, ctx);
      for (const entry of model.items.filter((item) => item.registered)) {
        const direct = assess(passportFor(entry.item, passport), { vehicle: vehicle.id, place: entry.checkPlace });
        assert.deepEqual(entry.result, direct, `${entry.item.id} in ${vehicle.id}`);
        const card = renderFleet('overview', { ...state, vehicle: vehicle.id, selected: entry.item.id }, ctx);
        for (const component of direct.components) assert.ok(card.includes(STATUS_TEXT[component.status]), `${entry.item.id}/${component.id}`);
      }
    }
  });

  it('the statuses change with the air', () => {
    const [first, second] = passport.vehicles.map((vehicle) => overviewModel({ ...state, vehicle: vehicle.id }, ctx));
    const statuses = (model) => model.items.filter((entry) => entry.registered).flatMap((entry) => entry.result.components.map((c) => `${entry.item.id}/${c.id}:${c.status}`));
    assert.notDeepEqual(statuses(first), statuses(second));
  });

  it('counts are computed from the model', () => {
    const model = overviewModel(state, ctx);
    assert.equal(model.counts.items, model.items.filter((entry) => entry.registered).length);
    assert.equal(model.counts.flags, model.items.filter((entry) => entry.registered && !entry.v.allPresent).length);
    assert.equal(model.counts.waiting, 1);
    const page = renderFleet('overview', state, ctx);
    assert.ok(page.includes(`<span data-computed="registered items in data/fleet.json">${model.counts.items}</span>`));
  });
});

describe('the scenario', () => {
  const model = scenarioModel(0, { fleet, passport, rules: DEFAULT_RULES });

  it('assesses each step with assess() and raises a flag at the airlock step', () => {
    for (const entry of model.steps) {
      assert.deepEqual(entry.result, assess(passportFor(model.item, passport), { vehicle: fleet.scenario.vehicle, place: entry.step.place }));
    }
    const watch = model.steps[model.watch];
    assert.equal(watch.step.place, 'airlock');
    assert.equal(watch.raised, true, 'the watch step has a flag');
    assert.equal(watch.shown, true);
  });

  it('shows no flag at the first step and clears it at the last step', () => {
    assert.equal(model.steps[0].shown, false);
    assert.equal(model.steps[0].raised, false);
    const last = model.steps[model.steps.length - 1];
    assert.equal(last.step.place, 'locker');
    assert.equal(last.raised, false);
    assert.equal(last.shown, false);
  });

  it('writes the watch card and the closing line from cited records', () => {
    const watch = renderFleet('scenario', model.watch, ctx);
    assert.ok(watch.includes('Flag raised by the watch'));
    assert.ok(watch.includes('A person decides.'));
    assert.ok(/data-claims="[^"]+"/.test(watch));
    assert.ok(watch.includes('Concept. On this page the message is assembled from the cited records by fixed rules.'));
  });
});

/** Text of the html that is not inside an element marked data-evidence, data-computed or data-illustrative. */
function unmarkedText(html) {
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'wbr']);
  const tokens = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const stack = [];
  const out = [];
  let last = 0;
  const flush = (end) => {
    const text = html.slice(last, end);
    if (text.trim() && !stack.some((entry) => entry.marked || entry.hidden)) out.push(text.trim());
  };
  for (let match = tokens.exec(html); match; match = tokens.exec(html)) {
    flush(match.index);
    last = match.index + match[0].length;
    if (match[1]) {
      const at = stack.map((entry) => entry.tag).lastIndexOf(match[1].toLowerCase());
      if (at >= 0) stack.length = at;
    } else if (match[2]) {
      const tag = match[2].toLowerCase();
      if (match[3].trimEnd().endsWith('/') || VOID.has(tag)) continue;
      stack.push({ tag, marked: /data-(?:evidence|computed|illustrative)/.test(match[3]), hidden: tag === 'script' || tag === 'style' });
    }
  }
  flush(html.length);
  return out;
}

describe('renderFleetStatic', () => {
  const site = loadSite(REPO);

  for (const mode of ['overview', 'scenario']) {
    it(`${mode}: reads without JavaScript, has no uncited digit and passes the page scan`, () => {
      const html = toHtml(renderFleetStatic(site, mode));
      assert.ok(html.startsWith(`<fleet-view mode="${mode}">`));
      assert.ok(html.includes('data-concept'));
      assert.ok(html.includes('Concept'));
      const bare = unmarkedText(html).filter((text) => /\d/.test(text));
      assert.deepEqual(bare, [], 'digits outside data-evidence, data-computed and data-illustrative');
      const scan = scanHtml(html, `fleet-${mode}.html`);
      assert.deepEqual(scan.offenders, []);
      assert.deepEqual(scan.problems, []);
      for (const ref of scan.refs) assert.ok(site.evidence.has(ref.id), `unknown evidence id ${ref.id}`);
    });
  }

  it('overview shows the instrument picked, the plan, the list, and the unregistered item outside the hatch', () => {
    const html = toHtml(renderFleetStatic(site, 'overview'));
    assert.ok(html.includes('Which air'));
    assert.ok(/data-pick="portable-science-instrument"[^>]*aria-pressed="true"/.test(html));
    assert.ok(/<h3 id="fleet-card-title" data-illustrative>Portable science instrument<\/h3>/.test(html), 'the card is the instrument');
    assert.ok(/data-item="handheld-speaker" data-state="none"/.test(html));
    for (const label of ['Evidence applies', 'Conditions differ', 'No evidence']) assert.ok(html.includes(label), label);
    for (const place of PLACES) assert.ok(html.includes(`data-place="${place}"`), place);
  });

  it('scenario starts at the first step with Back disabled and every step label present', () => {
    const html = toHtml(renderFleetStatic(site, 'scenario'));
    assert.ok(/data-step-back disabled/.test(html));
    for (const step of fleet.scenario.steps) assert.ok(html.includes(`>${step.label}<`), step.label);
    assert.ok(html.includes('aria-current="step"'));
  });

  it('cites through the page footnotes, numbered like the rest of the page', () => {
    const cites = createCites(site.evidence);
    const html = toHtml(renderFleetStatic(site, 'overview', cites));
    assert.ok(cites.records().length > 0);
    assert.ok(/<sup class="fn"><a href="#src-1">1<\/a><\/sup>/.test(html));
  });

  it('returns a short "in preparation" frame instead of throwing when a file is missing', () => {
    const dir = tempDir();
    try {
      const html = toHtml(renderFleetStatic({ root: dir, evidence: new Map() }, 'overview'));
      assert.ok(html.includes('in preparation'));
      assert.ok(html.length < 400);
      assert.ok(toHtml(renderFleetStatic(undefined, 'scenario')).length > 0);
    } finally {
      removeDir(dir);
    }
  });
});

describe('no number or finding in the module or the stylesheet', () => {
  const source = read('assets/js/fleet-view.js');
  const css = read('assets/css/fleet.css');

  it('the page scan finds no unsourced figure or claim in the module', () => {
    assert.deepEqual(scanJs(source, 'assets/js/fleet-view.js').offenders, []);
  });

  it('no test value of fleet.json is written in the module or the stylesheet', () => {
    const values = new Set(fleet.items.flatMap(testsOf).flatMap(({ test }) => [`${test.o2_percent}%`, `${test.pressure_kpa} kPa`]));
    for (const value of values) {
      assert.ok(!source.includes(value) && !css.includes(value), `${value} is written in the code`);
    }
  });

  it('never says safe, unsafe, approved or forbidden', () => {
    assert.ok(!/\b(unsafe|approved|forbidden)\b/i.test(source + css + read('data/fleet.json')));
    assert.ok(!/\bsafe\b/i.test(source.replace(/not a safety verdict/gi, '')));
  });

  it('names no tagging or tracking technology', () => {
    assert.ok(!/\b(rfid|nfc|bluetooth|uwb|ultra-wideband|gps|qr|barcode|lora|beacon)\b/i.test(source + css + read('docs/fleet-concept.md')));
  });
});
