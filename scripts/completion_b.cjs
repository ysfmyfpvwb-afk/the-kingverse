'use strict';
// A bounded literary-universe and screen batch. The public consumer chooses when to apply it.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ROOT}=require('./validate_foundation.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const tables={work:'works',person:'people',credit:'credits',publication:'publicationEvents',adaptation:'adaptations',edition:'editions',character:'characters',location:'locations',series:'series',connection:'connections',source:'sources',claim:'claims'};
const METADATA=new Set(['key','entityType','sourceKeys','fieldSourceKeys','conflicts','checked','note','open']);
function extendCompletionB(input){
 const bundle=structuredClone(input),review=read('data/completion-b/review.json'),registry=read('data/completion-b/register.json');
 const map=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(r=>r.id).map(r=>[r.id,r]));
 const keyIds=new Map(review.records.map(r=>[r.key,{type:r.entityType,id:registry.allocations[r.entityType+'/'+r.key]}]));
 const registered=new Set(bundle.registry.entries.map(r=>r.id));
 function id(t,key){const found=registry.allocations[t+'/'+key];if(!found)throw Error('Unregistered B slot '+t+'/'+key);return found;}
 function add(r){if(map.has(r.id)||registered.has(r.id))throw Error('B allocation collision '+r.id);bundle[tables[r.entityType]].push(r);bundle.registry.entries.push({id:r.id,type:r.entityType});registered.add(r.id);map.set(r.id,r);}
 const sources=new Map(bundle.sources.map(s=>[s.url,s.id])),sourceKeys=new Map();
 for(const s of review.sources){
  if(s.access!=='available'||![review.checked,...review.records.map(d=>d.checked)].includes(s.observedAt)||!['stephenking.com','www.universalpicturesathome.com','www.syfy.com','www.amcglobalmedia.com','www.miramax.com','catalog.afi.com','tv.apple.com','www.paramountmovies.com','www.netflix.com','www.amctheatres.com','www.simonandschuster.com','www.cemeterydance.com','www.hachette.co.uk','www.penguinrandomhouse.com','www.the-numbers.com'].includes(new URL(s.url).hostname))throw Error('B evidence source not reviewed '+s.key);
  if(!sources.has(s.url)){const r={id:id('source',s.key),entityType:'source',url:s.url,publisher:s.publisher||'StephenKing.com',sourceType:s.sourceType,publishedAt:null,observedAt:s.observedAt,access:s.access,snapshotRef:'data/completion-b/review.json#/sources/'+s.key,notes:'Field-limited official-source review. No biography, copied synopsis, outcomes or images retained.'};add(r);sources.set(s.url,r.id);}
  sourceKeys.set(s.key,sources.get(s.url));
 }
 function resolve(ref){if(ref.key){const found=keyIds.get(ref.key);if(!found||found.type!==ref.type)throw Error('B target key/type mismatch '+ref.key);return structuredClone(found);}return structuredClone(ref);}
 for(const d of review.records){
  const record={id:id(d.entityType,d.key),entityType:d.entityType,verification:{claimIds:[],open:[...(d.open||[])]}};
  // Identity is explicitly reviewed; names never trigger an automatic merge.
  if(d.entityType==='adaptation'&&bundle.adaptations.some(a=>a.title===d.title&&a.releaseYear===d.releaseYear&&a.format===d.format))throw Error('B production already exists; review exact production binding '+d.title);
  if(d.entityType==='work'&&bundle.works.some(w=>w.originalTitle===d.originalTitle))throw Error('B work already exists; reuse its identity '+d.originalTitle);
  if(d.name&&Object.values(bundle).filter(Array.isArray).flat().some(r=>r.name===d.name&&r.entityType===d.entityType))throw Error('B identity already exists; review register instead of merging '+d.name);
  for(const [field,value]of Object.entries(d))if(!METADATA.has(field))record[field]=['from','to','subject','publicationOf'].includes(field)?resolve(value):field==='statusHistory'?value.map(h=>({...h,claimIds:h.claimIds.map(k=>id('claim',k))})):structuredClone(value);
  add(record);
  const refs=d.sourceKeys.map(k=>{const s=sourceKeys.get(k);if(!s)throw Error('Unknown B source key '+k);return s;});
  for(const [field,value]of Object.entries(record)){
   if(['id','entityType','verification'].includes(field)||value===null||Array.isArray(value)&&!value.length)continue;
   const fieldKeys=d.fieldSourceKeys?.[field]||d.sourceKeys;
   const claim={id:id('claim',d.key+'/'+field),entityType:'claim',subject:{type:record.entityType,id:record.id},fieldPath:'/'+field,value:structuredClone(value),sourceIds:[...new Set(fieldKeys.map(k=>sourceKeys.get(k)))],locator:'data/completion-b/review.json#/records/'+d.key+'; '+fieldKeys.map(k=>review.sources.find(s=>s.key===k).locator).join(' | '),status:'verified',observedAt:d.checked||review.checked,independentlyConfirmed:false,selected:true,decisionNote:d.note};
   add(claim);record.verification.claimIds.push(claim.id);
  }
  for(const [i,c]of (d.conflicts||[]).entries()){
   const claim={id:id('claim',d.key+'/conflict-'+i),entityType:'claim',subject:{type:record.entityType,id:record.id},fieldPath:c.fieldPath,value:c.value,sourceIds:c.sourceKeys.map(k=>sourceKeys.get(k)),locator:'data/completion-b/review.json#/records/'+d.key+'/conflicts/'+i,status:'disputed',observedAt:d.checked||review.checked,independentlyConfirmed:false,selected:false,decisionNote:c.note};
   add(claim);record.verification.claimIds.push(claim.id);
  }
 }
 // Editorial additions update a reviewed field on an existing identity. They
 // never create a second work or replace the historical source observation.
 for(const e of review.enrichments||[]){
  const r=map.get(e.subject.id);if(r?.entityType!==e.subject.type||!['work/summary','collection/summary','connection/explanation'].includes(e.subject.type+'/'+e.field))throw Error('Unsupported B enrichment '+e.key);
  for(const c of bundle.claims.filter(c=>c.subject.id===r.id&&c.fieldPath==='/'+e.field&&c.selected))c.selected=false;
  r[e.field]=structuredClone(e.value);
  const c={id:id('claim',e.key),entityType:'claim',subject:structuredClone(e.subject),fieldPath:'/'+e.field,value:structuredClone(e.value),sourceIds:e.sourceIds||e.sourceKeys.map(k=>sourceKeys.get(k)),locator:e.locator,status:e.status||'verified',observedAt:e.checked,independentlyConfirmed:false,selected:true,decisionNote:e.note};
  add(c);r.verification.claimIds.push(c.id);
 }
 const problems=validateCompletionB(bundle,input);if(problems.length)throw Error(JSON.stringify(problems));
 return bundle;
}
let checkSchema;
function validateCompletionB(bundle,baseline){
 const errors=[],fail=(code,message)=>errors.push({code,message});
 if(!checkSchema){const Ajv=require('ajv/dist/2020').default,s=require('./validate_completion.cjs').schema();s.$defs.series.properties.seriesKind={enum:['literary-series','film-series']};for(const t of ['collection','character','location'])s.$defs[t].properties.summary={$ref:'#/$defs/text'};checkSchema=new Ajv({allErrors:true,strict:true}).compile(s);}
 if(!checkSchema(bundle))for(const e of checkSchema.errors)fail('b-schema',e.instancePath+' '+e.message);
 const review=read('data/completion-b/review.json'),reg=read('data/completion-b/register.json');
 const records=Object.values(bundle).filter(Array.isArray).flat().filter(r=>r.id),map=new Map(records.map(r=>[r.id,r]));
 if(records.length!==map.size)fail('b-duplicate-id','Duplicate canonical identity');
 if(new Set(Object.values(reg.allocations)).size!==Object.values(reg.allocations).length)fail('b-register-collision','Register allocation is not injective');
 const known=new Map(bundle.registry.entries.map(e=>[e.id,e.type]));
 const isbns=new Set();for(const e of bundle.editions){if(map.get(e.publicationOf.id)?.entityType!==e.publicationOf.type)fail('b-edition-owner',e.id);if(e.isbn13){const sum=[...e.isbn13.slice(0,12)].reduce((n,v,i)=>n+Number(v)*(i%2?3:1),0);if((10-sum%10)%10!==Number(e.isbn13[12]))fail('b-isbn-checksum',e.id);if(isbns.has(e.isbn13))fail('b-isbn-duplicate',e.id);isbns.add(e.isbn13);}}
 const editorial=new Map();
 for(const e of review.enrichments||[]){
  if(editorial.has(e.subject.id)||!['work/summary','collection/summary','connection/explanation'].includes(e.subject.type+'/'+e.field)){fail('b-enrichment-scope',e.key);continue;}editorial.set(e.subject.id,e);
  const r=map.get(e.subject.id),c=map.get(reg.allocations['claim/'+e.key]),urls=e.sourceIds?e.sourceIds.map(id=>map.get(id)?.url):e.sourceKeys.map(k=>review.sources.find(s=>s.key===k)?.url);
  if(!r||r.entityType!==e.subject.type||!c||c.subject.id!==r.id||c.subject.type!==e.subject.type||c.fieldPath!=='/'+e.field||c.status!==(e.status||'verified')||!c.selected||c.observedAt!==e.checked||!r.verification.claimIds.includes(c.id)||JSON.stringify(c.value)!==JSON.stringify(e.value)||JSON.stringify(r[e.field])!==JSON.stringify(e.value)||JSON.stringify(c.sourceIds.map(id=>map.get(id)?.url))!==JSON.stringify(urls)||urls.some(url=>!url))fail('b-editorial-evidence',e.key);
  if(e.subject.type==='connection'){
   const prior=(e.evidenceFromClaimIds||[]).map(id=>map.get(id));
   if(!prior.length||prior.some(p=>p?.subject.id!==e.subject.id||p.fieldPath!=='/explanation'||p.status!==e.status)||JSON.stringify([...new Set(prior.flatMap(p=>p?.sourceIds||[]))])!==JSON.stringify(e.sourceIds))fail('b-copyedit-evidence',e.key);
  }
 }
 for(const d of review.records){
  const r=map.get(reg.allocations[d.entityType+'/'+d.key]);if(!r||known.get(r.id)!==d.entityType){fail('b-unregistered',d.key);continue;}
  const expectedKeys=new Set(['id','entityType','verification',...Object.keys(d).filter(k=>!METADATA.has(k))]);if(Object.keys(r).some(k=>!expectedKeys.has(k)))fail('b-unreviewed-field',r.id);
  const evidence=new Set(d.sourceKeys.map(k=>review.sources.find(s=>s.key===k).url));
  for(const [field,value]of Object.entries(d)){
   if(METADATA.has(field))continue;
   const expected=['from','to','subject','publicationOf'].includes(field)&&value.key?{type:value.type,id:reg.allocations[value.type+'/'+value.key]}:field==='statusHistory'?value.map(h=>({...h,claimIds:h.claimIds.map(k=>reg.allocations['claim/'+k])})):value;
   try{assert.deepEqual(r[field],expected);}catch{fail('b-review-difference',r.id+'/'+field);}
   if(value===null||Array.isArray(value)&&!value.length)continue;
   const cid=reg.allocations['claim/'+d.key+'/'+field],c=map.get(cid);
   if(!c||c.subject.id!==r.id||c.subject.type!==r.entityType||c.fieldPath!=='/'+field||!c.selected||c.status!=='verified'||c.observedAt!==(d.checked||review.checked)||!r.verification.claimIds.includes(cid)){fail('b-claim',r.id+'/'+field);continue;}
   try{assert.deepEqual(c.value,r[field]);}catch{fail('b-claim-value',c.id);}
   const fieldEvidence=new Set((d.fieldSourceKeys?.[field]||d.sourceKeys).map(k=>review.sources.find(s=>s.key===k).url));
   if(!c.sourceIds.length||c.sourceIds.some(id=>!fieldEvidence.has(map.get(id)?.url)))fail('b-source-binding',c.id);
  }
  for(const [i,expected]of (d.conflicts||[]).entries()){
   const c=map.get(reg.allocations['claim/'+d.key+'/conflict-'+i]);
   if(!c||c.selected||c.status!=='disputed'||c.subject.id!==r.id||c.fieldPath!==expected.fieldPath||JSON.stringify(c.value)!==JSON.stringify(expected.value)||!r.verification.claimIds.includes(c.id)||JSON.stringify(c.sourceIds)!==JSON.stringify(expected.sourceKeys.map(k=>reg.allocations['source/'+k])))fail('b-conflict-preservation',d.key);
  }
  if(r.entityType==='connection'){
   for(const ref of [r.from,r.to])if(map.get(ref.id)?.entityType!==ref.type)fail('b-endpoint',r.id);
   const gatedHolly=d.key==='holly-outsider'&&r.predicate==='appears_in'&&r.from.id===reg.allocations['character/holly-gibney']&&r.to.id==='wrk:000058'&&r.spoiler.level==='plot'&&JSON.stringify(r.spoiler.workIds)===JSON.stringify(['wrk:000058']);
   if(r.certainty!=='explicit'||!['none','premise'].includes(r.spoiler.level)&&!gatedHolly)fail('b-spoiler-scope',r.id);
  }
  if(r.entityType==='adaptation')for(const h of r.statusHistory){if(h.claimIds.some(id=>map.get(id)?.subject.id!==r.id||map.get(id)?.fieldPath!=='/statusHistory'))fail('b-status-evidence',r.id);}
  if(r.entityType==='character'&&(r.aliases.length||r.spoiler.level!=='none'))fail('b-character-spoiler',r.id);
  if(r.subject&&map.get(r.subject.id)?.entityType!==r.subject.type)fail('b-subject',r.id);
  if(r.entityType==='credit'&&map.get(r.personId)?.entityType!=='person')fail('b-maker',r.id);
  if(r.entityType==='publication'&&r.editionId&&map.get(r.editionId)?.entityType!=='edition')fail('b-publication-edition',r.id);
 }
 if(baseline){
  for(const [table,rows]of Object.entries(baseline).filter(([,rows])=>Array.isArray(rows))){for(const r of rows){const next=bundle[table].find(x=>x.id===r.id),expected=structuredClone(r),e=editorial.get(r.id);if(['works','collections','connections'].includes(table)&&e){expected[e.field]=structuredClone(e.value);expected.verification.claimIds.push(reg.allocations['claim/'+e.key]);}if(table==='claims'&&editorial.has(r.subject.id)&&r.fieldPath==='/'+editorial.get(r.subject.id).field)expected.selected=false;try{assert.deepEqual(next,expected);}catch{fail('b-baseline-record-changed',r.id);}}}
  try{assert.deepEqual(bundle.registry.aliases,baseline.registry.aliases);assert.deepEqual(bundle.manifest,baseline.manifest);}catch{fail('b-baseline-metadata-changed','Existing aliases/manifest changed');}
  if(bundle.characters.length-baseline.characters.length!==4||bundle.locations.length-baseline.locations.length!==3||bundle.series.length-baseline.series.length!==3||bundle.connections.length-baseline.connections.length!==45||bundle.adaptations.length-baseline.adaptations.length!==13)fail('b-batch-boundary','Reviewed scope: four characters, three locations, three series, thirteen screen productions and forty-five links');
  if(bundle.editions.length-baseline.editions.length!==15)fail('b-edition-boundary','Exactly fifteen reviewed English editions');
  for(const [t,count]of Object.entries({works:1,people:2,credits:4,publicationEvents:1,collections:0,artworks:0}))if(bundle[t].length-baseline[t].length!==count)fail('b-out-of-scope-addition',t);
 }
 return errors;
}
module.exports={extendCompletionB,validateCompletionB};
if(require.main===module){const base=require('./build_completion.cjs').loadCompletion(),b=extendCompletionB(base);console.log(JSON.stringify({valid:true,added:{characters:b.characters.length-base.characters.length,locations:b.locations.length-base.locations.length,series:b.series.length-base.series.length,adaptations:b.adaptations.length-base.adaptations.length,connections:b.connections.length-base.connections.length},registered:read('data/completion-b/register.json').allocations},null,2));}
