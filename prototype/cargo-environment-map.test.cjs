// Run: node prototype/cargo-environment-map.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, 'cargo-environment-map.html'), 'utf8');
const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, {innerHTML:'', addEventListener(){}});
    return elements.get(id);
  },
  querySelectorAll(){return [];},
  addEventListener(){}
};
const context = vm.createContext({document});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const run = code => vm.runInContext(code, context);
assert.equal(run('new Set(ENV.map(e=>e.id)).size'), 10);
assert.equal(run('new Set(ROUTES.map(r=>r.id)).size'), 24);
assert.ok(run('ROUTES.every(r=>BY_ID[r.from] && BY_ID[r.to] && r.from!==r.to && STATUS[r.status] && SOURCES[r.source] && r.cargo.every(c=>CARGO[c]))'));
for (const relative of Object.values(run('SOURCES'))) assert.ok(fs.existsSync(path.resolve(__dirname, relative)), relative);
// Missing ISS connections must be visible without being promoted to announced services.
assert.equal(run("ROUTES.filter(r=>r.from==='iss' && ['gateway','moon','ilrs'].includes(r.to)).length"), 3);
assert.equal(run("ROUTES.filter(r=>['R22','R23','R24'].includes(r.id)).map(r=>r.to).join(',')"), 'gateway,moon,ilrs');
assert.ok(run("ROUTES.filter(r=>['R22','R23','R24'].includes(r.id)).every(r=>r.status==='illustrative' && r.source==='journey' && r.transport.includes('No announced') && r.contents.includes('Hypothetical'))"));
assert.equal(run("state.status='illustrative'; state.q='iss'; filteredRoutes().map(r=>r.id).join(',')"), 'R22,R23,R24');
assert.equal(run("state.status='reference'; filteredRoutes().length"), 0);
run("state.q=''");
assert.equal(run("state.status='operating'; filteredRoutes().length"), 3);
assert.equal(run("state.cargo='waste'; filteredRoutes().map(r=>r.id).join(',')"), 'R03');
assert.equal(run("state.status='all'; state.cargo='returns'; filteredRoutes().length"), 7);
assert.equal(run("state.cargo='all'; state.q='batteries'; filteredRoutes().length > 0"), true);
assert.equal(run("state.q='not-a-real-cargo'; render(); filteredRoutes().length"), 0);
assert.match(elements.get('routes-view').innerHTML, /No routes match/);
run("state.q=''; state.selected={type:'env',id:'iss'}; render()");
assert.match(elements.get('detail').innerHTML, /≈21.2 · derived/);
assert.ok(run("ENV.filter(e=>!['iss','outside'].includes(e.id)).every(e=>!e.pressure && !e.oxygen)"));
for (const id of run('ROUTES.map(r=>r.id)')) {
  run(`state.selected={type:'route',id:'${id}'}; render()`);
  assert.ok(elements.get('detail').innerHTML.includes(id));
}
for (const view of ['map', 'routes', 'dimensions']) {
  run(`state.view='${view}'; render()`);
  assert.equal(elements.get(view+'-view').hidden, false);
}
// Opposite routes must use different curves so both directions can be selected.
const paths = [...elements.get('map').innerHTML.matchAll(/<path class="line" d="([^"]+)"/g)].map(m=>m[1]);
assert.equal(paths.length, 24);
const normalized = paths.map(p=>{
  const [sx,sy,cx,cy,tx,ty] = p.match(/-?\d+(?:\.\d+)?/g).map(Number);
  return JSON.stringify([[sx,sy],[tx,ty]].sort().concat([[cx,cy]]));
});
assert.equal(new Set(normalized).size, paths.length);
console.log('PASS: route integrity, source links, filters, empty state, profiles, view rendering and distinct directional curves.');
