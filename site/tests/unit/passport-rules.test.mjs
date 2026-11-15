import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assess } from '../../assets/js/passport-rules.js';
import { unstatedWords } from './support.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const passport = readJson('data/passport.json');
const evidence = readJson('data/evidence.json');
const evidenceById = new Map(evidence.map((record) => [record.id, record]));
const clone = (value) => JSON.parse(JSON.stringify(value));

const statusMap = (result) => Object.fromEntries(result.components.map((c) => [c.id, c.status]));
const ids = (result, id) => result.components.find((c) => c.id === id).evidence;

test('station cabin: applies, differs and none each appear for a real component', () => {
  const result = assess(passport, { vehicle: 'iss', place: 'locker' });
  assert.equal(result.env.id, 'iss-cabin');
  assert.deepEqual(statusMap(result), {
    enclosure: 'differs', battery: 'none', gasket: 'applies', wiring: 'none', strap: 'differs',
  });
  assert.deepEqual(result.summary, { applies: 1, differs: 2, none: 2 });
  assert.deepEqual(ids(result, 'gasket'), ['silicone-1p5mm-moc-vs-pressure']);
});

test('lunar habitat: applies, differs and none each appear for a real component', () => {
  const result = assess(passport, { vehicle: 'lunar-habitat', place: 'locker' });
  assert.equal(result.env.id, 'lunar-habitat');
  assert.equal(result.env.kind, 'planned');
  assert.deepEqual(statusMap(result), {
    enclosure: 'differs', battery: 'none', gasket: 'differs', wiring: 'none', strap: 'applies',
  });
  assert.deepEqual(result.summary, { applies: 1, differs: 2, none: 2 });
  assert.deepEqual(ids(result, 'strap'), ['kevlar-pbi-webbing-moc-8p2psia']);
});

test('station airlock override: the air changes, and no part has a covering test', () => {
  const result = assess(passport, { vehicle: 'iss', place: 'airlock' });
  assert.equal(result.env.id, 'iss-airlock');
  assert.equal(result.env.kind, 'certification worst case');
  assert.equal(result.env.o2_percent, 30);
  assert.equal(result.env.pressure_kpa, 70.3);
  assert.deepEqual(statusMap(result), {
    enclosure: 'differs', battery: 'none', gasket: 'differs', wiring: 'none', strap: 'differs',
  });
  assert.deepEqual(result.summary, { applies: 0, differs: 3, none: 2 });
});

test('the airlock place changes the air only on the station', () => {
  const lunar = assess(passport, { vehicle: 'lunar-habitat', place: 'airlock' });
  assert.equal(lunar.env.id, 'lunar-habitat');
  const iss = assess(passport, { vehicle: 'iss', place: 'rack' });
  assert.equal(iss.env.id, 'iss-cabin');
});

test('place flags follow the records and the vehicle named in the data', () => {
  const flags = (result) => Object.fromEntries(result.places.map((p) => [p.id, p.flagged]));
  const iss = assess(passport, { vehicle: 'iss', place: 'locker' });
  assert.deepEqual(flags(iss), { airlock: true, vent: true, power: true, locker: false, rack: false });
  const lunar = assess(passport, { vehicle: 'lunar-habitat', place: 'locker' });
  assert.deepEqual(flags(lunar), { airlock: false, vent: false, power: true, locker: false, rack: false });
  const locker = iss.places.find((p) => p.id === 'locker');
  assert.deepEqual(locker.evidence, ['jsc29353d-powered-hardware-higher-o2-vehicles']);
  assert.deepEqual(iss.places.find((p) => p.id === 'rack').evidence, []);
  assert.ok(lunar.places.find((p) => p.id === 'power').evidence.includes('jsc29353d-partial-g-2w-short-circuit'));
  assert.ok(!iss.places.find((p) => p.id === 'power').evidence.includes('jsc29353d-partial-g-2w-short-circuit'));
  assert.deepEqual(lunar.places.find((p) => p.id === 'airlock').evidence, []);
  for (const place of passport.places) {
    if (place.flag) assert.ok(place.evidence.length > 0, `${place.id} is flagged but has no evidence`);
  }
});

test('powered rule: a powered place adds the powered-item record to every component', () => {
  const powered = assess(passport, { vehicle: 'iss', place: 'power' });
  const calm = assess(passport, { vehicle: 'iss', place: 'rack' });
  const record = passport.rules.powered_evidence[0];
  for (const component of powered.components) assert.ok(component.evidence.includes(record), component.id);
  for (const component of calm.components) assert.ok(!component.evidence.includes(record), component.id);
  assert.deepEqual(statusMap(powered), statusMap(calm), 'powering does not change a status');
});

