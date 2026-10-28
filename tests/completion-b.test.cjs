'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadCompletion}=require('../scripts/build_completion.cjs');
const {extendCompletionB,validateCompletionB}=require('../scripts/completion_b.cjs');
const base=loadCompletion(),before=structuredClone(base),bundle=extendCompletionB(base);
test('Bounded B additions preserve every prior identity, record, alias and manifest',()=>{
 assert.deepEqual(base,before);assert.deepEqual(validateCompletionB(bundle,base),[]);
 assert.equal(bundle.characters.length-base.characters.length,3);assert.equal(bundle.locations.length-base.locations.length,1);assert.equal(bundle.series.length-base.series.length,3);assert.equal(bundle.adaptations.length-base.adaptations.length,10);assert.equal(bundle.connections.length-base.connections.length,23);
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

test('Five distinct Corn films join a film franchise without invented direct story adaptations',()=>{
 const ids=['adp:000099','adp:000100','adp:000101','adp:000102','adp:000103'];
 for(const id of ids){const film=bundle.adaptations.find(r=>r.id===id);assert.ok(film);assert.ok(film.summary.en.length>60);assert.equal(film.ratingObservations.length,0);assert.equal(film.makerObservations.length,1);assert.equal(film.makerObservations[0].role,'director');assert.ok(!bundle.connections.some(c=>c.from.id===id&&c.predicate==='adaptation_of'));}
 const series=bundle.series.find(r=>r.id==='ser:000004');assert.equal(series.seriesKind,'film-series');
 assert.deepEqual(bundle.connections.filter(r=>r.to.id===series.id).map(r=>r.from.id),['adp:000007',...ids]);
 assert.ok(bundle.connections.filter(r=>r.to.id===series.id).every(r=>!r.seriesPosition&&r.spoiler.level==='none'));
 assert.equal(bundle.adaptations.filter(r=>r.title==='Children of the Corn').length,3);
});
test('Conflicting Miramax years are retained unselected and US release is separate from screenings',()=>{
 for(const [id,chosen,reported]of [['adp:000099',1993,1991],['adp:000102',1999,1998],['adp:000103',2001,2002]]){
  assert.equal(bundle.adaptations.find(r=>r.id===id).releaseYear,chosen);
  const claims=bundle.claims.filter(c=>c.subject.id===id&&c.fieldPath==='/releaseYear');assert.equal(claims.find(c=>c.selected).value,chosen);const conflict=claims.find(c=>!c.selected);assert.equal(conflict.value,reported);assert.equal(conflict.status,'disputed');assert.equal(bundle.sources.find(s=>s.id===conflict.sourceIds[0]).publisher,'Miramax');
 }
 const film=bundle.adaptations.find(r=>r.id==='adp:000099');assert.deepEqual(film.releaseEvents,[{value:'1993-01-29',precision:'day',meaning:'theatrical-release',territory:'US'},{value:'1992',precision:'year',meaning:'festival-premiere',territory:null}]);
 const changed=structuredClone(bundle);changed.claims.find(c=>c.subject.id===film.id&&!c.selected).selected=true;assert.ok(validateCompletionB(changed,base).some(e=>e.code==='b-conflict-preservation'));
});

test('Pet Sematary Two is a screen sequel with its own writer and no false literary source',()=>{
 const r=bundle.adaptations.find(r=>r.id==='adp:000104');assert.equal(r.title,'Pet Sematary Two');assert.equal(r.releaseEvents[0].value,'1992-08-28');assert.equal(r.makerObservations.find(m=>m.role==='screenwriter').creditText,'Richard Outten');
 assert.ok(r.aliases.some(a=>a.value==='Pet Sematary II'));assert.ok(bundle.connections.some(c=>c.from.id===r.id&&c.predicate==='sequel_to'&&c.to.id==='adp:000038'));assert.ok(!bundle.connections.some(c=>c.from.id===r.id&&c.to.type==='work'));
});
test('Three same-title Corn productions stay distinct and only confirmed adaptations link to the story',()=>{
 assert.deepEqual(bundle.adaptations.filter(r=>r.title==='Children of the Corn').map(r=>[r.id,r.releaseYear]),[['adp:000007',1984],['adp:000105',2009],['adp:000106',2023]]);
 for(const id of ['adp:000105','adp:000106'])assert.ok(bundle.connections.some(c=>c.from.id===id&&c.predicate==='adaptation_of'&&c.to.id==='wrk:000087'));
 const tv=bundle.adaptations.find(r=>r.id==='adp:000105');assert.equal(tv.format,'tv-movie');assert.equal(tv.releaseEvents[0].precision,'year');assert.equal(tv.makerObservations.length,0);
 const cinema=bundle.adaptations.find(r=>r.id==='adp:000106');assert.equal(cinema.releaseEvents[0].value,'2023-03-03');assert.equal(cinema.releaseEvents[0].territory,'US');assert.ok(cinema.verification.open.some(x=>x.includes('worldwide first-release')));assert.equal(cinema.makerObservations.find(m=>m.role==='screenwriter').creditText,'Kurt Wimmer');
 for(const r of [tv,cinema])assert.ok(!bundle.connections.some(c=>c.from.id===r.id&&c.to.id==='ser:000004'));
});

test('Reviewed book introductions enrich existing identities with field-scoped evidence only',()=>{
 const review=require('../data/completion-b/review.json'),introductions=review.enrichments.filter(e=>e.subject.type==='work');assert.equal(introductions.length,24);
 for(const e of introductions){const old=base.works.find(w=>w.id===e.subject.id),w=bundle.works.find(w=>w.id===old.id);assert.equal(w.summary.en,e.value.en);assert.equal(w.originalTitle,old.originalTitle);const c=bundle.claims.find(c=>c.subject.id===w.id&&c.fieldPath==='/summary'&&c.selected);assert.equal(c.status,'verified');assert.deepEqual(c.value,w.summary);assert.ok(c.sourceIds.every(id=>bundle.sources.find(s=>s.id===id).url.startsWith('https://stephenking.com/')));}
 const changed=structuredClone(bundle);changed.works.find(w=>w.id==='wrk:000005').originalTitle='Wrong title';assert.ok(validateCompletionB(changed,base).some(e=>e.code==='b-baseline-record-changed'));
 const unsupported=structuredClone(bundle);unsupported.works.find(w=>w.id==='wrk:000005').summary.en='An invented ending';assert.ok(validateCompletionB(unsupported,base).some(e=>e.code==='b-editorial-evidence'));
});

test('Five publisher-identified English editions preserve all earlier edition and artwork bindings',()=>{
 assert.equal(bundle.editions.length,160);for(const old of base.editions)assert.deepEqual(bundle.editions.find(e=>e.id===old.id),old);assert.deepEqual(bundle.artworks,base.artworks);
 for(const e of bundle.editions.filter(e=>['edn:000155','edn:000156','edn:000157','edn:000158','edn:000159'].includes(e.id))){assert.equal(e.language,'en');assert.equal(e.identityStatus,'identified');assert.equal(e.publisher,'Scribner');assert.equal(e.publicationDate.meaning,'edition-publication');assert.equal(e.publicationDate.precision,'day');assert.ok(base.works.some(w=>w.id===e.publicationOf.id));assert.equal(new Set(bundle.editions.filter(x=>x.isbn13).map(x=>x.isbn13)).size,bundle.editions.filter(x=>x.isbn13).length);}
 assert.equal(bundle.editions.find(e=>e.id==='edn:000155').isbn13,'9781982159375');assert.equal(bundle.editions.find(e=>e.id==='edn:000159').format,'Hardcover');assert.equal(bundle.editions.find(e=>e.id==='edn:000088').isbn13,null);
 const invalid=structuredClone(bundle);invalid.editions.at(-1).isbn13='9781982112395';assert.ok(validateCompletionB(invalid,base).some(e=>e.code==='b-isbn-checksum'));
});

test('Thirty visitor-facing connection copyedits preserve evidence, uncertainty and spoiler boundaries',()=>{
 const edits=require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='connection');assert.equal(edits.length,30);
 for(const e of edits){const old=base.connections.find(c=>c.id===e.subject.id),c=bundle.connections.find(c=>c.id===old.id);for(const k of ['from','to','predicate','certainty','spoiler'])assert.deepEqual(c[k],old[k]);assert.equal(c.explanation.en,e.value.en);assert.doesNotMatch(c.explanation.en,/literary-source field|scene-for-scene|primary wording|production scope|explicitly scoped/);for(const id of e.evidenceFromClaimIds){const oldClaim=base.claims.find(c=>c.id===id),retained=bundle.claims.find(c=>c.id===id);assert.deepEqual(retained,{...oldClaim,selected:false});}if(c.certainty==='strongly-implied')assert.match(c.explanation.en,/uncertain/);}
 const c=structuredClone(bundle);c.connections.find(r=>r.id==='rel:000018').certainty='explicit';assert.ok(validateCompletionB(c,base).some(e=>e.code==='b-baseline-record-changed'));
});

test('Gwendy’s middle novel has one identity, Chizmar authorship and a separately credited King foreword',()=>{
 const work=bundle.works.find(w=>w.id==='wrk:000250');assert.equal(work.originalTitle,"Gwendy's Magic Feather");assert.equal(bundle.works.filter(w=>w.originalTitle===work.originalTitle).length,1);
 const credits=bundle.credits.filter(c=>c.subject.id===work.id);assert.deepEqual(credits.filter(c=>c.role==='author').map(c=>c.personId),['per:000004']);assert.equal(credits.find(c=>c.personId==='per:000001').role,'foreword');assert.equal(credits.filter(c=>c.role==='illustrator').length,2);assert.ok(!credits.some(c=>c.role==='coauthor'));
 assert.deepEqual(bundle.connections.filter(c=>c.to.id==='ser:000005').map(c=>[c.from.id,c.seriesPosition]),[['wrk:000057',1],['wrk:000250',2],['wrk:000063',3]]);
 const e=bundle.editions.find(e=>e.id==='edn:000160');assert.equal(e.publicationOf.id,work.id);assert.equal(e.isbn13,'9781587677311');assert.equal(e.publicationDate.value,'2019-11-19');assert.equal(bundle.publicationEvents.find(p=>p.id==='pub:000258').editionId,e.id);
});
