#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),Ajv=require('ajv/dist/2020').default;
const {isDeepStrictEqual:equal}=require('node:util');
const {ROOT,validate}=require('./validate_foundation.cjs');
const {generate,outputs,loadCompletion,sha}=require('./build_completion.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
// A small vocabulary extension for the isolated completion layer, not a change
// to frozen foundation/batch/release schemas or the public runtime.
function schema(){const s=read('schemas/foundation.schema.json');s.$defs.manifest.properties.scope.enum.push('bibliographic-completion-A');s.$defs.work.properties.kind.enum.push('children-book','dramatic-work');s.$defs.publication.properties.eventType.enum.push('performance-premiere');s.$defs.date.properties.meaning.enum.push('performance-premiere');return s;}
const checkSchema=new Ajv({allErrors:true,strict:true}).compile(schema());
function validateCompletion(bundle=loadCompletion(),{checkGenerated=true,checkBaseline=true}={}){
 const errors=[];const add=(code,message)=>errors.push({code,message});
 if(!checkSchema(bundle))for(const e of checkSchema.errors)add('completion-schema',e.instancePath+' '+e.message);
 else{
  // Reuse all existing reference/claim/ISBN/runtime checks. Only the three
  // new enum values are translated for the historical checker, after their
  // real values have been validated against the extended schema above.
  const c=structuredClone(bundle);c.manifest.scope='shadow-universe-batch-05';
  for(const w of c.works)if(['children-book','dramatic-work'].includes(w.kind)){w.kind=w.kind==='children-book'?'contribution':'screenplay';for(const cl of c.claims.filter(cl=>cl.subject.id===w.id&&cl.fieldPath==='/kind'))cl.value=w.kind;}
  for(const p of c.publicationEvents)if(p.eventType==='performance-premiere'){p.eventType='source-reported-release';p.date.meaning=p.eventType;for(const cl of c.claims.filter(cl=>cl.subject.id===p.id)){if(cl.fieldPath==='/eventType')cl.value=p.eventType;if(cl.fieldPath==='/date')cl.value=structuredClone(p.date);}}
  errors.push(...validate(c,{checkCompatibility:false}).errors);
 }
 try{
  const expected=generate();if(!equal(bundle,expected.bundle))add('review-projection','Projection differs from reviewed inputs/registered identities');
  const allocated=Object.values(expected.register.allocations);if(new Set(allocated).size!==allocated.length)add('allocation-collision','Register is not injective');
  const baseIds=new Set(read('data/v2-shadow/registry.json').entries.map(e=>e.id));if(allocated.some(id=>baseIds.has(id)))add('reused-id','New allocation reuses a historical identity');
  if(checkBaseline)for(const [p,h]of Object.entries(read('data/completion/baseline.json').sha256))if(sha(fs.readFileSync(path.join(ROOT,p),'utf8'))!==h)add('historical-file-changed',p);
  if(checkGenerated)for(const[p,s]of outputs())if(fs.readFileSync(path.join(ROOT,p),'utf8')!==s)add('stale-output',p);
  const old=read('data/v2-shadow/editions.json');for(const e of bundle.editions){const prior=old.find(x=>x.id===e.id);if(!prior||e.isbn13!==prior.isbn13||!equal(e.publicationOf,prior.publicationOf)||e.language!==prior.language)add('edition-rebound',e.id);}
  const pairs=bundle.collectionMemberships.map(m=>m.collectionId+'/'+m.workId);if(new Set(pairs).size!==pairs.length)add('membership-duplicate','A story/collection pair occurs twice');
  const windows=bundle.collections.find(c=>c.originalTitle.startsWith('Secret Windows:'));for(const wid of read('data/completion/review.json').secretWindowsMemberships)if(!bundle.collectionMemberships.some(m=>m.collectionId===windows?.id&&m.workId===wid))add('secret-windows-existing-story','Missing existing story '+wid);
  const oldNames=new Map(read('data/v2-shadow/works.json').map(w=>[w.originalTitle,w.id]));for(const w of bundle.works)if(oldNames.has(w.originalTitle)&&oldNames.get(w.originalTitle)!==w.id)add('duplicate-work',w.originalTitle);
  const ledger=expected.ledger;if(ledger.editions.length!==154||ledger.publicationGaps.length!==30||ledger.dossiers.length!==9||ledger.sourceConflicts.length!==17||ledger.sourceUrlCollisions.length!==3)add('scope-omission','Incomplete review ledger');
  if(bundle.adaptations.length!==96||bundle.connections.length!==94||bundle.artworks.length!==234)add('package-boundary','No screen/universe/artwork additions in A');
  for(const e of ledger.editions.filter(e=>e.status==='conflicting-isbn-retained')){const n=bundle.editions.find(x=>x.id===e.editionId);if(!equal(n,old.find(x=>x.id===n.id)))add('conflicting-edition-modified',e.editionId);}
 }catch(e){add('completion-input',e.message);}
 return {valid:errors.length===0,errors};
}
if(require.main===module){const r=validateCompletion();console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;}
module.exports={validateCompletion,schema};
