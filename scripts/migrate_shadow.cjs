'use strict';
// Batch 01: library identities and scoped credits only. No publication/edition inference.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT,loadBundle}=require('./validate_foundation.cjs');
const {readGenerated}=require('./foundation_compat.cjs');
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const read=(name,root=ROOT)=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const KINDS={'Roman':'novel','Novelle':'novella','Strip':'comic','Non-fictie':'nonfiction','Fotoboek':'nonfiction'};
function inputs(root=ROOT){return {db:readGenerated('catalog.js','DB',root),seed:loadBundle(path.join(root,'data/v2')),contributors:read('data/contributors.json',root)};}
function generateShadow(root=ROOT){
 const {db,seed,contributors}=inputs(root);const allocation=read('data/migration/id-register.json',root);
 for(const[file,digest]of Object.entries(allocation.baselineInputs)){if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)throw Error('Baseline changed; review before migration: '+file);}
 const bundle=structuredClone(seed);const mappings=[];const records=[];
 const existing=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(x=>x.id).map(x=>[x.id,x]));
 function assigned(table,key){const id=allocation[table]?.[key];if(!id)throw Error(`Unregistered ${table}: ${key}; review and allocate once`);return id;}
 function register(table,r){if(existing.has(r.id))throw Error('Duplicate allocation '+r.id);bundle[table].push(r);bundle.registry.entries.push({id:r.id,type:r.entityType});existing.set(r.id,r);return r;}
 function source(url){
  const id=assigned('sources',url);if(existing.has(id))return id;
  register('sources',{id,entityType:'source',url,publisher:new URL(url).hostname,sourceType:'reference',publishedAt:null,observedAt:'2026-10-25',access:'archived-snapshot',snapshotRef:'catalog.js',notes:'Carried forward field facts from the 1.5.1 snapshot; URL availability and full record accuracy not newly certified.'});return id;
 }
 function claim(r,field,value,url,locator){
  const id=assigned('claims',r.id+'/'+field);
  register('claims',{id,entityType:'claim',subject:{type:r.entityType,id:r.id},fieldPath:'/'+field,value:structuredClone(value),sourceIds:[source(url)],locator,status:'provisional',observedAt:'2026-10-25',independentlyConfirmed:false,selected:true,decisionNote:'Technical migration of existing evidence only; not new independent verification.'});r.verification.claimIds.push(id);
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
 function walk(value,pointer){
  if(value!==null&&typeof value==='object'&&Object.keys(value).length){for(const[k,v]of Object.entries(value))walk(v,pointer+'/'+k.replaceAll('~','~0').replaceAll('/','~1'));return;}
  const target=fieldTargets.get(pointer);mappings.push({source:'catalog.js',pointer,sourceValueSha256:hash(value),disposition:target?'mapped':'retained-in-source-not-migrated',...(target?{target}:{}),reason:target?'Reviewed batch-01 identity/credit mapping':'Explicitly outside this batch; original field retained byte-for-byte in source snapshot.'});
 }
 for(const group of ['books','stories','films','tower','works','editions'])walk(db[group],'/'+group);
 bundle.manifest={...bundle.manifest,scope:'shadow-library-batch-01',baselineCommit:'c230d4d4eab3bb8c8f3edfd5a3cd029ad5064d68',migratedLegacyWorkIds:db.books.map(b=>b.workId),notes:['Library identities and scoped credits only. Not a complete migration.','The two-work Explorer fixture remains unchanged at data/v2/.','No new edition, cover, adaptation or legacy Tower relation is imported in this batch.','Unmapped fields remain in the immutable source; absence here does not mean absence in the bibliography.']};
 const differences={batch:'01-library-identities-and-credits',completeMigration:false,inputSha256:hash(fs.readFileSync(path.join(root,'catalog.js'),'utf8')),allocationSha256:hash(fs.readFileSync(path.join(root,'data/migration/id-register.json'),'utf8')),records,fields:mappings,sourceGroups:Object.fromEntries(Object.entries(db).map(([k,v])=>[k,v.length])),unchangedFiles:Object.fromEntries(['index.html','app.js','catalog.js','media.js','styles.css','about.html','about.js','data/import-v1.4.json','data/legacy-v1.4.json',...Object.keys(allocation.baselineInputs).filter(f=>f.startsWith('explorer/')),...fs.readdirSync(path.join(root,'data/v2')).map(f=>'data/v2/'+f)].map(f=>[f,hash(fs.readFileSync(path.join(root,f),'utf8'))]))};
 return {bundle,differences};
}
function outputFiles(root=ROOT){const{bundle,differences}=generateShadow(root);return new Map([...Object.entries(bundle).map(([k,v])=>['data/v2-shadow/'+k+'.json',JSON.stringify(v,null,2)+'\n']),['data/migration/differences.json',JSON.stringify(differences,null,2)+'\n']]);}
if(require.main===module){for(const[name,content]of outputFiles()){fs.mkdirSync(path.dirname(path.join(ROOT,name)),{recursive:true});fs.writeFileSync(path.join(ROOT,name),content);}console.log('Batch 01 generated: library identities and credits; all other fields explicitly retained/deferred.');}
module.exports={inputs,generateShadow,outputFiles,hash,ROOT};
