'use strict';
// Read-only view of canonical v2 records. Reverse edges are derived, never stored.
const {readGenerated} = require('./foundation_compat.cjs');
const labels={sequel_to:['Sequel to','Continues in'],appears_in:['Appears in','Features'],set_in:['Set in','Setting of'],shared_reference:['Shared reference','Shared reference'],shared_cosmology:['Shared cosmology','Shared cosmology']};
const certainty={'explicit':'Explicit','strongly-implied':'Strongly implied','interpretive':'Interpretative'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createModel(bundle,root){
 const tables=['works','people','characters','locations'];
 const entities=new Map(tables.flatMap(t=>bundle[t]).map(r=>[r.id,r]));
 const registered=new Map(bundle.registry.entries.map(r=>[r.id,r.type]));
 for(const r of entities.values())if(registered.get(r.id)!==r.entityType)throw Error('Unregistered Explorer identity');
 const legacy=readGenerated('catalog.js','DB',root);
 const external=new Map(bundle.externalReferences.map(r=>{
  const book=legacy.books.find(b=>b.workId===r.legacyId);
  if(!book)throw Error('Unresolved external book '+r.id);
  return [r.id,{...r,name:book['Engelse titel'],href:'../../../?lang=en#books?item='+encodeURIComponent(book.id)}];
 }));
 const name=r=>r.originalTitle||r.name;
 const route=r=>r.entityType+'/'+r.id.split(':')[1]+'/';
 const href=r=>r.entityType==='externalReference'?r.href:'../../'+route(r);
 const get=id=>entities.get(id)||external.get(id);
 const sources=(r,field)=>{
  const claims=bundle.claims.filter(c=>c.subject.id===r.id&&c.selected&&(!field||c.fieldPath===field));
  return {claims,sources:[...new Set(claims.flatMap(c=>c.sourceIds))].map(id=>bundle.sources.find(s=>s.id===id))};
 };
 const relations=(id,plot=false)=>entities.get(id)?.entityType==='person' ? (plot?[]:bundle.credits.filter(c=>c.personId===id).map(c=>({...c,target:get(c.subject.id),label:c.role==='coauthor'?'Co-author of':c.role,certainty:'explicit',explanation:{en:'Credited for the '+c.scope.replaceAll('-',' ')+'.'},evidence:sources(c)}))) : bundle.connections.filter(c=>(c.from.id===id||c.to.id===id)&& (plot?c.spoiler.level==='plot':['none','premise'].includes(c.spoiler.level))).map(c=>{
  const reverse=c.to.id===id;const target=get(reverse?c.from.id:c.to.id);
  if(!target)throw Error('Unresolved Explorer relation');
  return {...c,target,label:(labels[c.predicate]||[c.predicate,c.predicate])[reverse?1:0],evidence:sources(c)};
 });
 return {bundle,entities,external,name,route,href,get,sources,relations};
}
module.exports={createModel,esc,certainty};