test('unknown ids throw a clear error', () => {
  assert.throws(() => assess(passport, { vehicle: 'mars', place: 'locker' }), /Unknown vehicle "mars"/);
  assert.throws(() => assess(passport, { vehicle: 'iss', place: 'attic' }), /Unknown place "attic"/);
  assert.throws(() => assess(passport, {}), /Unknown vehicle/);
  const broken = clone(passport);
  broken.vehicles[0].environment = 'nowhere';
  assert.throws(() => assess(broken, { vehicle: 'iss', place: 'rack' }), /Unknown environment "nowhere"/);
  const badResult = clone(passport);
  badResult.components[2].tests[0].result = 'mystery';
  assert.throws(() => assess(badResult, { vehicle: 'iss', place: 'rack' }), /Unknown test result "mystery"/);
});

test('the same input always gives the same output', () => {
  const a = assess(passport, { vehicle: 'iss', place: 'power' });
  const b = assess(clone(passport), { vehicle: 'iss', place: 'power' });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test('the rules read thresholds from the data', () => {
  // Oxygen above the tested level: pressure matches, so the status falls to differs.
  const richer = clone(passport);
  richer.environments.find((e) => e.id === 'iss-cabin').o2_percent = 22;
  assert.equal(statusMap(assess(richer, { vehicle: 'iss', place: 'rack' })).gasket, 'differs');
  // Oxygen below the tested level still applies.
  const leaner = clone(passport);
  leaner.environments.find((e) => e.id === 'iss-cabin').o2_percent = 20;
  assert.equal(statusMap(assess(leaner, { vehicle: 'iss', place: 'rack' })).gasket, 'applies');
  // Pressure tolerance comes from tolerances.pressure_kpa.
  const off = clone(passport);
  off.environments.find((e) => e.id === 'iss-cabin').pressure_kpa = 102.3;
  assert.equal(statusMap(assess(off, { vehicle: 'iss', place: 'rack' })).gasket, 'applies');
  off.environments.find((e) => e.id === 'iss-cabin').pressure_kpa = 102.4;
  assert.equal(statusMap(assess(off, { vehicle: 'iss', place: 'rack' })).gasket, 'differs');
  off.tolerances.pressure_kpa = 5;
  assert.equal(statusMap(assess(off, { vehicle: 'iss', place: 'rack' })).gasket, 'applies');
  // A burn or a failure never covers the air; a test with no pressure never covers it.
  const burn = clone(passport);
  burn.components[2].tests.forEach((t) => { t.result = 'burned-at'; });
  assert.equal(statusMap(assess(burn, { vehicle: 'iss', place: 'rack' })).gasket, 'differs');
  const noPressure = clone(passport);
  noPressure.components[2].tests.forEach((t) => { t.pressure_kpa = null; });
  assert.equal(statusMap(assess(noPressure, { vehicle: 'iss', place: 'rack' })).gasket, 'differs');
  // Dropping the tests of a part leaves it with none.
  const bare = clone(passport);
  bare.components[2].tests = [];
  assert.equal(statusMap(assess(bare, { vehicle: 'iss', place: 'rack' })).gasket, 'none');
});

test('differs lists the nearest tests, never more than the data allows', () => {
  const result = assess(passport, { vehicle: 'iss', place: 'airlock' });
  for (const component of result.components) {
    if (component.status === 'differs') assert.ok(component.evidence.length <= passport.rules.max_evidence_per_differs);
  }
});

test('results carry no verdict words', () => {
  const text = JSON.stringify(assess(passport, { vehicle: 'iss', place: 'power' })) + JSON.stringify(passport);
  assert.doesNotMatch(text, /\b(unsafe|safe|approved|forbidden)\b/i);
});

/* Data checks */

const evidenceIdsIn = (value, found = new Set()) => {
  if (Array.isArray(value)) value.forEach((item) => evidenceIdsIn(item, found));
  else if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      if (/(^|_)(evidence|notes|basis)$/.test(key)) {
        for (const id of [].concat(inner && typeof inner === 'object' && !Array.isArray(inner) ? Object.values(inner).flat() : inner)) {
          if (typeof id === 'string') found.add(id);
        }
      } else evidenceIdsIn(inner, found);
    }
  }
  return found;
};

test('every evidence id in passport.json exists in data/evidence.json', () => {
  const cited = evidenceIdsIn(passport);
  assert.ok(cited.size >= 20, `only ${cited.size} ids found`);
  for (const id of cited) assert.ok(evidenceById.has(id), `passport.json cites "${id}", which data/evidence.json does not hold`);
  for (const component of passport.components) {
    for (const t of component.tests) assert.ok(evidenceById.has(t.evidence), t.evidence);
  }
});

