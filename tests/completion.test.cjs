'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loadCompletion,generate,reportedDate}=require('../scripts/build_completion.cjs');
const {validateCompletion}=require('../scripts/validate_completion.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));
const options={checkGenerated:false,checkBaseline:false};
test('Completion A validates registered deltas and preserves the frozen releases',()=>assert.deepEqual(validateCompletion(),{valid:true,errors:[]}));
test('A forged edition ISBN, missing source claim and duplicate story identity are rejected',()=>{
 const e=loadCompletion();e.editions[0].isbn13='9789021037401';assert.ok(validateCompletion(e,options).errors.some(e=>e.code==='isbn-checksum'||e.code==='edition-rebound'));
 const c=loadCompletion();c.claims=c.claims.filter(x=>!(x.subject.id==='wrk:000242'&&x.fieldPath==='/originalTitle'));assert.equal(validateCompletion(c,options).valid,false);
 const d=loadCompletion();d.works.push({...structuredClone(d.works[0]),id:'wrk:999999'});assert.ok(validateCompletion(d,options).errors.some(e=>e.code==='duplicate-work'));
});
test('Secret Windows memberships reuse the three known stories and never claim contents order',()=>{
 const b=loadCompletion(),c=b.collections.find(c=>c.originalTitle.startsWith('Secret Windows:'));
 const rows=b.collectionMemberships.filter(m=>m.collectionId===c.id);assert.equal(rows.length,3);assert.deepEqual(rows.map(x=>x.workId).sort(),read('data/completion/review.json').secretWindowsMemberships.sort());assert.ok(rows.every(m=>m.order===null&&m.editionIds.length===0));
 const credits=b.credits.filter(x=>x.subject.id===c.id);assert.ok(credits.some(x=>x.personId==='per:000002'&&x.role==='foreword'));assert.equal(credits.some(x=>x.personId==='per:000002'&&x.role==='coauthor'),false);
});
test('Pseudonyms, illustration, musical credits and screenplay identities stay distinct',()=>{
 const b=loadCompletion();assert.equal(b.people.some(p=>p.name==='Beryl Evans'),false);assert.ok(b.people.find(p=>p.id==='per:000001').pseudonyms.includes('Beryl Evans'));
 const hansel=b.works.find(w=>w.originalTitle==='Hansel and Gretel');assert.equal(hansel.kind,'children-book');const sendak=b.people.find(p=>p.name==='Maurice Sendak');assert.ok(b.credits.some(c=>c.subject.id===hansel.id&&c.personId===sendak.id&&c.role==='illustrator'));
 const ghost=b.works.find(w=>w.originalTitle==='Ghost Brothers of Darkland County');assert.equal(ghost.kind,'dramatic-work');assert.ok(b.publicationEvents.some(p=>p.subject.id===ghost.id&&p.eventType==='performance-premiere'));assert.equal(b.adaptations.length,96);
 const storm=b.works.find(w=>w.originalTitle==='Storm of the Century');assert.equal(storm.kind,'screenplay');
});
test('Control edition evidence does not overwrite Carrie with the ISBN now on its source page',()=>{
 const {ledger}=generate(),b=loadCompletion(),old=read('data/v2-shadow/editions.json');
 assert.equal(ledger.editions.filter(r=>r.control&&r.language==='en').length,6);assert.equal(ledger.editions.filter(r=>r.control&&r.language==='nl').length,6);
 assert.deepEqual(b.editions.find(e=>e.id==='edn:000005'),old.find(e=>e.id==='edn:000005'));
 assert.ok(b.editions.find(e=>e.id==='edn:000001').publicationDate.value.startsWith('2026-'));assert.equal(b.editions.find(e=>e.id==='edn:000003').format,'Luisterboek');
 assert.ok(b.editions.filter(e=>e.language==='en').every(e=>e.publicationDate===null&&e.isbn13===null));
});
test('Date precision and release semantics never manufacture a first day or first publication',()=>{
 assert.equal(reportedDate('November 1984'),'1984-11');assert.equal(reportedDate('Unreleased'),null);assert.equal(reportedDate('September 15th, 2001'),'2001-09-15');assert.equal(reportedDate('2000'),'2000');
 const b=loadCompletion();const glass=b.publicationEvents.find(p=>p.subject.id==='wrk:000224'&&p.eventType==='first-publication');assert.equal(glass.date.value,'1967');assert.equal(glass.date.precision,'year');
 const gap=generate().ledger.publicationGaps.find(x=>x.legacyId==='stories:paranoid-a-chant');assert.equal(b.publicationEvents.find(p=>p.id===gap.publicationId).eventType,'source-reported-release');
});
test('Every old unresolved source row remains traceable; variants do not create new works',()=>{
 const {concordance,ledger}=generate();assert.equal(concordance.index.length,357);assert.equal(concordance.bibliography.length,509);assert.equal(ledger.counts.works,249);assert.equal(ledger.counts.collections,16);
 const novels=concordance.index.filter(r=>r.type==='Novel');assert.equal(novels.length,10);assert.ok(novels.every(r=>r.target));
 const n=concordance.bibliography.find(r=>r.url.endsWith('/short_story/n.html'));assert.equal(n.target.id,'wrk:000171');
 for(const r of concordance.bibliography.filter(r=>r.aliasEvidence)){assert.equal(r.aliasEvidence.legacyUrl,r.url);assert.ok(read('data/reference/official.json').index.some(i=>i.url===r.aliasEvidence.officialUrl&&i.title===r.aliasEvidence.officialTitle));}
});
test('All 234 rights dossiers remain unsent and cannot grant public display',()=>{
 const r=read('data/completion/rights-dossiers.json');assert.equal(r.nlCovers.length,66);assert.equal(r.englishCovers.length,86);assert.equal(r.posters.length,82);
 assert.ok([...r.nlCovers,...r.englishCovers,...r.posters].every(x=>x.displayAllowed===false&&x.permissionStatus==='not-requested'&&x.rightsHolder===null));
 assert.equal(read('data/media/permissions.json').decisions.length,0);
});
