'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {loadBundle,validate,ROOT}=require('../scripts/validate_foundation.cjs');
const {generateShadow,outputFiles,hash}=require('../scripts/migrate_shadow.cjs');
const {validateShadow}=require('../scripts/validate_shadow.cjs');const {report}=require('../scripts/report_migration.cjs');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
const fresh=()=>({bundle:loadBundle(path.join(ROOT,'data/v2-shadow')),ledger:read('data/migration/differences.json')});
test('Batch 01 is reproducible, validates and does not claim a full migration',()=>{
 const {bundle,ledger}=fresh();assert.equal(validateShadow(bundle,ledger).valid,true);
 for(const[name,content]of outputFiles())assert.equal(fs.readFileSync(path.join(ROOT,name),'utf8'),content,name);
 assert.deepEqual(outputFiles(),outputFiles());assert.equal(bundle.works.length,71);assert.equal(bundle.collections.length,15);assert.equal(bundle.credits.length,99);
 assert.equal(ledger.records.length,86);assert.equal(ledger.completeMigration,false);
 assert.equal(validate(bundle).errors[0].code,'shadow-validator-required');
 assert.equal(validate(loadBundle()).valid,true);
});
test('Every input leaf has exactly one checked mapping or explicit deferred disposition',()=>{
 const {bundle,ledger}=fresh();assert.equal(new Set(ledger.fields.map(f=>f.pointer)).size,ledger.fields.length);
 assert.ok(ledger.fields.some(f=>f.pointer.includes('/imdb/summary/en')&&f.disposition==='retained-in-source-not-migrated'));
 assert.ok(!JSON.stringify(ledger).includes('Gelezen'));assert.equal(ledger.fields.filter(f=>f.disposition==='mapped').length,550);
 ledger.fields.pop();assert.ok(validateShadow(bundle,ledger,{checkGenerated:false}).errors.some(e=>e.code==='field-ledger-difference'));
});
test('Role, alias, field-value and hash corruption are rejected',()=>{
 for(const mutate of [x=>x.bundle.credits.at(-1).role='coauthor',x=>x.bundle.registry.aliases.at(-1).target.id='wrk:000001',x=>x.bundle.works.at(-1).originalTitle='Changed title',x=>x.ledger.fields[0].sourceValueSha256='0'.repeat(64)]){
  const value=fresh();mutate(value);assert.equal(validateShadow(value.bundle,value.ledger,{checkGenerated:false}).valid,false);
 }
});
test('Collections and Bachman remain separate from editions and additional authors',()=>{
 const {bundle}=fresh();const allocation=read('data/migration/id-register.json');const king=bundle.people.find(p=>p.name==='Stephen King');
 assert.deepEqual(king.pseudonyms,['Richard Bachman']);assert.ok(!bundle.people.some(p=>p.name==='Richard Bachman'));
 const bachman=allocation.entities['work:collection:the-bachman-books'];assert.equal(bachman.type,'collection');
 assert.equal(bundle.collections.find(c=>c.id===bachman.id).collectionKind,'collected-novels');
 assert.ok(bundle.credits.some(c=>c.subject.id===bachman.id&&c.personId===king.id&&c.creditedAs==='Richard Bachman'));
 const midlife=bundle.collections.find(c=>c.collectionKind==='contributed-collection');assert.ok(midlife.verification.open.includes('makerListIncomplete'));
 assert.equal(bundle.collectionMemberships.length,0);assert.equal(bundle.editions.length,4);assert.equal(bundle.adaptations.length,0);
});
test('Parallel storylines and photographs are not promoted to whole-work coauthorship',()=>{
 const {bundle}=fresh();const a=read('data/migration/id-register.json');
 const vampire=bundle.credits.filter(c=>c.subject.id===a.entities['work:american-vampire'].id);
 assert.equal(vampire.length,3);assert.ok(vampire.every(c=>c.scope.includes('first five issues')));
 const photo=bundle.credits.find(c=>c.subject.id===a.entities['work:nightmares-in-the-sky'].id&&c.role==='photographer');assert.ok(photo);assert.equal(photo.scope,'photographs');
});
test('An unreviewed baseline edit stops regeneration before identities can be rebound',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kingverse-shadow-'));
 try{
  for(const file of ['catalog.js','data/contributors.json','data/migration/id-register.json',...fs.readdirSync(path.join(ROOT,'data/v2')).map(n=>'data/v2/'+n)]){const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(ROOT,file),target);}
  const file=path.join(temp,'catalog.js');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('Carrie','Carrie corrected'));
  assert.throws(()=>generateShadow(temp),/Baseline changed/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('Dashboard separates identity coverage, deferred fields and source-row coverage',()=>{
 for(const[name,content]of report())assert.equal(fs.readFileSync(path.join(ROOT,name),'utf8'),content,name);
 const q=read('data/migration/quality.json');assert.equal(q.fullMigration,false);assert.equal(q.migration.fullyMigratedViewRecords,0);
 assert.equal(q.migration.storyViews.migrated,0);assert.equal(q.migration.editions.migrated,4);
 assert.equal(q.bibliography.index.parsedRows,703);assert.equal(q.bibliography.bibliography.parsedRows,692);
 assert.equal(q.bibliography.index.completeBibliography,false);assert.equal(q.covers.probeReferrerFailures,2);
 const sources=read('data/migration/source-audit.json');assert.equal(sources.errors.length,0);
 assert.ok(sources.covers.every(c=>c.rightsStatus==='needs-review'&&c.permissionEvidence===null));
});
test('All original app, Explorer and foundation files remain byte-identical',()=>{
 const {ledger}=fresh();assert.ok(Object.keys(ledger.unchangedFiles).includes('explorer/index.html'));
 for(const[file,digest]of Object.entries(ledger.unchangedFiles))assert.equal(hash(fs.readFileSync(path.join(ROOT,file),'utf8')),digest,file);
});

test('Every library title, credited identity and old URL independently projects to the registered entity',()=>{
 const {readGenerated,resolveAlias}=require('../scripts/foundation_compat.cjs');
 const db=readGenerated('catalog.js','DB'),allocation=read('data/migration/id-register.json');const {bundle}=fresh();
 for(const b of db.books){
  const target=allocation.entities[b.workId];const record=[...bundle.works,...bundle.collections].find(r=>r.id===target.id);
  assert.equal(record.originalTitle,b['Engelse titel']);
  assert.equal(record.entityType,db.works.find(w=>w.id===b.workId).kind==='collection'?'collection':'work');
  const url=`https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=nl#books?item=${encodeURIComponent(b.id)}&q=King&filter=collaborations`;
  const resolved=resolveAlias(bundle,url);assert.equal(resolved.target.id,target.id);assert.equal(resolved.state.language,'nl');assert.equal(resolved.state.q,'King');
  const credits=bundle.credits.filter(c=>c.subject.id===target.id);assert.equal(credits.length,b.authors.length);
  for(const author of b.authors){const person=bundle.people.find(p=>p.name===author.name);const credit=credits.find(c=>c.personId===person.id);assert.ok(credit);assert.equal(credit.creditedAs,author.creditedAs||null);}
 }
});