const hasNumber = (text, number) => [String(number), Number(number).toFixed(1)].some(
  (form) => new RegExp(`(?<![\\d.])${form.replace('.', '\\.')}(?!\\d|\\.\\d)`).test(text),
);
const recordText = (id) => {
  const r = evidenceById.get(id);
  return `${r.claim} ${r.quote} ${JSON.stringify(r.conditions)}`;
};

test('every number in an environment appears in a cited record, or is computed from psia', () => {
  for (const env of passport.environments) {
    const text = env.evidence.map(recordText).join(' ');
    for (const key of ['o2_percent', 'o2_max_percent', 'pressure_psia']) {
      if (env[key] === null) continue;
      assert.ok(hasNumber(text, env[key]), `${env.id}.${key} = ${env[key]} is not in its cited records`);
    }
    if (env.computed) {
      assert.equal(env.computed, 'psia times 6.895');
      assert.ok(Math.abs(env.pressure_psia * 6.895 - env.pressure_kpa) < 0.06, `${env.id}: ${env.pressure_psia} psia is not ${env.pressure_kpa} kPa`);
    } else {
      assert.ok(hasNumber(text, env.pressure_kpa), `${env.id}.pressure_kpa = ${env.pressure_kpa} is not in its cited records`);
    }
    assert.ok(env.kind && env.label && env.evidence.length > 0, env.id);
  }
});

test('every number in a test appears in the claim, quote or conditions of its record', () => {
  for (const component of passport.components) {
    for (const t of component.tests) {
      const text = recordText(t.evidence);
      for (const key of ['o2_percent', 'pressure_kpa']) {
        if (t[key] === null) continue;
        assert.ok(hasNumber(text, t[key]), `${component.id}: ${key} = ${t[key]} is not in record ${t.evidence}`);
      }
      assert.ok(t.gravity === null || typeof t.gravity === 'string', `${component.id}: gravity ${t.gravity}`);
      assert.ok(t.result in passport.rules.result_types, `${component.id}: result ${t.result}`);
      assert.ok(t.form === null || (typeof t.form === 'string' && t.form.length > 0), `${component.id}: form ${t.form}`);
    }
  }
  assert.ok(hasNumber(`${passport.tolerances.pressure_kpa}`, passport.tolerances.pressure_kpa));
});

test('the battery has no test result, only notes', () => {
  const battery = passport.components.find((c) => c.id === 'battery');
  assert.deepEqual(battery.tests, []);
  assert.ok(battery.notes.length > 0);
});

test('the fields the figures read are unchanged', () => {
  assert.equal(passport.slug, 'portable-science-instrument');
  assert.equal(passport.name, 'Portable science instrument');
  assert.equal(passport.purpose, 'Handheld measuring device with its own battery.');
  assert.equal(passport.provenance, 'illustrative');
  assert.deepEqual(
    passport.components.map(({ id, name, material, mass_share }) => ({ id, name, material, mass_share })),
    [
      { id: 'enclosure', name: 'Enclosure', material: 'PMMA cast sheet', mass_share: 0.4 },
      { id: 'battery', name: 'Battery pack', material: 'Lithium-ion cells', mass_share: 0.3 },
      { id: 'gasket', name: 'Gaskets', material: 'Silicone rubber, ~1.5 mm', mass_share: 0.1 },
      { id: 'wiring', name: 'Wiring', material: 'PTFE-insulated wire', mass_share: 0.1 },
      { id: 'strap', name: 'Carry strap', material: 'Kevlar/PBI webbing, black', mass_share: 0.1 },
    ],
  );
  assert.deepEqual(passport.places.map((p) => p.id), ['airlock', 'vent', 'power', 'locker', 'rack']);
  assert.deepEqual(passport.vehicles.map((v) => v.id), ['iss', 'lunar-habitat']);
  assert.ok(['iss-cabin', 'iss-airlock', 'lunar-habitat'].every((id) => passport.environments.some((e) => e.id === id)));
});

/* Descriptors, caveats and the records repaired after the judge's third run */

test('no test entry has a gravity or form that its record does not state', () => {
  const entries = passport.components.flatMap((component) => component.tests.map((t) => ({ component, t })));
  assert.ok(entries.length >= 6);
  for (const { component, t } of entries) {
    const record = evidenceById.get(t.evidence);
    for (const key of ['gravity', 'form']) {
      assert.deepEqual(unstatedWords(t[key], record), [], `${component.id}: ${key} "${t[key]}" has words that the claim and quote of ${t.evidence} do not state`);
    }
  }
});

test('the checker for descriptors rejects words a record does not state', () => {
  const record = { claim: 'Silicone is listed at 28% oxygen at 48.2 kPa.', quote: 'Silicone 28 2.0' };
  assert.deepEqual(unstatedWords('silicone', record), []);
  assert.deepEqual(unstatedWords(null, record), []);
  assert.deepEqual(unstatedWords('silicone rubber, about 1.5 mm thick', record), ['rubber', 'about', '1.5', 'mm', 'thick']);
  assert.deepEqual(unstatedWords('earth', record), ['earth']);
  assert.deepEqual(unstatedWords('2', { claim: 'listed at 28', quote: '' }), ['2']);
});

