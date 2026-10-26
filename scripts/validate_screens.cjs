'use strict';
const Ajv=require('ajv'),schema=require('../schemas/poster-provenance.schema.json');const check=new Ajv({allErrors:true,strict:true}).compile(schema);
function validateScreens(bundle,views,policy){
 const errors=[],add=(code,message)=>errors.push({code,message});const adp=new Map(bundle.adaptations.map(a=>[a.id,a])),arts=new Map(bundle.artworks.map(a=>[a.id,a])),literary=new Map([...bundle.works,...bundle.collections].map(w=>[w.id,w])),connections=new Map(bundle.connections.map(r=>[r.id,r]));
 if(!check(policy)){add('poster-policy-schema',JSON.stringify(check.errors));return errors;}
 const seen=new Set();for(const p of policy.posters){if(!adp.has(p.adaptationId)||seen.has(p.adaptationId))add('poster-policy-identity',p.adaptationId);seen.add(p.adaptationId);const art=arts.get(p.artworkId);
  if(p.artworkId&&(!art||art.kind!=='poster'||art.adaptationId!==p.adaptationId||art.url!==p.originalUrl||art.language!=='en'))add('poster-policy-owner',p.adaptationId);
  if(!p.artworkId&&(p.originalUrl!==null||p.bibliographicStatus!=='no-registered-poster'))add('poster-policy-missing',p.adaptationId);
  const allowed=!!art&&p.rights.status==='allowed'&&p.rights.evidence.length>0&&p.availability.status==='available'&&p.delivery.status==='approved'&&p.delivery.reliable;
  if((p.displayAllowed||p.delivery.status==='approved')&&!allowed)add('poster-permission-gate',p.adaptationId);
  if(p.approvedLocalAsset&&(p.rights.status!=='allowed'||!p.rights.evidence.length))add('poster-local-permission',p.adaptationId);
 }
 if(seen.size!==adp.size)add('poster-policy-coverage','Every adaptation must have one explicit poster policy.');
 const ids=new Set();for(const v of views.views){if(!adp.has(v.adaptationId)||ids.has(v.adaptationId))add('screen-view-identity',v.legacyId);ids.add(v.adaptationId);const a=adp.get(v.adaptationId),pairs=new Set();
  for(const c of v.sourceCandidates){const t=literary.get(c.target.id);if(!t||t.entityType!==c.target.type)add('screen-source-reference',v.legacyId);if(pairs.has(c.target.id))add('duplicate-screen-candidate',v.legacyId);pairs.add(c.target.id);
   if(c.verification==='source-supported'&&!c.connectionId)add('screen-source-evidence',v.legacyId);
   if(c.connectionId){const r=connections.get(c.connectionId);if(!r||r.from.id!==v.adaptationId||r.to.id!==c.target.id)add('screen-source-owner',v.legacyId);if(c.category==='collection-context'||c.category==='screenplay-segment-context')add('screen-context-not-adaptation',v.legacyId);}
  }
  for(const id of v.verifiedRelationIds){const r=connections.get(id);if(!r||r.from.id!==v.adaptationId||r.verification.claimIds.some(id=>bundle.claims.find(c=>c.id===id)?.status!=='verified'))add('screen-relation-evidence',v.legacyId);}
  if(a){if(a.ratingObservations.length)add('screen-rating-import',a.id);if(a.statusHistory.at(-1)?.status!==v.selectedStatus)add('screen-status-projection',a.id);if(v.selectedStatus==='unknown'&&a.releaseEvents.length)add('unconfirmed-screen-release',a.id);}
 }
 if(ids.size!==adp.size)add('screen-view-coverage','Screen views must cover each canonical production once.');
 for(const a of adp.values()){
  for(const h of a.statusHistory)for(const id of h.claimIds){const c=bundle.claims.find(c=>c.id===id);if(!c||c.subject.id!==a.id||c.fieldPath!=='/statusHistory')add('screen-status-evidence',a.id);}
  for(const p of a.productionUnits||[])if(p.status!=='released'&&p.releaseDate!==null)add('unreleased-unit-date',a.id);
  if((a.productionUnits||[]).some(p=>p.kind==='season'&&p.number===2&&p.status==='announced')&&a.productionUnits.find(p=>p.number===2).releaseDate!==null)add('season-scope',a.id);
 }
 return errors;
}
module.exports={validateScreens};
