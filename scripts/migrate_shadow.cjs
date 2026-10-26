'use strict';
// Cumulative shadow batches; historical projections remain separately reproducible.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT,loadBundle}=require('./validate_foundation.cjs');
const {readGenerated}=require('./foundation_compat.cjs');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const read=(name,root=ROOT)=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const KINDS={'Roman':'novel','Novelle':'novella','Strip':'comic','Non-fictie':'nonfiction','Fotoboek':'nonfiction'};
function inputs(root=ROOT){return {db:readGenerated('catalog.js','DB',root),seed:loadBundle(path.join(root,'data/v2')),contributors:read('data/contributors.json',root)};}
function generateShadow(root=ROOT,{batch='05'}={}){
 const {db,seed,contributors}=inputs(root);const allocation=read('data/migration/id-register.json',root);
 for(const[file,digest]of Object.entries(allocation.baselineInputs)){if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Baseline changed; review before migration: '+file);}
 const overlay=batch!=='01'?read('data/migration/batch-02-register.json',root):null;
 if(overlay)for(const[file,digest]of Object.entries(overlay.baselineInputs))if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Batch 02 baseline changed: '+file);
 const batch03=['03','04','05'].includes(batch)?read('data/migration/batch-03-register.json',root):null;
 if(batch03)for(const[file,digest]of Object.entries(batch03.baselineInputs))if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Batch 03 baseline changed: '+file);
 const batch04=['04','05'].includes(batch)?read('data/migration/batch-04-register.json',root):null;
 if(batch04)for(const[file,digest]of Object.entries(batch04.baselineInputs))if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Batch 04 baseline changed: '+file);
 const batch05=batch==='05'?read('data/migration/batch-05-register.json',root):null;
 if(batch05)for(const[file,digest]of Object.entries(batch05.baselineInputs))if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Batch 05 baseline changed: '+file);
 const bundle=structuredClone(seed);if(!batch05)delete bundle.series;const mappings=[];const records=[];
 const existing=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(x=>x.id).map(x=>[x.id,x]));
 function assigned(table,key){const id=allocation[table]?.[key]||overlay?.[table]?.[key]||batch03?.[table]?.[key]||batch04?.[table]?.[key];if(!id)throw Error(`Unregistered ${table}: ${key}; review and allocate once`);return id;}
 function register(table,r){if(existing.has(r.id))throw Error('Duplicate allocation '+r.id);bundle[table].push(r);bundle.registry.entries.push({id:r.id,type:r.entityType});existing.set(r.id,r);return r;}
 function source(url){
  const id=assigned('sources',url);if(existing.has(id))return id;
  register('sources',{id,entityType:'source',url,publisher:new URL(url).hostname,sourceType:'reference',publishedAt:null,observedAt:'2026-10-25',access:'archived-snapshot',snapshotRef:'catalog.js',notes:'Carried forward field facts from the 1.5.1 snapshot; URL availability and full record accuracy not newly certified.'});return id;
 }
 function claim(r,field,value,url,locator,{status='provisional',observedAt='2026-10-25',decisionNote='Technical migration of existing evidence only; not new independent verification.'}={}){
  const id=assigned('claims',r.id+'/'+field);
  register('claims',{id,entityType:'claim',subject:{type:r.entityType,id:r.id},fieldPath:'/'+field,value:structuredClone(value),sourceIds:[...new Set((Array.isArray(url)?url:[url]).map(source))],locator,status,observedAt,independentlyConfirmed:false,selected:true,decisionNote});r.verification.claimIds.push(id);
 }
 function alias(value,target){const old=bundle.registry.aliases.find(a=>a.alias===value);if(old){if(old.target.id!==target.id||old.target.type!==target.type)throw Error('Alias rebound '+value);return;}bundle.registry.aliases.push({alias:value,kind:value.startsWith('#')?'legacy-route':'legacy-id',target});}
 const people=new Map();
 for(const [name,id]of Object.entries(allocation.people)){
  let person=existing.get(id);
  const book=db.books.find(b=>b.authors.some(a=>a.name===name));if(!book)throw Error('Person no longer in source '+name);
  if(!person){person=register('people',{id,entityType:'person',verification:{claimIds:[],open:['identityCarriedForward']},name,aliases:[],pseudonyms:[],externalIds:{}});claim(person,'name',name,book.Bron,`catalog.js#/books/${db.books.indexOf(book)}/authors; exact registered identity, no fuzzy merge`);}
  people.set(name,person);
 }
 const king=people.get('Stephen King');if(!king.pseudonyms.includes('Richard Bachman')){
  king.pseudonyms.push('Richard Bachman');const bachman=db.books.find(b=>b.authors.some(a=>a.creditedAs==='Richard Bachman'));
  claim(king,'pseudonyms',king.pseudonyms,bachman.Bron,`catalog.js#/books/${db.books.indexOf(bachman)}/authors/0/creditedAs; explicit pseudonym policy`);
 }
 const fieldTargets=new Map();
 function point(pointer,id,field,transform='identity'){fieldTargets.set(pointer,{id,field,transform});}
 for(const [i,b]of db.books.entries()){
  const target=allocation.entities[b.workId];if(!target)throw Error('Unallocated book '+b.workId);
  const ref={type:target.type,id:target.id};let r=existing.get(ref.id);
  const base=`/books/${i}`;
  if(!r){
   const fields=ref.type==='collection'?{originalTitle:b['Engelse titel'],collectionKind:b.containsWorks?.length?'collected-novels':b.Type==='Bijdragenbundel'?'contributed-collection':'story-collection',aliases:[]}:{kind:KINDS[b.Type],originalTitle:b['Engelse titel'],originalLanguage:'en',aliases:[]};
   if(ref.type==='work'&&!fields.kind)throw Error('Unreviewed work type '+b.Type);
   r=register(ref.type==='work'?'works':'collections',{...ref,entityType:ref.type,verification:{claimIds:[],open:[...new Set([...(b.audit?.uncertain||[]),'remainingLegacyFieldsNotMigrated',...(ref.type==='collection'?['contentsNotMigrated']:[]),...(contributors[b['Engelse titel']]?.incomplete?['makerListIncomplete']:[])])]},...fields});delete r.type;
   for(const field of Object.keys(fields))if(field!=='aliases')claim(r,field,r[field],b.Bron,`catalog.js#${base}; ${field} mapping recorded in differences.json`);
  }
  alias(b.workId,ref);alias(b.id,ref);alias('#books?item='+encodeURIComponent(b.id),ref);
  point(base+'/Engelse titel',r.id,'/originalTitle');point(base+'/Type',r.id,ref.type==='collection'?'/collectionKind':'/kind','registered-type-map');
  point(base+'/workId',r.id,'id','legacy-alias');point(base+'/id',r.id,'id','legacy-alias');
  const overrides=contributors[b['Engelse titel']];
  for(const [j,a]of b.authors.entries()){
   const person=people.get(a.name);if(!person)throw Error('Unregistered person '+a.name);
   const key=b.workId+'#authors/'+j;let credit;
   if(['work:the-talisman','work:black-house'].includes(b.workId))credit=bundle.credits.find(c=>c.subject.id===r.id&&c.personId===person.id);
   else{
    const scope=overrides?.kind==='parallel-stories'?(a.role==='illustrator'?'art for first five issues; later series not attributed':'separate storyline in first five issues; later series not attributed'):a.role==='photographer'?'photographs':b.Type==='Fotoboek'?'text':a.role==='contributor'?'individual contribution; full contributor list incomplete':a.role==='illustrator'?'illustrations; full extent not independently verified':'whole-text';
    credit=register('credits',{id:assigned('credits',key),entityType:'credit',verification:{claimIds:[],open:['roleCarriedForward']},personId:person.id,subject:ref,role:a.role,creditedAs:a.creditedAs||null,scope,characterId:null});
    for(const field of ['personId','subject','role','scope',...(credit.creditedAs?['creditedAs']:[])])claim(credit,field,credit[field],overrides?.source||b.Bron,`catalog.js#${base}/authors/${j}; data/contributors.json where present`);
   }
   point(`${base}/authors/${j}/name`,person.id,'/name');point(`${base}/authors/${j}/role`,credit.id,'/role',a.role===credit.role?'identity':'preserve-foundation-coauthor-role');
   if(a.creditedAs)point(`${base}/authors/${j}/creditedAs`,credit.id,'/creditedAs');
  }
  records.push({sourcePointer:base,legacyId:b.id,legacyWorkId:b.workId,target:ref,status:'identity-and-credits-only',remaining:'publication history, editions, images, aliases, audit metadata and other fields remain in unchanged source; see field ledger'});
 }
 let stories=null;const viewTargets=new Map();
 if(overlay){stories=require('./migrate_stories.cjs').migrateStories({root,db,bundle,existing,register,claim,alias,point,assigned,people,overlay});records.push(...stories.rows);for(const f of stories.fields)viewTargets.set(f.pointer,f.target);}
 const publications=batch03?require('./migrate_publications.cjs').migratePublications({root,db,bundle,existing,register,claim,alias,point,assigned,source}):null;
 const screens=batch04?require('./migrate_adaptations.cjs').migrateAdaptations({root,db,bundle,existing,register,claim,alias,point,assigned,source}):null;
 const universe=batch05?require('./migrate_universe.cjs').migrateUniverse({root,db,bundle,point,allocation:batch05}):null;
 function walk(value,pointer){
  if(value!==null&&typeof value==='object'&&Object.keys(value).length){for(const[k,v]of Object.entries(value))walk(v,pointer+'/'+k.replaceAll('~','~0').replaceAll('/','~1'));return;}
  const target=fieldTargets.get(pointer)||viewTargets.get(pointer);mappings.push({source:'catalog.js',pointer,sourceValueSha256:hash(value),disposition:target?'mapped':'retained-in-source-not-migrated',...(target?{target}:{}),reason:target?(universe&&pointer.startsWith('/tower/')?'Reviewed batch-05 field assessment; original value retained by source hash':batch04&&pointer.startsWith('/films/')?'Reviewed batch-04 screen identity/observation projection':batch03&&(/\/(editions|editionIds|publications|reportedDate|Jaar|publisher)(\/|$)/.test(pointer))?'Reviewed batch-03 edition/publication projection':pointer.startsWith('/stories/')||pointer.includes('/containsWorks/')?'Reviewed batch-02 story/membership projection':'Reviewed batch-01 identity/credit mapping'):'Explicitly outside this batch; original field retained byte-for-byte in source snapshot.'});
 }
 for(const group of ['books','stories','films','tower','works','editions'])walk(db[group],'/'+group);
 bundle.manifest={...bundle.manifest,scope:'shadow-library-batch-01',baselineCommit:'c230d4d4eab3bb8c8f3edfd5a3cd029ad5064d68',migratedLegacyWorkIds:db.books.map(b=>b.workId),notes:['Library identities and scoped credits only. Not a complete migration.','The two-work Explorer fixture remains unchanged at data/v2/.','No new edition, cover, adaptation or legacy Tower relation is imported in this batch.','Unmapped fields remain in the immutable source; absence here does not mean absence in the bibliography.']};
 const differences={batch:'01-library-identities-and-credits',completeMigration:false,inputSha256:hash(fs.readFileSync(path.join(root,'catalog.js'),'utf8')),allocationSha256:hash(fs.readFileSync(path.join(root,'data/migration/id-register.json'),'utf8')),records,fields:mappings,sourceGroups:Object.fromEntries(Object.entries(db).map(([k,v])=>[k,v.length])),unchangedFiles:Object.fromEntries(['index.html','app.js','catalog.js','media.js','styles.css','about.html','about.js','data/import-v1.4.json','data/legacy-v1.4.json',...Object.keys(allocation.baselineInputs).filter(f=>f.startsWith('explorer/')),...fs.readdirSync(path.join(root,'data/v2')).map(f=>'data/v2/'+f)].map(f=>[f,hash(fs.readFileSync(path.join(root,f),'utf8'))]))};
 if(overlay){
  bundle.manifest={...bundle.manifest,scope:'shadow-stories-batch-02',baselineCommit:overlay.baseCommit,migratedLegacyWorkIds:db.works.map(w=>w.id),notes:['Batch 01 library identities/credits plus Batch 02 story identities, scoped credits and collection memberships only.','No new publication event, edition, artwork, adaptation or Tower relation; no runtime switch.','All source rows are accounted for; unmapped fields and uncertainty remain in unchanged source.','Membership order is unknown; Five inherited secondary collection pairs remain provisional; edition-specific evidence is explicitly scoped.']};
  differences.batch='02-stories-and-memberships';differences.additionalAllocationSha256=hash(fs.readFileSync(path.join(root,'data/migration/batch-02-register.json'),'utf8'));differences.batch01RecordCount=86;differences.batch02RecordCount=stories.rows.length;differences.definitions=stories.review.definitions;
 }
 if(publications){bundle.manifest={...bundle.manifest,scope:'shadow-publications-batch-03',baselineCommit:batch03.baseCommit,notes:['Cumulative identity, credit and membership projection, plus inherited publication observations, 154 edition examples and edition-bound cover metadata.','Source dates do not certify first publication; edition examples do not certify first printings.','Cover rights and delivery are governed separately by data/migration/cover-provenance.json; zero images approved for new display.','No adaptation or Tower migration, no Explorer/runtime switch, no worldwide completeness claim.']};differences.batch='03-publications-editions-cover-provenance';differences.batch03AllocationSha256=hash(fs.readFileSync(path.join(root,'data/migration/batch-03-register.json'),'utf8'));differences.editionRecordCount=154;differences.editionRecords=publications.views.views.map((v,i)=>({sourcePointer:'/editions/'+i,legacyId:v.legacyEditionId,target:{type:'edition',id:v.editionId},status:'incomplete-example',sourceSupportedFields:v.sourceSupportedIdentityFields,open:v.open}));for(const r of records){r.status='identity-credits-memberships-and-available-publication-observations';r.publicationIds=bundle.publicationEvents.filter(p=>p.subject.id===r.target.id).map(p=>p.id);r.editionIds=bundle.editions.filter(e=>e.publicationOf.id===r.target.id).map(e=>e.id);r.remaining='Full publication/printing/translation history, unlinked audit fields and other deferred facts remain in unchanged source; see leaf ledger.';}}
 if(screens){bundle.manifest={...bundle.manifest,scope:'shadow-screen-batch-04',baselineCommit:batch04.baseCommit,notes:['Cumulative Batches 01–04. All 96 inherited screen identities; no worldwide filmography completeness claim.','Confirmed adaptation relations are distinct from unconfirmed legacy candidates and collection context.','96 poster policy decisions; zero new images or numeric ratings approved.','Existing site, Explorer, earlier native records and literary/Tower relations unchanged; stop before Batch 05.']};differences.batch='04-screen-adaptations';differences.batch04AllocationSha256=hash(fs.readFileSync(path.join(root,'data/migration/batch-04-register.json'),'utf8'));differences.screenRecords=screens.views.views;differences.definitions={...differences.definitions,...screens.review.definitions};}
 if(universe){bundle.manifest={...bundle.manifest,scope:'shadow-universe-batch-05',baselineCommit:batch05.baseCommit,notes:['Batches 01–05: bounded canonical relationship graph, not a complete universe or bibliography.','All 17 Tower source rows and exactly 78 inherited screen candidates assessed.','Unconfirmed candidates and precise-target questions retained; no runtime or Explorer switch.','Public plot JSON is not secret. The safe graph omits plot/ending facts before labels and metadata are projected.']};differences.batch='05-connected-universe';differences.universe=universe.summary;differences.towerRecords=universe.towerRecords;differences.screenCandidateAssessments=universe.screenCandidates;}
 return {bundle,differences,...(universe?{universe}:{}),...(stories?{stories}:{} ),...(publications?{publications}:{}),...(screens?{screens}:{})};
}
function outputFiles(root=ROOT){const{bundle,differences,stories,publications,screens,universe}=generateShadow(root);const files=new Map([...Object.entries(bundle).map(([k,v])=>['data/v2-shadow/'+k+'.json',JSON.stringify(v,null,2)+'\n']),['data/migration/differences.json',JSON.stringify(differences,null,2)+'\n']]);if(stories){files.set('data/migration/story-views.json',JSON.stringify(stories.views,null,2)+'\n');files.set('data/migration/batch-02-decisions.json',JSON.stringify(stories.review,null,2)+'\n');}if(publications)for(const[name,value]of Object.entries({'edition-views':publications.views,'cover-provenance':publications.provenance,'batch-03-decisions':publications.review,'batch-03-source-fields':publications.supplementary}))files.set('data/migration/'+name+'.json',JSON.stringify(value,null,2)+'\n');if(screens)for(const[name,value]of Object.entries({'screen-views':screens.views,'poster-provenance':screens.provenance,'screen-rights-dispositions':screens.rights,'batch-04-decisions':screens.review,'batch-04-source-fields':screens.supplementary}))files.set('data/migration/'+name+'.json',JSON.stringify(value,null,2)+'\n');if(universe)for(const[name,value]of Object.entries({'batch-05-decisions':universe.summary,'universe-safe':universe.safe,'universe-plot':universe.plot}))files.set('data/migration/'+name+'.json',JSON.stringify(value,null,2)+'\n');return files;}
if(require.main===module){for(const[name,content]of outputFiles()){fs.mkdirSync(path.dirname(path.join(ROOT,name)),{recursive:true});fs.writeFileSync(path.join(ROOT,name),content);}console.log('Batches 01–05 generated: bounded canonical graph, scoped evidence and spoiler-safe projection.');}
module.exports={inputs,generateShadow,outputFiles,hash,ROOT};