test('the gravity caveat is a cited record: the page and the rules hold no sentence about gravity of their own', () => {
  const caveat = passport.rules.gravity_caveat_evidence;
  assert.equal(caveat[0], 'eclss-tm-essentially-all-flammability-test-data-1g');
  const first = evidenceById.get(caveat[0]);
  assert.match(first.quote, /Essentially all existing test data for flammability of flight materials are from 1-g testing/);
  assert.match(first.claim, /essentially all existing test data for flammability of flight materials are from 1-g testing/);
  const result = assess(passport, { vehicle: 'iss', place: 'locker' });
  assert.deepEqual(result.caveats.gravity_caveat_components, ['gasket']);
  assert.deepEqual(result.caveats.gravity_evidence, caveat);
  assert.ok(!('ground_only_components' in result.caveats));
  const strip = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const file of ['assets/js/passport-rules.js', 'assets/js/passport-ui.js', 'tools/site/passport.mjs']) {
    const code = strip(readFileSync(path.join(root, file), 'utf8'));
    assert.doesNotMatch(code, /gravity is present|run on the ground|on the ground/i, file);
    assert.doesNotMatch(code, /["'`][^"'`\n]*\bgravity\b[^"'`\n]*\s[^"'`\n]*["'`]/, `${file} holds a sentence about gravity`);
  }
});

test('a row gets the gravity caveat only when it applies and no covering test names a gravity of its own', () => {
  const none = assess(passport, { vehicle: 'iss', place: 'airlock' });
  assert.deepEqual(none.caveats.gravity_caveat_components, [], 'rows that differ or have no evidence carry no caveat');
  const lunar = assess(passport, { vehicle: 'lunar-habitat', place: 'locker' });
  assert.deepEqual(lunar.caveats.gravity_caveat_components, ['strap']);
  const labelled = clone(passport);
  labelled.components.find((c) => c.id === 'gasket').tests.forEach((t) => { t.gravity = 'low gravity'; });
  assert.deepEqual(assess(labelled, { vehicle: 'iss', place: 'locker' }).caveats.gravity_caveat_components, []);
});

test('the lunar habitat shows no maximum oxygen: the record behind it is one architecture option of vehicle values', () => {
  const lunar = passport.environments.find((e) => e.id === 'lunar-habitat');
  assert.equal(lunar.o2_max_percent, null);
  assert.ok(!lunar.evidence.some((id) => id.startsWith('early-artemis')), 'the architecture-option record is not cited for the planned habitat air');
  assert.equal(assess(passport, { vehicle: 'lunar-habitat', place: 'rack' }).env.o2_max_percent, null);
  const iss = passport.environments.find((e) => e.id === 'iss-cabin');
  assert.equal(iss.o2_max_percent, 24.1);
  assert.ok(iss.evidence.includes('iss-cabin-control-band-max-o2-24-1'));
});

test('the air-vent place is flagged by the ventilation record, and the provenance note is true', () => {
  const vent = passport.places.find((p) => p.id === 'vent');
  assert.deepEqual(vent.evidence, ['tb008-ventilation-feeds-fire']);
  assert.match(evidenceById.get('tb008-ventilation-feeds-fire').quote, /Ventilation fans on space vehicles replace natural convection and can supply the air a fire needs to burn/);
  assert.doesNotMatch(passport.provenance_note, /tested forms named/);
  assert.match(passport.provenance_note, /material labels are invented/);
});

test('the three records the judge called partial say only what their quotes say', () => {
  const olson = evidenceById.get('olson2004-slight-flow-keeps-near-invisible-flame-alive');
  assert.match(olson.claim, /^The paper says that experiments have shown/);
  assert.match(olson.claim, /reference 4/);
  assert.match(olson.claim, /references 10 and 11/);
  assert.doesNotMatch(olson.material, /Olson|Baum|Wichman|ATHINA|Finger-like|\b1998\b|\b2004\b/);
  const air = evidenceById.get('air-data-not-conservative-for-higher-o2-lower-pressure');
  assert.doesNotMatch(air.material, /\b22\b/);
  const speaker = evidenceById.get('jsc29353b-abs-case-speaker-burned-completely-24-1-o2-aluminum-case-undamaged');
  assert.equal(speaker.conditions.pressure_kpa, 101.4);
  assert.match(speaker.limits, /pressure_kpa value 101\.4[^.]*is a conversion of the 14\.7 psia stated in the quote/);
});
