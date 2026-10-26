'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {ROOT,loadBundle}=require('../scripts/validate_foundation.cjs');
const {readGenerated,resolveAlias}=require('../scripts/foundation_compat.cjs');
const {generateShadow,hash}=require('../scripts/migrate_shadow.cjs');
const {validateShadow}=require('../scripts/validate_shadow.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const db=readGenerated('catalog.js','DB');
const allocation={...read('data/migration/id-register.json').entities,...read('data/migration/batch-02-register.json').entities};
const fresh=()=>({bundle:loadBundle(path.join(ROOT,'data/v2-shadow')),ledger:read('data/migration/differences.json')});
test('Batch 02 adds 170 works, reuses three library identities and preserves every Batch 01 entity',()=>{
 const {bundle}=fresh();const old=generateShadow(ROOT,{batch:'01'});const current=generateShadow(ROOT);
 assert.equal(old.bundle.works.length,71);assert.equal(old.differences.fields.filter(f=>f.disposition==='mapped').length,550);
 const overlay=read('data/migration/batch-02-register.json');
 for(const[id,ref]of Object.entries(overlay.preservedEntities))assert.equal(hash(JSON.stringify(bundle[ref.table].find(r=>r.id===id))),ref.sha256,id);
 assert.equal(bundle.works.length+bundle.collections.length,db.works.length);
 assert.equal(current.stories.review.newWorkCount,170);assert.equal(current.stories.review.reusedIdentities.length,3);
 assert.equal(current.stories.views.views.length,173);
 assert.equal(new Set(bundle.works.map(w=>w.id)).size,241);
});
test('Every story title, type and legacy route projects independently to exactly one work',()=>{
 const {bundle}=fresh();const kinds={'Verhaal':'short-story','Novelle':'novella','Gedicht':'poem','Scenario':'screenplay','Essay':'essay'};
 for(const s of db.stories){
  const target=allocation[s.workId];const work=bundle.works.find(w=>w.id===target.id);assert.ok(work);assert.equal(work.originalTitle,s['Engelse verhaalnaam']);assert.equal(work.kind,kinds[s.Type]);
  const resolved=resolveAlias(bundle,`https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=en#stories?item=${encodeURIComponent(s.id)}&q=King&filter=collections&sort=title`);
  assert.equal(resolved.target.id,target.id);assert.deepEqual(resolved.state,{view:'stories',q:'King',filter:'collections',sort:'title',language:'en'});
  assert.equal(resolveAlias(bundle,`#films?item=${encodeURIComponent(s.id)}`),null);
 }
 for(const s of db.stories.filter(s=>s.standaloneBookId))assert.equal(resolveAlias(bundle,s.id).target.id,resolveAlias(bundle,s.standaloneBookId).target.id);
 assert.notEqual(allocation['work:hearts-in-atlantis'].id,allocation['work:collection:hearts-in-atlantis'].id);
});
test('151 story pairs and four collected novels remain unique many-to-many memberships without invented order',()=>{
 const {bundle}=fresh(),views=read('data/migration/story-views.json').views;const members=bundle.collectionMemberships;
 assert.equal(members.length,155);assert.equal(new Set(members.map(m=>m.workId+'|'+m.collectionId)).size,155);
 assert.ok(members.every(m=>m.order===null&&m.editionIds.length===0));
 assert.equal(views.filter(v=>v.membershipIds.length>1).length,6);assert.equal(views.filter(v=>!v.membershipIds.length).length,28);
 for(const s of db.stories){
  const view=views.find(v=>v.legacyStoryId===s.id);assert.equal(view.workId,allocation[s.workId].id);assert.equal(view.membershipIds.length,s.collectionIds.length);
  for(const cid of s.collectionIds){const b=db.books.find(b=>b.id===cid);assert.ok(members.some(m=>m.workId===view.workId&&m.collectionId===allocation[b.workId].id));}
  if(!s.defaultCollectionId)assert.equal(view.defaultMembershipId,null);
  else{const chosen=members.find(m=>m.id===view.defaultMembershipId);const b=db.books.find(b=>b.id===s.defaultCollectionId);assert.equal(chosen.collectionId,allocation[b.workId].id);assert.equal(chosen.workId,view.workId);}
 }
 const bachman=allocation['work:collection:the-bachman-books'].id;assert.equal(members.filter(m=>m.collectionId===bachman).length,4);
});
test('All named authors and scoped roles survive without duplicate shared credits or a Bachman co-author',()=>{
 const {bundle}=fresh();
 for(const s of db.stories){
  const credits=bundle.credits.filter(c=>c.subject.id===allocation[s.workId].id);assert.equal(credits.length,s.authors.length);
  for(const a of s.authors){const person=bundle.people.find(p=>p.name===a.name);assert.ok(person);const credit=credits.find(c=>c.personId===person.id);assert.ok(credit);assert.equal(credit.role,a.role);assert.equal(credit.creditedAs,a.creditedAs||null);}
 }
 assert.equal(bundle.people.filter(p=>p.name==='Joe Hill').length,1);assert.ok(!bundle.people.some(p=>p.name==='Richard Bachman'));
 assert.equal(bundle.credits.length,272);
});
test('150 supported pairs and five uncertain pairs retain field evidence and independent-confirmation limits',()=>{
 const {bundle}=fresh(),decisions=read('data/migration/batch-02-decisions.json');
 assert.equal(decisions.memberships.filter(m=>m.verification==='source-supported').length,150);assert.equal(decisions.memberships.filter(m=>m.verification==='provisional').length,5);
 for(const m of bundle.collectionMemberships){const row=decisions.memberships.find(r=>r.id===m.id);const claims=bundle.claims.filter(c=>m.verification.claimIds.includes(c.id));assert.equal(claims.length,2);assert.ok(claims.every(c=>!c.independentlyConfirmed&&c.sourceIds.length));assert.ok(claims.every(c=>c.status===(row.verification==='source-supported'?'verified':'provisional')));}
 const weather=decisions.memberships.find(r=>r.workId===allocation['work:under-the-weather'].id&&r.collectionId===allocation['work:collection:full-dark-no-stars'].id);assert.equal(weather.verification,'source-supported');assert.equal(weather.editionScope,'mass-market edition; exact edition identity not migrated');
 assert.equal(decisions.titleVariants.length,3);assert.equal(decisions.uncertainStoryRecords.length,173);
 for(const variant of decisions.titleVariants){const s=db.stories.find(s=>s.id===variant.legacyStoryId);assert.ok(bundle.works.find(w=>w.id===allocation[s.workId].id).aliases.some(a=>a.value===variant.sourceTitle));}
});
test('Invalid membership endpoints, duplicate pairs, missing claims and assumed order fail',()=>{
 for(const mutate of [b=>b.collectionMemberships[0].workId=b.collections[0].id,b=>b.collectionMemberships[0].order=1,b=>b.collectionMemberships.push({...b.collectionMemberships[0],id:'mem:999999'}),b=>b.claims.find(c=>c.subject.id===b.collectionMemberships[0].id).sourceIds=[]]){
  const {bundle,ledger}=fresh();mutate(bundle);assert.equal(validateShadow(bundle,ledger,{checkGenerated:false}).valid,false);
 }
});
test('A wrong default membership or unjustified evidence upgrade fails independently of native records',()=>{
 const {bundle,ledger}=fresh(),views=read('data/migration/story-views.json');views.views[0].defaultMembershipId='mem:999999';
 assert.ok(validateShadow(bundle,ledger,{checkGenerated:false,views}).errors.some(e=>e.code==='default-membership'));
 const decisions=read('data/migration/batch-02-decisions.json');decisions.memberships.find(m=>m.verification==='provisional').verification='source-supported';
 assert.ok(validateShadow(bundle,ledger,{checkGenerated:false,decisions}).errors.some(e=>e.code==='membership-evidence'));
});
test('Batch 02 creates no edition, own story cover, adaptation, publication event or Tower relationship',()=>{
 const {bundle}=fresh();const old=generateShadow(ROOT,{batch:'01'}).bundle;
 for(const table of ['editions','artworks','publicationEvents','adaptations','characters','locations','externalReferences'])assert.deepEqual(bundle[table],old[table]);
 assert.equal(bundle.connections.length,9);for(const r of old.connections)assert.deepEqual(bundle.connections.find(c=>c.id===r.id),r);
 const {ledger}=fresh();assert.equal(ledger.completeMigration,false);assert.equal(ledger.batch02RecordCount,173);
 assert.ok(ledger.fields.some(f=>f.pointer.includes('/stories/')&&f.pointer.endsWith('/reportedDate')&&f.disposition==='retained-in-source-not-migrated'));
});

test('Explicitly requested trilogy addition reuses Other Worlds Than These and contains no spoilers',()=>{
 const {bundle}=fresh();const works=bundle.works.filter(w=>w.originalTitle==='Other Worlds Than These');assert.equal(works.length,1);assert.equal(works[0].id,'wrk:000067');
 const relation=bundle.connections.find(r=>r.id==='rel:000009');assert.equal(relation.from.id,works[0].id);assert.equal(relation.to.id,allocation['work:black-house'].id);assert.equal(relation.predicate,'sequel_to');assert.equal(relation.certainty,'explicit');assert.deepEqual(relation.spoiler,{level:'none',workIds:[]});
 const claims=bundle.claims.filter(c=>relation.verification.claimIds.includes(c.id));assert.equal(claims.length,5);assert.ok(claims.every(c=>c.status==='verified'&&c.sourceIds.length===2&&!c.independentlyConfirmed));
 assert.ok(!/Jack|Tower|Territories|Mid-World|Crimson|ending/.test(relation.explanation.en));
 const review=read('data/migration/batch-02-decisions.json');assert.deepEqual(review.trilogy.orderedWorkIds,['wrk:000001','wrk:000002','wrk:000067']);assert.equal(review.trilogy.newWorkIdentities,0);
});
