'use strict';
// A bounded literary-universe and screen batch. The public consumer chooses when to apply it.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ROOT}=require('./validate_foundation.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const tables={adaptation:'adaptations',character:'characters',location:'locations',series:'series',connection:'connections',source:'sources',claim:'claims'};
const METADATA=new Set(['key','entityType','sourceKeys','note','open']);
function extendCompletionB(input){
 const bundle=structuredClone(input),review=read('data/completion-b/review.json'),registry=read('data/completion-b/register.json');
 const map=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(r=>r.id).map(r=>[r.id,r]));
 const keyIds=new Map(review.records.map(r=>[r.key,{type:r.entityType,id:registry.allocations[r.entityType+'/'+r.key]}]));
 const registered=new Set(bundle.registry.entries.map(r=>r.id));
 function id(t,key){const found=registry.allocations[t+'/'+key];if(!found)throw Error('Unregistered B slot '+t+'/'+key);return found;}
 function add(r){if(map.has(r.id)||registered.has(r.id))throw Error('B allocation collision '+r.id);bundle[tables[r.entityType]].push(r);bundle.registry.entries.push({id:r.id,type:r.entityType});registered.add(r.id);map.set(r.id,r);}
 const sources=new Map(bundle.sources.map(s=>[s.url,s.id])),sourceKeys=new Map();
 for(const s of review.sources){
  if(s.access!=='available'||s.observedAt!==review.checked||!['stephenking.com','www.universalpicturesathome.com','www.syfy.com','www.amcglobalmedia.com'].includes(new URL(s.url).hostname))throw Error('B evidence source not reviewed '+s.key);
  if(!sources.has(s.url)){const r={id:id('source',s.key),entityType:'source',url:s.url,publisher:s.publisher||'StephenKing.com',sourceType:s.sourceType,publishedAt:null,observedAt:s.observedAt,access:s.access,snapshotRef:'data/completion-b/review.json#/sources/'+s.key,notes:'Field-limited official-source review. No biography, copied synopsis, outcomes or images retained.'};add(r);sources.set(s.url,r.id);}
  sourceKeys.set(s.key,sources.get(s.url));
 }
 function resolve(ref){if(ref.key){const found=keyIds.get(ref.key);if(!found||found.type!==ref.type)throw Error('B target key/type mismatch '+ref.key);return structuredClone(found);}return structuredClone(ref);}
 for(const d of review.records){
  const record={id:id(d.entityType,d.key),entityType:d.entityType,verification:{claimIds:[],open:[...(d.open||[])]}};
  // Identity is explicitly reviewed; names never trigger an automatic merge.
  if(d.entityType==='adaptation'&&bundle.adaptations.some(a=>a.title===d.title&&a.releaseYear===d.releaseYear&&a.format===d.format))throw Error('B production already exists; review exact production binding '+d.title);
  if(d.name&&Object.values(bundle).filter(Array.isArray).flat().some(r=>r.name===d.name&&r.entityType===d.entityType))throw Error('B identity already exists; review register instead of merging '+d.name);
  for(const [field,value]of Object.entries(d))if(!METADATA.has(field))record[field]=['from','to'].includes(field)?resolve(value):field==='statusHistory'?value.map(h=>({...h,claimIds:h.claimIds.map(k=>id('claim',k))})):structuredClone(value);
  add(record);
  const refs=d.sourceKeys.map(k=>{const s=sourceKeys.get(k);if(!s)throw Error('Unknown B source key '+k);return s;});
  for(const [field,value]of Object.entries(record)){
   if(['id','entityType','verification'].includes(field)||value===null||Array.isArray(value)&&!value.length)continue;
   const claim={id:id('claim',d.key+'/'+field),entityType:'claim',subject:{type:record.entityType,id:record.id},fieldPath:'/'+field,value:structuredClone(value),sourceIds:[...new Set(refs)],locator:'data/completion-b/review.json#/records/'+d.key+'; '+d.sourceKeys.map(k=>review.sources.find(s=>s.key===k).locator).join(' | '),status:'verified',observedAt:review.checked,independentlyConfirmed:false,selected:true,decisionNote:d.note};
   add(claim);record.verification.claimIds.push(claim.id);
  }
 }
 const problems=validateCompletionB(bundle,input);if(problems.length)throw Error(JSON.stringify(problems));
 return bundle;
}
let checkSchema;
function validateCompletionB(bundle,baseline){
 const errors=[],fail=(code,message)=>errors.push({code,message});
 if(!checkSchema){const Ajv=require('ajv/dist/2020').default;checkSchema=new Ajv({allErrors:true,strict:true}).compile(require('./validate_completion.cjs').schema());}
 if(!checkSchema(bundle))for(const e of checkSchema.errors)fail('b-schema',e.instancePath+' '+e.message);
 const review=read('data/completion-b/review.json'),reg=read('data/completion-b/register.json');
 const records=Object.values(bundle).filter(Array.isArray).flat().filter(r=>r.id),map=new Map(records.map(r=>[r.id,r]));
 if(records.length!==map.size)fail('b-duplicate-id','Duplicate canonical identity');
 if(new Set(Object.values(reg.allocations)).size!==Object.values(reg.allocations).length)fail('b-register-collision','Register allocation is not injective');
 const known=new Map(bundle.registry.entries.map(e=>[e.id,e.type]));
 for(const d of review.records){
  const r=map.get(reg.allocations[d.entityType+'/'+d.key]);if(!r||known.get(r.id)!==d.entityType){fail('b-unregistered',d.key);continue;}
  const expectedKeys=new Set(['id','entityType','verification',...Object.keys(d).filter(k=>!METADATA.has(k))]);if(Object.keys(r).some(k=>!expectedKeys.has(k)))fail('b-unreviewed-field',r.id);
  const evidence=new Set(d.sourceKeys.map(k=>review.sources.find(s=>s.key===k).url));
  for(const [field,value]of Object.entries(d)){
   if(METADATA.has(field))continue;
   const expected=['from','to'].includes(field)&&value.key?{type:value.type,id:reg.allocations[value.type+'/'+value.key]}:field==='statusHistory'?value.map(h=>({...h,claimIds:h.claimIds.map(k=>reg.allocations['claim/'+k])})):value;
   try{assert.deepEqual(r[field],expected);}catch{fail('b-review-difference',r.id+'/'+field);}
   if(value===null||Array.isArray(value)&&!value.length)continue;
   const cid=reg.allocations['claim/'+d.key+'/'+field],c=map.get(cid);
   if(!c||c.subject.id!==r.id||c.subject.type!==r.entityType||c.fieldPath!=='/'+field||!c.selected||c.status!=='verified'||c.observedAt!==review.checked||!r.verification.claimIds.includes(cid)){fail('b-claim',r.id+'/'+field);continue;}
   try{assert.deepEqual(c.value,r[field]);}catch{fail('b-claim-value',c.id);}
   if(!c.sourceIds.length||c.sourceIds.some(id=>!evidence.has(map.get(id)?.url)))fail('b-source-binding',c.id);
  }
  if(r.entityType==='connection'){
   for(const ref of [r.from,r.to])if(map.get(ref.id)?.entityType!==ref.type)fail('b-endpoint',r.id);
   if(r.certainty!=='explicit'||!['none','premise'].includes(r.spoiler.level))fail('b-spoiler-scope',r.id);
  }
  if(r.entityType==='adaptation')for(const h of r.statusHistory){if(h.claimIds.some(id=>map.get(id)?.subject.id!==r.id||map.get(id)?.fieldPath!=='/statusHistory'))fail('b-status-evidence',r.id);}
  if(r.entityType==='character'&&(r.aliases.length||r.spoiler.level!=='none'))fail('b-character-spoiler',r.id);
 }
 if(baseline){
  for(const [table,rows]of Object.entries(baseline).filter(([,rows])=>Array.isArray(rows))){for(const r of rows){const next=bundle[table].find(x=>x.id===r.id);try{assert.deepEqual(next,r);}catch{fail('b-baseline-record-changed',r.id);}}}
  try{assert.deepEqual(bundle.registry.aliases,baseline.registry.aliases);assert.deepEqual(bundle.manifest,baseline.manifest);}catch{fail('b-baseline-metadata-changed','Existing aliases/manifest changed');}
  if(bundle.characters.length-baseline.characters.length!==3||bundle.locations.length-baseline.locations.length!==1||bundle.series.length-baseline.series.length!==1||bundle.connections.length-baseline.connections.length!==10||bundle.adaptations.length-baseline.adaptations.length!==2)fail('b-batch-boundary','Exactly three characters, one location, one series, two screen productions and nine scoped links');
  for(const t of ['works','collections','editions','people','artworks'])if(bundle[t].length!==baseline[t].length)fail('b-out-of-scope-addition',t);
 }
 return errors;
}
module.exports={extendCompletionB,validateCompletionB};
if(require.main===module){const base=require('./build_completion.cjs').loadCompletion(),b=extendCompletionB(base);console.log(JSON.stringify({valid:true,added:{characters:b.characters.length-base.characters.length,locations:b.locations.length-base.locations.length,series:b.series.length-base.series.length,adaptations:b.adaptations.length-base.adaptations.length,connections:b.connections.length-base.connections.length},registered:read('data/completion-b/register.json').allocations},null,2));}
