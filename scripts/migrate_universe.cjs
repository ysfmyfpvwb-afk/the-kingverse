'use strict';
const fs=require('node:fs'),path=require('node:path');
const {projectGraph}=require('./universe_model.cjs');
const count=(rows,key)=>rows.reduce((a,r)=>(a[r[key]]=(a[r[key]]||0)+1,a),{});
function migrateUniverse({root,db,bundle,point,allocation}){
 const review=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-05-review.json'),'utf8'));
 const acquisition=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-05-acquisition.json'),'utf8'));
 const insert=(table,r)=>{bundle[table].push(r);bundle.registry.entries.push({id:r.id,type:r.entityType});};
 for(const[url,id]of Object.entries(allocation.sources)){
  const evidence=acquisition.sources.find(s=>s.url===url);const readable=acquisition.readerObservations?.some(s=>s.url===url&&s.access==='full-public-page');
  insert('sources',{id,entityType:'source',url,publisher:new URL(url).hostname,sourceType:url.includes('simonandschuster')?'official-publisher':url.includes('catalog.afi')?'reference':url.includes('/darktower/')?'official-bibliography':'official-production',publishedAt:null,observedAt:review.checked,access:evidence?.access==='public-html'||readable?'available':'blocked',snapshotRef:'data/migration/batch-05-acquisition.json',notes:evidence?.access==='public-html'?'Public page inspected for the specific statement in Batch 05; acquisition does not verify other fields.':'Direct request blocked. Publisher page text inspected in the search/browser reader; no image or access-control workaround. See scoped review.'});
 }
 for(const r of [...review.entities,...review.connections]){
  const {source,locator,status='verified',...fields}=r;
  const record={...fields,verification:{claimIds:[],open:status==='provisional'?['relationshipEvidenceProvisional']:[]}};
  insert(r.entityType==='connection'?'connections':r.entityType==='series'?'series':r.entityType==='character'?'characters':'locations',record);
  for(const[field,value]of Object.entries(fields)){
   if(['id','entityType','aliases'].includes(field))continue;
   const id=allocation.claims[r.id+'/'+field];if(!id)throw Error('Unallocated Batch 05 claim '+r.id+'/'+field);
   insert('claims',{id,entityType:'claim',subject:{type:r.entityType,id:r.id},fieldPath:'/'+field,value:structuredClone(value),sourceIds:[allocation.sources[source]],locator,status,observedAt:review.checked,independentlyConfirmed:status==='verified'&&!r.derivation,selected:true,decisionNote:r.derivation?'Editorial derivation through separately sourced premises; not a direct source assertion.':'Bounded manual review of this field only; not full record or worldwide verification.'});record.verification.claimIds.push(id);
  }
 }
 // Canonical field ledger records only actually mapped relationship leaves. All other source leaves stay preserved.
 for(const r of review.towerRecords){const c=bundle.connections.find(c=>c.id===r.connectionIds[0]);if(!c)throw Error('Missing Tower target');point('/tower/'+r.index+'/certainty',c.id,'/certainty','reviewed-certainty-not-automatic-copy');}
 const status=c=>c.verification.claimIds.every(id=>bundle.claims.find(x=>x.id===id)?.status==='verified')?'source-supported':'provisional';
 const all=bundle.connections.map(c=>({...c,status:review.assessments.some(a=>a.connectionId===c.id)?'provisional':status(c)}));
 const summary={batch:'05',checked:review.checked,completeUniverse:false,definitions:review.definitions,baseCommit:review.baseCommit,newNativeConnections:review.connections.length,newSourceReviewedConnections:review.connections.filter(c=>c.status==='verified').length,totalNativeConnections:bundle.connections.length,byType:count(all,'predicate'),byCertainty:count(all,'certainty'),byVerification:count(all,'status'),spoilerSensitive:all.filter(c=>['plot','ending'].includes(c.spoiler.level)).length,derived:all.filter(c=>c.derivation).length,tower:{total:17,byOutcome:count(review.towerRecords,'outcome'),records:review.towerRecords},screenCandidates:{total:78,byOutcome:count(review.screenCandidates,'outcome'),records:review.screenCandidates},sourceSupportedLiteraryConnections:all.filter(c=>['adaptation_of','inspired_by'].includes(c.predicate)&&c.to.type!=='series'&&c.status==='source-supported').length,seriesAdaptationConnections:all.filter(c=>c.predicate==='adaptation_of'&&c.to.type==='series').length,separateRemakeConnections:all.filter(c=>c.predicate==='remake_of').length,entities:{characters:bundle.characters.length,locations:bundle.locations.length,series:bundle.series.length},orphanReferences:all.filter(c=>![c.from.id,c.to.id].every(id=>bundle.registry.entries.some(e=>e.id===id))).length,missingSources:all.filter(c=>!c.verification.claimIds.length||c.verification.claimIds.some(id=>!bundle.claims.find(k=>k.id===id)?.sourceIds.length)).length,priorRecordAssessmentOverrides:review.assessments,readiness:'Not ready for a full Explorer switch: unresolved source targets, publication/edition history, image rights and complete UI compatibility require further review.'};
 return {summary,towerRecords:review.towerRecords,screenCandidates:review.screenCandidates,safe:projectGraph(bundle,{assessments:review.assessments}),plot:projectGraph(bundle,{allowPlot:true,assessments:review.assessments})};
}
module.exports={migrateUniverse};
