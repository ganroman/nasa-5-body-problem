// Run: node prototype/cargo-journey-animation.test.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'cargo-journey-animation.html'),'utf8');
const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,{getContext:()=>context});return elements.get(id)}};
const sandbox=vm.createContext({document,window:{},matchMedia:()=>({matches:true}),performance:{now:()=>0},requestAnimationFrame(){}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
const run=s=>vm.runInContext(s,sandbox);
// Verify the animated subset agrees with the source map, including direction and evidence.
const source=fs.readFileSync(path.join(__dirname,'cargo-environment-map.html'),'utf8');
for(const r of run('routes')){
 assert.ok(source.includes(`['${r[0]}','${r[1]}','${r[2]}','${r[3]}'`),r[0]);
 assert.deepEqual(Array.from(run(`point(routes.find(r=>r[0]==='${r[0]}'),0)`)),Array.from(run(`nodes['${r[1]}'].slice(0,2)`)));
 assert.deepEqual(Array.from(run(`point(routes.find(r=>r[0]==='${r[0]}'),1)`)),Array.from(run(`nodes['${r[2]}'].slice(0,2)`)));
}
for(let t=0;t<=30;t+=.5)sandbox.window.renderFrame(t);
assert.equal(run('playing'),false);
assert.equal(run('position'),30);
elements.get('restart').onclick();assert.equal(run('position'),0);assert.equal(run('playing'),true);
elements.get('play').onclick();assert.equal(run('playing'),false);
console.log('PASS: route evidence, directions, endpoints, all chapter frames, reduced motion and playback controls.');

// Surface environments sit within their body; orbital habitats sit beyond its edge.
for(const body of Object.values(run('bodies'))){
 for(const id of body.surface){const [x,y]=run(`nodes['${id}']`);assert.ok(Math.hypot(x-body.x,y-body.y)<body.r,`${id} on its body`)}
 for(const id of body.orbital){const [x,y]=run(`nodes['${id}']`);assert.ok(Math.hypot(x-body.x,y-body.y)>body.r,`${id} in orbit`)}
}
console.log('PASS: lunar and Martian surface / orbital grouping.');
