// Run: node frontend/index.test.cjs  (no backend needed: fetch is mocked with responses shaped like backend/API.md)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const eff = (min, max = min, status = 'sourced') => ({ min, max, status });
const comps = [
  { name: 'Enclosure', original_label: 'PMMA cast sheet', material_id: 'pmma-cast-sheet', identity_confidence: 'exact', mass_share: 0.6 },
  { name: 'Battery pack', original_label: 'Lithium-ion cells', material_id: null, identity_confidence: 'unmatched', mass_share: 0.4 },
];
const compareFor = env => {
  const iss = env === 'iss';
  return {
    environment: iss ? { id: env, name: env, gravity_regime: 'microgravity', gravity_g: 0 } : { id: env, name: env, gravity_regime: 'partial', gravity_g: 0.17 },
    conditions: {
      o2_fraction: { effective: iss ? eff(0.21) : eff(null, null, 'unknown') },
      pressure_kpa: { effective: iss ? eff(101.3) : eff(null, null, 'unknown') },
      temperature_c: { effective: eff(null, null, 'unknown') },
    },
    incomplete_dimensions: iss ? [] : ['o2_fraction', 'pressure_kpa'],
    components: [
      { ...comps[0], component_index: 0, ranked: [
        { observation_id: 7, evidence_class: 'exact', counts: iss ? { match: 2, differs: 1, unknown: 1 } : { match: 0, differs: 1, unknown: 3 }, reasons: ['same material identity'] },
        { observation_id: 9, evidence_class: 'analogue', counts: { match: 0, differs: 0, unknown: 4 }, reasons: [] }] },
      { ...comps[1], component_index: 1, ranked: [] },
    ],
    coverage: { fire: {
      components: [{ component_id: 0, status: 'evidence_found', counts: { exact: 1, related: 0, analogue: 1 } }, { component_id: 1, status: 'gap', counts: { exact: 0, related: 0, analogue: 0 } }],
      summary: { evidence_found: 1, gap: 1, unassessed: 0, denominator: 2, denominator_label: 'components in manifest' },
      assembly: { status: 'gap', reason: 'component evidence does not establish assembly performance' } } },
    observations: { 7: { investigation_accession: 'PSI-25', source_id: 'psi-25-bass-ii' } },
    findings: [], sources: { 'psi-25-bass-ii': { title: 'BASS-II', doi: '10.60555/4qc4-de67' } },
    limitations: ['Evidence comparison only: this is not a safety approval.'],
  };
};
const routes = { '/cargo': [{ slug: 'kit' }], '/environments': [{ id: 'iss', name: 'ISS', gravity_regime: 'microgravity', spaces: { cabin: {} } }, { id: 'moon', name: 'Moon base', gravity_regime: 'partial', gravity_g: 0.17, spaces: { cabin: {} } }],
  '/routes': [{ id: 'R23', from_env: 'iss', to_env: 'moon', description: 'Hypothetical' }],
  '/materials': [{ id: 'pmma-cast-sheet', material_class: 'polymer' }],
  '/cargo/kit': { slug: 'kit', name: 'Science kit', purpose: 'Demo', provenance: 'illustrative', config_version: 1, components: comps } };
const calls = [];
const fetch = async (url, opts) => {
  const p = url.replace('http://localhost:8000', '');
  calls.push(p);
  const data = p === '/scenarios/compare' ? compareFor(JSON.parse(opts.body).scenario.environment_id) : routes[p];
  return { ok: data !== undefined, status: data ? 200 : 404, json: async () => data ?? { detail: 'not found' } };
};

const els = new Map();
const el = id => { if (!els.has(id)) els.set(id, { innerHTML: '', textContent: '', querySelectorAll: () => [] }); return els.get(id); };
const location = { search: '?cargo=kit', hash: '' };
const ctx = vm.createContext({ fetch, location, URLSearchParams, Promise, document: { getElementById: el }, window: { addEventListener() {} } });
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], ctx);
const run = c => vm.runInContext(c, ctx);
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
  for (let i = 0; i < 5; i++) await tick();
  // Screen 1: route R23 gives current location and destination; weights are mass shares.
  const ov = el('app').innerHTML;
  assert.match(ov, /Science kit/);
  assert.match(ov, /60 % of mass/);
  assert.match(ov, /Current location<\/h3><div class="big">ISS/);
  assert.match(ov, /Final destination<\/h3><div class="big">Moon base/);
  assert.match(el('dest-summary').textContent, /fire evidence for 1 of 2 components in manifest, 1 gap/);

  // Pure helpers.
  assert.equal(run("JSON.stringify(extinguisher({name:'Battery pack',original_label:'Lithium-ion cells'}, {}))"), JSON.stringify(['CO₂', 'Cut power first']));
  assert.equal(run("JSON.stringify(extinguisher({name:'Enclosure',original_label:'PMMA',material_id:'pmma-cast-sheet'}, state.materials))"), JSON.stringify(['Water-based foam', 'CO₂']));
  assert.equal(run("fmtValue('o2_fraction', {min:0.21,max:0.21})"), '21 %');
  assert.equal(run("fmtValue('pressure_kpa', {min:null})"), 'unknown');
  const segs = run("donutSegments([{mass_share:0.6},{mass_share:0.4}], ['evidence_found','gap'])");
  assert.ok(Math.abs(segs[0].dash + segs[1].dash + 4 - 2 * Math.PI * 80) < 0.01);

  // Screen 2: destination selected by default; strip names changes from the current location.
  location.hash = '#details'; run('render()');
  for (let i = 0; i < 5; i++) await tick();
  const body = el('body').innerHTML;
  assert.match(body, /ISS → Moon base/);
  assert.match(body, /Oxygen<b>21 % → unknown/);
  assert.match(body, /Gravity<b>µg → 0.17 g/);
  assert.match(body, /Temperature · CO₂<b class="same">unknown at both/);
  assert.doesNotMatch(body, /unknown — no change/);
  assert.match(body, /Enclosure<\/span> match\/differs\/unknown 2\/1\/1 → 0\/1\/3/);
  assert.match(body, /1\/2<\/text>/);                       // count with denominator, never a percentage or verdict
  assert.doesNotMatch(body, /HIGH|MEDIUM|LOW|safe</);
  assert.match(body, /Water-based foam/);
  assert.match(body, /PSI-25/);
  assert.match(body, /Battery pack<\/b> <span class="tag">gap/);
  assert.match(body, /Analogue records .*: 1/);
  assert.equal(calls.filter(c => c === '/scenarios/compare').length, 2); // results cached per environment

  // Selecting the current location says so instead of diffing against itself.
  run("state.selected='iss'; render()");
  for (let i = 0; i < 5; i++) await tick();
  assert.match(el('body').innerHTML, /This is the cargo's current location/);
  console.log('frontend ok');
})().catch(e => { console.error(e); process.exit(1); });
