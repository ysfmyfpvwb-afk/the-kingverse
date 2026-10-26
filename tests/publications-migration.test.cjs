'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {loadBundle,validate,ROOT}=require('../scripts/validate_foundation.cjs');
const {readGenerated}=require('../scripts/foundation_compat.cjs');
const {generateShadow,hash}=require('../scripts/migrate_shadow.cjs');
const {validateCoverProvenance}=require('../scripts/validate_cover_provenance.cjs');
const read=n=>JSON.parse(fs.readFileSync(ROOT+'/'+n,'utf8'));
const fresh=()=>loadBundle(ROOT+'/data/v2-shadow');const policy=()=>read('data/migration/cover-provenance.json');
const db=readGenerated('catalog.js','DB');
test('All 150 remaining edition examples reuse registered subjects and preserve every legacy identity fact',()=>{
 const b=fresh(),r=read('data/migration/batch-03-register.json'),a=new Map(b.registry.aliases.map(x=>[x.alias,x.target]));
 assert.equal(Object.keys(r.editions).length,150);assert.equal(b.editions.length,154);
 assert.equal(b.editions.filter(e=>e.language==='en').length,86);assert.equal(b.editions.filter(e=>e.language==='nl').length,68);
 for(const e of db.editions){const n=b.editions.find(x=>x.id===a.get(e.id).id);assert.deepEqual(n.publicationOf,a.get(e.workId));assert.equal(n.language,e.language);assert.equal(n.title,e.title);assert.equal(n.isbn13,e.isbn);assert.equal(n.identityStatus,'incomplete-example');}
 for(const id of Object.values(r.editions))assert.match(id,/^edn:\d{6}$/);
 assert.equal(b.works.length,241);assert.equal(b.collections.length,15);
});
test('Publisher matching certifies only exact title, language and ISBN fields, never an entire printing',()=>{
 const b=fresh(),views=read('data/migration/edition-views.json').views,dutch=read('data/reference/dutch.json');assert.equal(views.filter(v=>v.evidence).length,66);
 for(const v of views){const e=b.editions.find(x=>x.id===v.editionId);assert.equal(e.publisher,null);assert.equal(e.publicationDate,null);assert.equal(e.format,null);
  if(v.evidence){const snapshot=dutch.records.find(x=>x.url===v.evidence.url&&x.kind==='publisher');assert.equal(snapshot.title,e.title);assert.equal(snapshot.isbn,e.isbn13);assert.equal(snapshot.language,'nl-NL');assert.deepEqual(v.sourceSupportedIdentityFields,['title','language','isbn13']);}
 }
 assert.equal(views.filter(v=>v.language==='nl'&&!v.evidence).length,2);
 assert.equal(views.filter(v=>v.language==='en'&&v.evidence).length,0);
});
test('Publication observations deduplicate book/story views without inventing first-publication dates',()=>{
 const b=fresh(),review=read('data/migration/batch-03-decisions.json');assert.equal(b.publicationEvents.length,239);assert.equal(review.publications.newlyMigrated,237);
 assert.deepEqual(review.publications.byKind,{'source-reported-release':226,'edition-variant-reported-release':4,'legacy-bibliographic-year':3,'serial-part':6});
 assert.equal(review.publications.coalescedObservations.length,3);assert.equal(review.publications.missingReportedDate.length,30);
 const keys=b.publicationEvents.map(p=>JSON.stringify([p.subject.id,p.eventType,p.date.value,p.reportedTitle||'']));assert.equal(new Set(keys).size,keys.length);
 assert.ok(b.publicationEvents.every(p=>p.eventType!=='first-publication'&&p.date.meaning===p.eventType));
 for(const c of review.dateConflicts){const events=b.publicationEvents.filter(p=>p.subject.id===c.subject.id);assert.ok(events.some(p=>p.eventType==='legacy-bibliographic-year'&&p.date.value===String(c.legacyYear)));assert.ok(events.some(p=>p.eventType==='source-reported-release'&&p.date.value===c.reportedDate));}
 assert.equal(review.dateConflicts.length,3);
});
test('Serial parts and manifestation titles preserve date precision without creating literary works or phantom editions',()=>{
 const b=fresh(),rows=read('data/publications.json');assert.equal(rows.length,10);
 for(const r of rows){const p=b.publicationEvents.find(p=>p.reportedTitle===r.title);assert.ok(p);assert.equal(p.date.value,r.reportedDate);assert.equal(p.date.precision,({4:'year',7:'month',10:'day'})[r.reportedDate.length]);assert.equal(p.editionId,null);assert.equal(p.part,null);assert.equal(p.eventType,r.kind==='serial-part'?'serial-part':'edition-variant-reported-release');}
 assert.equal(b.publicationEvents.filter(p=>!p.publisher).length,147);
});
test('Invalid ISBN, duplicate edition ISBN, missing work and missing language fail native validation',()=>{
 for(const [mutate,code]of [[b=>b.editions.at(-1).isbn13='9789021037401','isbn-checksum'],[b=>b.editions.at(-1).isbn13=b.editions[0].isbn13,'isbn-conflict'],[b=>b.editions.at(-1).publicationOf.id='wrk:999999','missing-reference'],[b=>delete b.editions.at(-1).language,'schema']]){const b=fresh();mutate(b);assert.ok(validate(b,{checkCompatibility:false}).errors.some(e=>e.code===code),code);}
});
test('152 historical cover references retain exact edition ownership and URL; two explicit missing-cover decisions',()=>{
 const b=fresh(),m=readGenerated('media.js','MEDIA'),aliases=new Map(b.registry.aliases.map(a=>[a.alias,a.target.id]));assert.equal(b.artworks.filter(a=>a.kind==='cover').length,152);
 for(const old of Object.values(m.covers)){const a=b.artworks.find(a=>a.id===aliases.get(old.id));assert.ok(a);assert.equal(a.editionId,aliases.get(old.editionId));assert.equal(a.url,old.image);assert.equal(a.language,old.language);}
 const p=policy();assert.equal(p.covers.length,154);assert.equal(p.covers.filter(c=>!c.artworkId).length,2);assert.ok(p.covers.every(c=>c.fallback==='placeholder'&&!c.displayAllowed&&!c.approvedLocalAsset));assert.deepEqual(validateCoverProvenance(p,b),[]);
 const library=new Set(db.books.map(x=>aliases.get(x.workId)));const standaloneExamples=b.editions.filter(e=>!library.has(e.publicationOf.id));assert.equal(standaloneExamples.length,5);for(const e of standaloneExamples){assert.ok(e.isbn13);assert.ok(read('data/migration/edition-views.json').views.find(v=>v.editionId===e.id).evidence);}
});
test('Display permission fails closed for visual-only approval, absent rights evidence and Referer refusal',()=>{
 const b=fresh();for(const mutate of [p=>p.covers[0].displayAllowed=true,p=>{const c=p.covers[0];c.rights.status='allowed';c.displayAllowed=true;c.delivery={status:'approved',reliable:true};c.availability.status='available';},p=>{const c=p.covers.find(c=>c.availability.status==='referrer-dependent-refusal');c.delivery.reliable=true;},p=>p.covers[0].approvedLocalAsset='/unauthorized.jpg']){const p=policy();mutate(p);assert.ok(validateCoverProvenance(p,b).length);}
 assert.equal(policy().covers.filter(c=>c.availability.status==='referrer-dependent-refusal').length,2);assert.equal(policy().covers.filter(c=>c.rights.status==='allowed').length,0);
 const p=policy();p.covers[0].editionId=p.covers[1].editionId;assert.ok(validateCoverProvenance(p,b).some(e=>e.code==='cover-policy-owner'));
});
test('Supplementary source fields remain exhaustively hashed and reproducible without licensing image evidence',()=>{
 const fields=read('data/migration/batch-03-source-fields.json').fields,review=read('data/migration/batch-03-decisions.json');assert.equal(new Set(fields.map(f=>f.source+'#'+f.pointer)).size,fields.length);
 for(const f of fields){assert.match(f.sourceValueSha256,/^[0-9a-f]{64}$/);assert.ok(['mapped','retained-in-source-not-migrated'].includes(f.disposition));}
 assert.equal(review.sourceFields.supplementary['media.js'].mapped,912);assert.equal(review.sourceFields.supplementary['data/publications.json'].mapped,50);
 for(const f of fields.filter(f=>f.source.includes('image-')))assert.equal(f.disposition,'retained-in-source-not-migrated');
 assert.deepEqual(generateShadow().publications.supplementary.fields,fields);
});
test('All Batch 02 entities and registrations remain exact, including coauthors, Bachman, memberships and trilogy',()=>{
 const b=generateShadow(ROOT,{batch:'03'}).bundle,r=read('data/migration/batch-03-register.json'),old=generateShadow(ROOT,{batch:'02'}).bundle;const map=new Map(Object.values(b).filter(Array.isArray).flat().filter(x=>x.id).map(x=>[x.id,x]));
 for(const[id,snapshot]of Object.entries(r.preservedEntities))assert.equal(hash(JSON.stringify(map.get(id))),snapshot.sha256,id);
 for(const table of ['works','collections','credits','people','connections','collectionMemberships','adaptations'])assert.deepEqual(b[table],old[table],table);
 assert.ok(b.works.some(w=>w.id==='wrk:000067'&&w.originalTitle==='Other Worlds Than These'));
});
