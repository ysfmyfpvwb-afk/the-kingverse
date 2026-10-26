'use strict';
const Ajv=require('ajv');const schema=require('../schemas/cover-provenance.schema.json');
const check=new Ajv({allErrors:true,strict:true}).compile(schema);
function validateCoverProvenance(policy,bundle){
 const errors=[];const add=(code,message)=>errors.push({code,message});
 if(!check(policy)){add('cover-policy-schema',JSON.stringify(check.errors));return errors;}
 const editions=new Map(bundle.editions.map(e=>[e.id,e])),art=new Map(bundle.artworks.map(a=>[a.id,a])),seen=new Set();
 for(const c of policy.covers){
  if(!editions.has(c.editionId)||seen.has(c.editionId))add('cover-policy-edition',c.editionId);seen.add(c.editionId);
  const a=art.get(c.artworkId);
  if(c.artworkId&&(!a||a.editionId!==c.editionId||a.url!==c.originalUrl))add('cover-policy-owner',c.editionId);
  if(!c.artworkId&&(c.originalUrl!==null||c.bibliographicStatus!=='no-registered-cover'))add('cover-policy-unknown',c.editionId);
  const allowed=!!a&&c.rights.status==='allowed'&&c.rights.evidence.length>0&&c.delivery.reliable&&c.delivery.status==='approved'&&c.availability.status==='available';
  if(c.displayAllowed&&!allowed)add('cover-permission-gate',c.editionId);
  if(c.approvedLocalAsset&&(c.rights.status!=='allowed'||!c.rights.evidence.length))add('local-asset-permission',c.editionId);
  if(c.availability.status==='referrer-dependent-refusal'&&c.delivery.reliable)add('cover-referrer-restriction',c.editionId);
 }
 if(seen.size!==editions.size)add('cover-policy-coverage','Every edition needs an explicit cover decision, including missing covers.');
 return errors;
}
module.exports={validateCoverProvenance};
