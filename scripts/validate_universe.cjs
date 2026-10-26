'use strict';
const fs=require('node:fs'),path=require('node:path');
const {semanticKey}=require('./universe_model.cjs');
function validateUniverse(bundle,review){
 const errors=[];const add=(code,message)=>errors.push({code,message});
 const records=Object.values(bundle).filter(Array.isArray).flat().filter(r=>r?.id),map=new Map(records.map(r=>[r.id,r]));
 const seen=new Set(),positions=new Set(),successors=new Map();
 for(const c of bundle.connections){
  const key=semanticKey(bundle,c);if(seen.has(key))add('semantic-duplicate',c.id);seen.add(key);
  if(!map.has(c.from.id)||!map.has(c.to.id))add('universe-orphan',c.id);
  if(c.predicate==='part_of_series'&&c.seriesPosition){const key=c.to.id+'/'+c.seriesPosition;if(positions.has(key))add('series-position-conflict',c.id);positions.add(key);}
  if(['sequel_to','prequel_to'].includes(c.predicate)){const a=c.predicate==='sequel_to'?c.from.id:c.to.id,z=c.predicate==='sequel_to'?c.to.id:c.from.id;const list=successors.get(a)||[];list.push(z);successors.set(a,list);}
  if(c.predicate.startsWith('shares_')){
   if(!c.derivation||!c.via){add('missing-derivation',c.id);continue;}
   const premises=c.derivation.premiseIds.map(id=>map.get(id));
   if(premises.some(p=>!p||p.entityType!=='connection'||p.id===c.id)){add('derivation-premise',c.id);continue;}
   const owner=p=>p.from.id===c.via.id?p.to.id:p.to.id===c.via.id?p.from.id:null;
   if(new Set(premises.map(owner)).size!==2||!premises.some(p=>owner(p)===c.from.id)||!premises.some(p=>owner(p)===c.to.id))add('derivation-path',c.id);
   const allowed=c.predicate==='shares_character_with'?['appears_in']:['set_in','mentioned_in'];
   if(premises.some(p=>!allowed.includes(p.predicate)))add('derivation-kind',c.id);
   if(premises.some(p=>['plot','ending'].includes(p.spoiler.level))&&!['plot','ending'].includes(c.spoiler.level))add('derivation-spoiler',c.id);
  }
 }
 const visit=(id,stack=new Set(),done=new Set())=>{if(stack.has(id)){add('sequel-cycle',id);return;}if(done.has(id))return;stack.add(id);for(const n of successors.get(id)||[])visit(n,stack,done);stack.delete(id);done.add(id);};for(const id of successors.keys())visit(id);
 if(review.towerRecords.length!==17||new Set(review.towerRecords.map(r=>r.index)).size!==17||review.towerRecords.some(r=>r.index<0||r.index>16))add('tower-scope','Exactly 17 rows required');
 if(review.screenCandidates.length!==78||new Set(review.screenCandidates.map(c=>c.adaptationId+'/'+c.target.id)).size!==78)add('screen-review-scope','Exactly 78 inherited pairs required');
 for(const c of review.connections){
  const r=map.get(c.id);if(!r){add('missing-reviewed-connection',c.id);continue;}
  for(const field of ['from','predicate','to','certainty','explanation','spoiler',...(c.derivation?['derivation','via']:[])]){
   const claim=bundle.claims.find(k=>r.verification.claimIds.includes(k.id)&&k.fieldPath==='/'+field&&k.selected);
   if(!claim||!claim.sourceIds.length||claim.status!==c.status)add('universe-claim',c.id+'/'+field);
  }
 }
 for(const r of review.towerRecords)for(const id of r.connectionIds)if(!map.has(id))add('tower-reference',id);
 for(const r of review.screenCandidates){
  if(!map.has(r.adaptationId)||!map.has(r.target.id))add('candidate-reference',r.adaptationId);
  if(r.outcome==='confirmed'&&!r.connectionIds.some(id=>{const c=map.get(id);return c?.from.id===r.adaptationId&&c.to.id===r.target.id&&c.predicate==='adaptation_of';}))add('unsupported-confirmation',r.adaptationId);
  if(r.outcome!=='confirmed'&&r.connectionIds.length)add('candidate-overclaim',r.adaptationId);
 }
 return errors;
}
module.exports={validateUniverse};
