'use strict';
const {combineProjection,NAV_TABLES}=require('./explorer_ready_model.cjs');
const {canonicalTarget}=require('./universe_model.cjs');
function validateReady(base,plot,bundle){
 const errors=[],fail=(code,message)=>errors.push({code,message});
 const full=combineProjection(base,plot,{allowPlot:true}),ids=new Map(full.nodes.map(n=>[n.id,n])),claims=new Map(bundle.claims.map(c=>[c.id,c]));
 if(ids.size!==full.nodes.length||new Set([...base.nodes,...plot.nodes].map(n=>n.id)).size!==base.nodes.length+plot.nodes.length)fail('projection-duplicate','Entity duplicated');
 const canonical=new Map(NAV_TABLES.flatMap(t=>bundle[t]).map(n=>[n.id,n]));const expected=canonical.size;
 for(const n of full.nodes)if(canonical.get(n.id)?.entityType!==n.type)fail('projection-entity-identity',n.id);
 if(ids.size!==expected)fail('projection-coverage','Missing canonical navigable entity');
 const safe=new Set(base.nodes.map(n=>n.id));
 for(const p of [base,plot]){
  const sources=new Map(p.sources.map(s=>[s.id,s]));for(const s of p.sources){const old=bundle.sources.find(k=>k.id===s.id);if(!old||['url','publisher','sourceType','observedAt','access'].some(k=>s[k]!==old[k]))fail('projection-source-metadata',s.id);}
  const evidence=[...p.nodes,...p.connections,...p.memberships,...p.credits,...p.publications].flatMap(r=>r.evidence);
  for(const c of evidence){const old=claims.get(c.id);if(!old||old.fieldPath!==c.fieldPath||old.status!==c.status||old.observedAt!==c.observedAt||old.independentlyConfirmed!==c.independentlyConfirmed||old.selected!==c.selected||JSON.stringify(old.subject)!==JSON.stringify(c.subject)||JSON.stringify(old.sourceIds)!==JSON.stringify(c.sourceIds))fail('projection-evidence',c.id);for(const id of c.sourceIds)if(!sources.has(id))fail('projection-source',id);if('value'in c||'locator'in c||'decisionNote'in c)fail('projection-unsafe-prose',c.id);}
  for(const n of p.nodes){if(n.href!=='#entity='+encodeURIComponent(n.id))fail('projection-route',n.id);if(p===base&&['plot','ending'].includes(n.spoiler.level))fail('projection-spoiler-node',n.id);for(const k of ['summary','aliases','continuity','makerObservations','externalIds','ratingObservations'])if(k in n.data)fail('projection-unsafe-field',n.id+'/'+k);}
  for(const e of p.connections){
   if(!ids.has(e.from.id)||!ids.has(e.to.id))fail('projection-orphan',e.id);
   const old=bundle.connections.find(c=>c.id===e.id);
   if(!old||canonicalTarget(bundle,old.from.id)!==e.from.id||canonicalTarget(bundle,old.to.id)!==e.to.id||old.certainty!==e.certainty||JSON.stringify(old.spoiler)!==JSON.stringify(e.spoiler)||old.predicate!==e.predicate||JSON.stringify(old.derivation)!==JSON.stringify(e.derivation))fail('projection-relationship-loss',e.id);
   if(p===base&&(['plot','ending'].includes(e.spoiler.level)||!safe.has(e.from.id)||!safe.has(e.to.id)))fail('projection-spoiler-edge',e.id);
  }
 }
 if(base.connections.length+plot.connections.length!==full.connections.length||full.connections.length!==bundle.connections.length||new Set([...base.connections,...plot.connections].map(e=>e.id)).size!==bundle.connections.length)fail('projection-relation-coverage','Native relation lost or duplicated');
 for(const m of full.memberships)if(ids.get(m.collectionId)?.type!=='collection'||ids.get(m.workId)?.type!=='work')fail('projection-membership',m.id);
 for(const n of full.nodes.filter(n=>n.type==='edition'))if(!ids.has(n.data.publicationOf.id))fail('projection-edition',n.id);
 for(const c of full.credits)if(ids.get(c.personId)?.type!=='person'||!ids.has(c.subject.id))fail('projection-credit',c.id);
 for(const a of base.aliases)if(!safe.has(a.target.id))fail('projection-alias',a.alias);
 for(const c of base.candidates)if(!safe.has(c.adaptationId)||!safe.has(c.target.id)||c.status==='confirmed')fail('projection-candidate',c.adaptationId);
 return errors;
}
module.exports={validateReady};
