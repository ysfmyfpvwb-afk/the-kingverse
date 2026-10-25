'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync,spawnSync} = require('node:child_process');
const {loadBundle,validate,ROOT} = require('../scripts/validate_foundation.cjs');
const {resolveAlias,projectLegacyRecord} = require('../scripts/foundation_compat.cjs');
const fresh=()=>loadBundle();
const check=(b)=>validate(b,{checkRuntime:false,checkCompatibility:false});
function error(mutator,code){const b=fresh();mutator(b);const r=check(b);assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.code===code),JSON.stringify(r.errors));}
function register(b,table,r){b[table].push(r);b.registry.entries.push({id:r.id,type:r.entityType});return r;}
function cite(b,r,fields,offset=900000){
 r.verification={claimIds:[],open:[]};
 for(const key of fields){const id='clm:'+offset++;register(b,'claims',{id,entityType:'claim',subject:{id:r.id,type:r.entityType},fieldPath:'/'+key,value:structuredClone(r[key]),sourceIds:['src:000001'],locator:'Synthetic validation fixture; not published catalog content',status:'provisional',observedAt:'2026-10-25',independentlyConfirmed:false,selected:true,decisionNote:'Test only'});r.verification.claimIds.push(id);}
 return r;
}
function syntheticCollection(b){
 const c={id:'col:900001',entityType:'collection',originalTitle:'Synthetic fixture',collectionKind:'anthology',aliases:[]};
 return register(b,'collections',cite(b,c,['originalTitle','collectionKind']));
}
test('Foundation validates all references and only two migrated works',()=>{
 const result=validate(fresh());assert.equal(result.valid,true,JSON.stringify(result.errors));
 assert.equal(result.counts.works,2);assert.equal(result.counts.editions,4);assert.equal(result.counts.adaptations,0);assert.equal(result.counts.collections,0);
});
test('Validation CLI is offline, read-only and exits successfully',()=>{
 const before=fs.readFileSync(path.join(ROOT,'catalog.js'));
 const result=JSON.parse(execFileSync(process.execPath,['scripts/validate_foundation.cjs'],{cwd:ROOT,encoding:'utf8'}));
 assert.equal(result.valid,true);assert.deepEqual(fs.readFileSync(path.join(ROOT,'catalog.js')),before);
});
test('Duplicate, conflicting and unregistered IDs fail',()=>{
 error(b=>b.works.push(structuredClone(b.works[0])),'duplicate-id');
 error(b=>b.registry.entries[0].type='character','unregistered-id');
 error(b=>b.registry.entries.push({...b.registry.entries[0]}),'registry-duplicate');
 error(b=>b.works[0].id='wrk:900001','unregistered-id');
});
test('Canonical identity survives title, ISBN and source-URL corrections',()=>{
 const b=fresh();b.works[0].originalTitle='Corrected display title';b.editions[0].isbn13=null;b.sources[0].url='https://stephenking.com/corrected-source';
 for(const c of b.claims)if(c.subject.id===b.works[0].id&&c.fieldPath==='/originalTitle')c.value=b.works[0].originalTitle;
 for(const c of b.claims)if(c.subject.id===b.editions[0].id&&c.fieldPath==='/isbn13')c.value=null;
 assert.equal(check(b).valid,true);assert.equal(resolveAlias(b,'books:the-talisman').target.id,'wrk:000001');
 assert.equal(b.editions[0].id,'edn:000001');
});
test('Required fields and unknown roles/predicates are rejected',()=>{
 error(b=>delete b.works[0].originalTitle,'schema');
 error(b=>b.credits[0].role='famous-person','schema');
 error(b=>b.connections[0].predicate='has-same-vibe','schema');
 error(b=>b.works[0].aliases[0].spoiler={level:'unknown',workIds:[]},'schema');
});
test('Dangling references and entity-type mismatches are rejected',()=>{
 error(b=>b.credits[0].personId='per:999999','missing-reference');
 error(b=>b.editions[0].publicationOf={type:'collection',id:'wrk:000001'},'reference-type');
 error(b=>b.externalReferences[0].legacyId='work:does-not-exist','external-legacy-reference');
});
test('Every new content field needs its own selected source claim',()=>{
 error(b=>{const c=b.claims.find(c=>c.subject.id===b.works[0].id&&c.fieldPath==='/originalTitle');b.claims=b.claims.filter(x=>x.id!==c.id);b.registry.entries=b.registry.entries.filter(x=>x.id!==c.id);b.works[0].verification.claimIds=b.works[0].verification.claimIds.filter(x=>x!==c.id);},'unclaimed-field');
 error(b=>b.claims[0].sourceIds=[],'schema');
 error(b=>b.claims[0].sourceIds=['src:999999'],'missing-reference');
 error(b=>b.claims[0].value='Unrelated fact','claim-value');
 error(b=>b.claims[0].fieldPath='/does-not-exist','claim-field');
 error(b=>b.claims[0].subject={type:'work',id:'wrk:000001'},'claim-attachment');
});
test('Official source and independent confirmation remain distinct',()=>{
 assert.ok(fresh().claims.filter(c=>c.status==='verified').every(c=>!c.independentlyConfirmed));
 error(b=>{b.sources[0].access='indexed-only';b.sources[1].access='blocked';},'claim-evidence');
});
test('Invalid dates, precision and ISBN reuse fail',()=>{
 error(b=>b.publicationEvents[0].date.value='1984-11-01','date-precision');
 error(b=>{b.publicationEvents[1].date.value='2001-02-29';},'date-precision');
 error(b=>b.editions[0].isbn13='9789021037401','isbn-checksum');
 error(b=>b.editions[2].isbn13=b.editions[0].isbn13,'isbn-conflict');
});
test('Both works have scoped co-authors and incompatible credit roles fail',()=>{
 const b=fresh();for(const w of b.works){const credits=b.credits.filter(c=>c.subject.id===w.id);assert.deepEqual(credits.map(c=>c.personId),['per:000001','per:000002']);assert.ok(credits.every(c=>c.role==='coauthor'));}
 error(b=>b.credits[0].role='director','reference-type');
 error(b=>{b.credits=b.credits.filter(c=>c.subject.id!=='wrk:000001');},'missing-author');
 error(b=>b.credits[0].characterId='chr:000001','cast-role');
});
test('Synthetic collection membership works without adding a real third work',()=>{
 const b=fresh(),c=syntheticCollection(b);
 const member={id:'mem:900001',entityType:'membership',collectionId:c.id,workId:'wrk:000001',order:null,editionIds:[]};
 register(b,'collectionMemberships',cite(b,member,['collectionId','workId'],900010));
 assert.equal(check(b).valid,true,JSON.stringify(check(b).errors));
 member.collectionId='wrk:000002';assert.ok(check(b).errors.some(e=>e.code==='reference-type'));
 member.collectionId=c.id;member.editionIds=['edn:000001'];assert.ok(check(b).errors.some(e=>e.code==='membership-edition'));
});
test('Covers remain edition-bound with language and remake-safe poster ownership',()=>{
 error(b=>b.artworks[0].editionId=null,'missing-reference');
 error(b=>b.artworks[0].adaptationId='adp:000001','cover-owner');
 error(b=>b.artworks[0].language='en','cover-language');
 assert.equal(fresh().editions.filter(e=>e.isbn13===null).length,2);
});
test('Connection confidence and spoiler scope are independent of source authority',()=>{
 const b=fresh(),c=b.connections.at(-1);assert.equal(c.certainty,'strongly-implied');
 c.certainty='interpretive';for(const claim of b.claims)if(claim.subject.id===c.id&&claim.fieldPath==='/certainty')claim.value='interpretive';
 assert.equal(check(b).valid,true);
 error(b=>b.connections[0].to={type:'edition',id:'edn:000001'},'relation-endpoints');
 error(b=>b.connections[1].spoiler.workIds=[],'spoiler-scope');
 error(b=>b.connections[0].from=b.connections[0].to,'self-connection');
});
test('Synthetic adaptation supports null scores, exact provider IDs and no invented production',()=>{
 const b=fresh();const a={id:'adp:900001',entityType:'adaptation',title:'Synthetic screen fixture',format:'tv-series',externalIds:{},releaseEvents:[],statusHistory:[],ratingObservations:[{provider:'TMDb',value:null,scale:10,votes:null,observedAt:'2026-10-25',sourceUpdatedAt:null,sourceId:'src:000001',reuseStatus:'needs-review',accessMethod:'synthetic test'}]};
 register(b,'adaptations',cite(b,a,['title','format'],900020));assert.equal(check(b).valid,true,JSON.stringify(check(b).errors));
 a.ratingObservations[0].value=8;assert.ok(check(b).errors.some(e=>e.code==='rating-rights'));
 a.ratingObservations[0].value=11;assert.ok(check(b).errors.some(e=>e.code==='schema'));
});
test('Old URLs resolve in both languages without changing query/filter context',()=>{
 const b=fresh();for(const [id,expected]of [['books:the-talisman','wrk:000001'],['books:black-house','wrk:000002']])for(const lang of ['en','nl']){
  const r=resolveAlias(b,`https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=${lang}#books?item=${encodeURIComponent(id)}&q=Straub&filter=__collaborations&sort=title`);
  assert.equal(r.target.id,expected);assert.equal(r.state.language,lang);assert.equal(r.state.q,'Straub');assert.equal(r.state.filter,'__collaborations');assert.equal(r.state.sort,'title');
 }
 assert.equal(resolveAlias(b,'#films?item=books%3Athe-talisman'),null);
 assert.equal(resolveAlias(b,'https://example.com/#books?item=books%3Athe-talisman'),null);
 assert.equal(resolveAlias(b,'#books?item=books%3Aunknown'),null);
 error(b=>b.registry.aliases.push({...b.registry.aliases[0],target:{type:'work',id:'wrk:000002'}}),'alias-conflict');
 error(b=>b.registry.aliases.find(a=>a.kind==='legacy-route').target={type:'work',id:'wrk:000002'},'legacy-route');
});
test('Shadow adapter projects original titles, editions and publication precision',()=>{
 const b=fresh(),record=projectLegacyRecord(b,'work:the-talisman');
 assert.equal(record.title,'The Talisman');assert.equal(record.reportedDate,'1984-11');assert.equal(record.editions.length,2);
 assert.equal(validate(b).valid,true);
});
test('CLI reports malformed/missing input with a nonzero exit code',()=>{
 const result=spawnSync(process.execPath,['scripts/validate_foundation.cjs','/nonexistent/kingverse-fixture'],{cwd:ROOT,encoding:'utf8'});
 assert.equal(result.status,1);assert.match(result.stderr,/validation failed/);
});
