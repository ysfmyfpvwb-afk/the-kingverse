'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadCompletion}=require('../scripts/build_completion.cjs');
const {extendCompletionB,validateCompletionB}=require('../scripts/completion_b.cjs');
const base=loadCompletion(),before=structuredClone(base),bundle=extendCompletionB(base);
test('Bounded B additions preserve every prior identity, record, alias and manifest',()=>{
 assert.deepEqual(base,before);assert.deepEqual(validateCompletionB(bundle,base),[]);
 assert.equal(bundle.characters.length-base.characters.length,3);assert.equal(bundle.locations.length-base.locations.length,1);assert.equal(bundle.series.length-base.series.length,1);assert.equal(bundle.adaptations.length-base.adaptations.length,2);assert.equal(bundle.connections.length-base.connections.length,10);
 assert.throws(()=>extendCompletionB(bundle),/collision|already exists/);
});
test('The Hodges sequence links exactly the three existing novels with supported positions',()=>{
 const rows=bundle.connections.filter(c=>c.to.id==='ser:000003');assert.deepEqual(rows.map(r=>[r.from.id,r.seriesPosition]),[['wrk:000052',1],['wrk:000054',2],['wrk:000055',3]]);assert.ok(rows.every(r=>r.predicate==='part_of_series'&&r.spoiler.level==='none'));
});
test('New Tower names are spoiler-safe without identities, biographies or character outcomes',()=>{
 assert.deepEqual(bundle.characters.slice(-3).map(c=>c.name),['Eddie Dean','Susannah Dean','Jake Chambers']);
 assert.ok(bundle.characters.slice(-3).every(c=>c.aliases.length===0&&c.spoiler.level==='none'&&!('summary'in c)));
 const names=['Eddie Dean','Susannah Dean','Jake Chambers'];for(const name of names)assert.equal(bundle.characters.filter(c=>c.name===name).length,1);
 const added=bundle.connections.slice(-8);assert.ok(added.every(r=>['none','premise'].includes(r.spoiler.level)&&r.certainty==='explicit'));
 assert.ok(!JSON.stringify(added).match(/death|dies|marries|revealed to be|severed|addict|Brady|suicide/i));
 assert.equal(bundle.locations.find(l=>l.id==='loc:000003').locationKind,'world');
});
test('Missing claims, wrong endpoints, changed source binding and unreviewed series order are rejected',()=>{
 for(const mutate of [b=>b.connections.at(-1).seriesPosition=2,b=>b.connections.at(-1).to.id='ser:999999',b=>b.claims.at(-1).sourceIds=['src:000001'],b=>b.characters.at(-1).name='Unknown person',b=>b.registry.entries=b.registry.entries.filter(r=>r.id!=='chr:000009')]){const b=structuredClone(bundle);mutate(b);assert.ok(validateCompletionB(b,base).length);}
});

test('Missing 2002 and 2019 screen productions have distinct identities and field-scoped release evidence',()=>{
 const fire=bundle.adaptations.find(a=>a.id==='adp:000097'),creep=bundle.adaptations.find(a=>a.id==='adp:000098');
 assert.equal(fire.title,'Firestarter 2: Rekindled');assert.equal(fire.format,'miniseries');assert.equal(fire.releaseYear,2002);assert.deepEqual(fire.releaseEvents,[{value:'2002-03',precision:'month',meaning:'source-reported-release',territory:'US'}]);
 assert.equal(creep.title,'Creepshow');assert.equal(creep.format,'tv-series');assert.equal(creep.releaseYear,2019);assert.equal(creep.releaseEvents[0].value,'2019-09-26');assert.equal(creep.statusHistory[0].status,'released');
 assert.deepEqual(base.adaptations.find(a=>a.id==='adp:000009'),bundle.adaptations.find(a=>a.id==='adp:000009'));
 assert.equal(bundle.adaptations.filter(a=>a.title==='Creepshow').length,2);assert.equal(bundle.adaptations.filter(a=>a.title==='Firestarter').length,2);
 const sequel=bundle.connections.find(c=>c.id==='rel:000103');assert.equal(sequel.predicate,'sequel_to');assert.equal(sequel.from.id,fire.id);assert.equal(sequel.to.id,'adp:000019');
 assert.equal(bundle.connections.some(c=>c.from.id===fire.id&&c.predicate==='adaptation_of'),false);assert.equal(bundle.connections.some(c=>c.from.id===creep.id&&c.to.type==='work'),false);
 for(const a of [fire,creep]){assert.equal(a.ratingObservations.length,0);assert.ok(a.summary.en.length>30);for(const h of a.statusHistory)for(const id of h.claimIds){const c=bundle.claims.find(c=>c.id===id);assert.equal(c.subject.id,a.id);assert.equal(c.fieldPath,'/statusHistory');assert.equal(c.status,'verified');}}
 const missing=structuredClone(bundle);missing.adaptations.find(a=>a.id===fire.id).statusHistory[0].claimIds=['clm:000001'];assert.ok(validateCompletionB(missing,base).some(e=>e.code==='b-status-evidence'));
});

test('Creepshow television series links to the 1982 film without inventing a literary source',()=>{
 const rel=bundle.connections.find(c=>c.id==='rel:000104');assert.deepEqual(rel.from,{type:'adaptation',id:'adp:000098'});assert.deepEqual(rel.to,{type:'adaptation',id:'adp:000009'});assert.equal(rel.predicate,'inspired_by');assert.ok(!bundle.connections.some(c=>c.from.id==='adp:000098'&&c.to.type==='work'));
});
