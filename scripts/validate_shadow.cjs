'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validate,loadBundle,ROOT}=require('./validate_foundation.cjs');
const {generateShadow,outputFiles,hash}=require('./migrate_shadow.cjs');
const {isDeepStrictEqual:equal}=require('node:util');
function validateShadow(bundle,ledger,{root=ROOT,checkGenerated=true}={}){
 const result=validate(bundle,{root,checkCompatibility:false});const errors=[...result.errors];
 const add=(code,message)=>errors.push({code,message});
 if(bundle.manifest.scope!=='shadow-library-batch-01')add('batch-scope','Wrong shadow batch');
 try{
  const expected=generateShadow(root);
  if(!equal(bundle,expected.bundle))add('projection-difference','Canonical records/claims/aliases differ from the reviewed migration projection');
  if(!equal(ledger,expected.differences))add('field-ledger-difference','A source field/hash/disposition/target is missing or changed');
  for(const[file,digest]of Object.entries(ledger.unchangedFiles))if(hash(fs.readFileSync(path.join(root,file),'utf8'))!==digest)add('input-changed',file);
  if(checkGenerated)for(const[name,content]of outputFiles(root))if(fs.readFileSync(path.join(root,name),'utf8')!==content)add('stale-output',name);
  const allocation=JSON.parse(fs.readFileSync(path.join(root,'data/migration/id-register.json'),'utf8'));
  const slots=[...Object.values(allocation.entities).map(t=>t.id),...Object.values(allocation.people),...Object.values(allocation.sources),...Object.values(allocation.credits),...Object.values(allocation.claims)];
  if(new Set(slots).size!==slots.length)add('allocation-collision','ID allocation is not injective');
  const mapped=ledger.fields.filter(f=>f.disposition==='mapped');const entities=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(v=>v.id).map(v=>[v.id,v]));
  for(const f of mapped)if(!entities.has(f.target.id))add('missing-ledger-target',f.pointer);
  if(ledger.completeMigration!==false||ledger.records.length!==86||bundle.works.length!==71||bundle.collections.length!==15)add('coverage-claim','This batch is exactly 86 library identities, not the full catalog');
 }catch(e){add('batch-input',e.message);}
 return {valid:errors.length===0,errors,counts:result.counts};
}
if(require.main===module){try{const result=validateShadow(loadBundle(path.join(ROOT,'data/v2-shadow')),JSON.parse(fs.readFileSync(path.join(ROOT,'data/migration/differences.json'),'utf8')));console.log(JSON.stringify(result,null,2));process.exitCode=result.valid?0:1;}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={validateShadow};
