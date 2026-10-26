'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validate,loadBundle,ROOT}=require('./validate_foundation.cjs');
const {generateShadow,outputFiles,hash}=require('./migrate_shadow.cjs');
const {isDeepStrictEqual:equal}=require('node:util');
function validateShadow(bundle,ledger,{root=ROOT,checkGenerated=true,views,decisions}={}){
 const result=validate(bundle,{root,checkCompatibility:false});const errors=[...result.errors];
 const add=(code,message)=>errors.push({code,message});
 if(bundle.manifest.scope!=='shadow-universe-batch-05')add('batch-scope','Wrong shadow batch');
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
  if(ledger.completeMigration!==false||ledger.records.length!==259||bundle.works.length!==241||bundle.collections.length!==15)add('coverage-claim','Batches 01–02 cover existing identities/credits/memberships, not full publication/edition/adaptation migration');
  const overlay=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-02-register.json'),'utf8'));
  const newSlots=[...Object.values(overlay.entities).map(t=>t.id),...Object.values(overlay.people),...Object.values(overlay.sources),...Object.values(overlay.credits),...Object.values(overlay.memberships),...Object.values(overlay.connections),...Object.values(overlay.claims)];
  if(new Set([...slots,...newSlots]).size!==slots.length+newSlots.length)add('allocation-collision','Batch 02 reuses a prior allocation for a different key');
  for(const[id,snapshot]of Object.entries(overlay.preservedEntities))if(!entities.has(id)||hash(JSON.stringify(entities.get(id)))!==snapshot.sha256)add('batch-01-entity-changed',id);
  const third=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-03-register.json'),'utf8'));
  const thirdSlots=['editions','artworks','publications','sources','claims'].flatMap(k=>Object.values(third[k]));
  if(new Set([...slots,...newSlots,...thirdSlots]).size!==slots.length+newSlots.length+thirdSlots.length)add('allocation-collision','Batch 03 ID collision');
  for(const[id,snapshot]of Object.entries(third.preservedEntities))if(!entities.has(id)||hash(JSON.stringify(entities.get(id)))!==snapshot.sha256)add('batch-02-entity-changed',id);
  const fourth=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-04-register.json'),'utf8'));
  const fourthSlots=['adaptations','artworks','people','credits','connections','sources','claims'].flatMap(k=>Object.values(fourth[k]));
  if(new Set([...slots,...newSlots,...thirdSlots,...fourthSlots]).size!==slots.length+newSlots.length+thirdSlots.length+fourthSlots.length)add('allocation-collision','Batch 04 ID collision');
  for(const[id,snapshot]of Object.entries(fourth.preservedEntities))if(!entities.has(id)||hash(JSON.stringify(entities.get(id)))!==snapshot.sha256)add('batch-03-entity-changed',id);
  const fifth=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-05-register.json'),'utf8'));
  for(const[id,snapshot]of Object.entries(fifth.preservedEntities))if(!entities.has(id)||hash(JSON.stringify(entities.get(id)))!==snapshot.sha256)add('batch-04-entity-changed',id);
  const fifthSlots=['entities','connections','sources','claims'].flatMap(k=>Object.values(fifth[k]));
  if(new Set([...slots,...newSlots,...thirdSlots,...fourthSlots,...fifthSlots]).size!==slots.length+newSlots.length+thirdSlots.length+fourthSlots.length+fifthSlots.length)add('allocation-collision','Batch 05 ID collision');
  errors.push(...require('./validate_universe.cjs').validateUniverse(bundle,JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-05-review.json'),'utf8'))));
  const screens=JSON.parse(fs.readFileSync(path.join(root,'data/migration/screen-views.json'),'utf8'));
  const posters=JSON.parse(fs.readFileSync(path.join(root,'data/migration/poster-provenance.json'),'utf8'));
  errors.push(...require('./validate_screens.cjs').validateScreens(bundle,screens,posters));
  if(!equal(screens,expected.screens.views)||!equal(posters,expected.screens.provenance))add('screen-projection','Screen views/poster policies differ from reviewed evidence');
  const policy=JSON.parse(fs.readFileSync(path.join(root,'data/migration/cover-provenance.json'),'utf8'));
  errors.push(...require('./validate_cover_provenance.cjs').validateCoverProvenance(policy,bundle));
  if(!equal(policy,expected.publications.provenance))add('cover-policy-projection','Cover evidence/policy differs from preserved observations');
  const projected=views||JSON.parse(fs.readFileSync(path.join(root,'data/migration/story-views.json'),'utf8'));
  const review=decisions||JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-02-decisions.json'),'utf8'));
  if(!equal(projected,expected.stories.views))add('story-view-projection','Missing or changed story/default membership projection');
  if(!equal(review,expected.stories.review))add('membership-evidence','Membership evidence, status or identity decision changed');
  const members=new Map(bundle.collectionMemberships.map(m=>[m.id,m]));
  for(const view of projected.views){
   for(const id of view.membershipIds)if(members.get(id)?.workId!==view.workId)add('view-membership-owner',view.legacyStoryId);
   if(view.defaultMembershipId&&!view.membershipIds.includes(view.defaultMembershipId))add('default-membership',view.legacyStoryId);
  }
  if(bundle.collectionMemberships.some(m=>m.order!==null))add('uncertified-order','No contents order was verified for this batch');
  if(bundle.collectionMemberships.length!==155||bundle.editions.length!==154||bundle.artworks.length!==234||bundle.adaptations.length!==96||bundle.publicationEvents.length!==239||bundle.connections.length!==94||bundle.series.length!==2)add('batch-boundary','Stop after Batch 05; bounded relationship migration, no full Explorer switch');
 }catch(e){add('batch-input',e.message);}
 return {valid:errors.length===0,errors,counts:result.counts};
}
if(require.main===module){try{const result=validateShadow(loadBundle(path.join(ROOT,'data/v2-shadow')),JSON.parse(fs.readFileSync(path.join(ROOT,'data/migration/differences.json'),'utf8')));console.log(JSON.stringify(result,null,2));process.exitCode=result.valid?0:1;}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={validateShadow};
