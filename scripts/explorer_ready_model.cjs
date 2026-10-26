'use strict';
// Projection contract for isolated integration. Never imported by the visitor application.
const {canonicalTarget}=require('./universe_model.cjs');
const {resolveAlias}=require('./foundation_compat.cjs');
const {permittedLocal}=require('./build_media_library.cjs');
const NAV_TABLES=['works','collections','editions','adaptations','people','characters','locations','series'];
const sensitive=r=>['plot','ending'].includes(r.spoiler?.level);
const DISPLAY_FIELDS=Object.freeze({work:['originalTitle','kind','originalLanguage'],collection:['originalTitle','collectionKind'],edition:['title','publicationOf','language','isbn13','publisher','publicationDate','format','identityStatus','translationCredits'],adaptation:['title','format','releaseYear','releaseEvents','statusHistory','countries','originalLanguages','originalScreenplay','productionUnits','distribution'],person:['name','pseudonyms'],character:['name'],location:['name','locationKind'],series:['name','seriesKind','scope']});
const route=id=>'#entity='+encodeURIComponent(id);
function createReadyProjection(bundle,{assessments=[],screenCandidates=[],storyViews=[],media}={}){
 const all=NAV_TABLES.flatMap(k=>bundle[k]||[]),map=new Map(all.map(r=>[r.id,r]));
 if(map.size!==all.length)throw Error('Duplicate navigable identity');
 const claims=new Map(bundle.claims.map(c=>[c.id,c])),sources=new Map(bundle.sources.map(s=>[s.id,s]));
 const refs=ids=>ids.map(id=>{const c=claims.get(id);if(!c)throw Error('Missing claim '+id);for(const s of c.sourceIds)if(!sources.has(s))throw Error('Missing source '+s);return {id:c.id,subject:c.subject,fieldPath:c.fieldPath,sourceIds:c.sourceIds,status:c.status,observedAt:c.observedAt,independentlyConfirmed:c.independentlyConfirmed,selected:c.selected};});
 const evidence=(r,fields)=>refs((r.verification?.claimIds||[]).filter(id=>{const c=claims.get(id);if(!c)throw Error('Missing claim '+id);return c.selected&&fields.some(f=>c.fieldPath==='/'+f);}));
 const status=r=>r.verification?.claimIds.some(id=>claims.get(id)?.status!=='verified')?'provisional':'source-supported';
 function node(r){
  const fields=DISPLAY_FIELDS[r.entityType];
  const data=Object.fromEntries(fields.filter(k=>r[k]!==undefined).map(k=>[k,structuredClone(r[k])]));
  // Production notes, copied synopsis, aliases, continuity and unrestricted claim prose are not visitor payload.
  if(data.statusHistory)data.statusHistory=data.statusHistory.map(h=>({status:h.status,asOf:h.asOf,claimIds:h.claimIds}));
  return {id:r.id,type:r.entityType,label:r.entityType==='adaptation'?r.title+' ('+(r.releaseYear||'year unresolved')+' · '+r.format+')':r.originalTitle||r.name||r.title,href:route(r.id),spoiler:r.spoiler||{level:'none',workIds:[]},data,evidence:evidence(r,fields),verification:status(r),open:[...(r.verification?.open||[])],description:'A '+(r.kind||r.entityType)+' record in the canonical shadow catalog. Evidence and unresolved fields are shown separately.'+(r.entityType==='adaptation'?' Inherited release status does not certify first release, all seasons or current continuation.':'')};
 }
 const nodes=all.map(node),nodeMap=new Map(nodes.map(n=>[n.id,n]));
 const normalize=ref=>{const id=canonicalTarget(bundle,ref.id),n=nodeMap.get(id);if(!n||n.type!==(ref.type==='externalReference'?bundle.externalReferences.find(x=>x.id===ref.id)?.targetType:ref.type))throw Error('Broken or mistyped Explorer target '+ref.id);return {id,type:n.type};};
 const edges=bundle.connections.map(c=>{
  const from=normalize(c.from),to=normalize(c.to),override=assessments.find(a=>a.connectionId===c.id);
  return {id:c.id,from,to,predicate:c.predicate,certainty:c.certainty,verification:override?'provisional':status(c),...(override?{assessment:{status:override.status,note:override.note}}:{}),explanation:c.explanation.en,spoiler:structuredClone(c.spoiler),evidence:refs(c.verification.claimIds),...(c.via?{via:normalize(c.via)}:{}),...(c.derivation?{derivation:structuredClone(c.derivation)}:{}),...(c.seriesPosition?{seriesPosition:c.seriesPosition}:{}),originalEndpoints:{from:c.from,to:c.to}};
 });
 const memberships=bundle.collectionMemberships.map(m=>{if(nodeMap.get(m.collectionId)?.type!=='collection'||nodeMap.get(m.workId)?.type!=='work')throw Error('Broken membership '+m.id);return {id:m.id,collectionId:m.collectionId,workId:m.workId,order:m.order,editionIds:m.editionIds,verification:status(m),evidence:refs(m.verification.claimIds),spoiler:{level:'none',workIds:[]}};});
 const credits=bundle.credits.map(c=>{if(!nodeMap.has(c.personId)||!nodeMap.has(c.subject.id))throw Error('Broken credit '+c.id);return {id:c.id,personId:c.personId,subject:c.subject,role:c.role,creditedAs:c.creditedAs,scope:c.scope,characterId:c.characterId,verification:status(c),evidence:refs(c.verification.claimIds),spoiler:c.characterId&&sensitive(map.get(c.characterId)||{})?{level:'plot',workIds:[]}:{level:'none',workIds:[]}};});
 const publications=bundle.publicationEvents.map(p=>{if(!nodeMap.has(p.subject.id))throw Error('Broken publication '+p.id);return {id:p.id,subject:p.subject,eventType:p.eventType,date:p.date,publisher:p.publisher,reportedTitle:p.reportedTitle,editionId:p.editionId,verification:status(p),evidence:refs(p.verification.claimIds)};});
 const candidates=screenCandidates.filter(c=>c.outcome!=='confirmed').map(c=>{if(nodeMap.get(c.adaptationId)?.type!=='adaptation'||!nodeMap.has(c.target.id))throw Error('Broken source candidate');return {adaptationId:c.adaptationId,target:c.target,status:c.outcome,sourceUrls:c.reviewSources,checked:c.checked,label:'Unconfirmed literary source candidate; this is not an established adaptation relationship.'};});
 const decisions=media.records.map(r=>({artworkId:r.artworkId,owner:r.owner,language:r.language,kind:r.kind,displayAllowed:permittedLocal(r),localPath:permittedLocal(r)?r.localPath:null,variants:permittedLocal(r)?r.variants:[],rightsStatus:r.rights.status,fallback:r.fallback}));
 const defaults=Object.fromEntries(storyViews.filter(v=>v.defaultMembershipId).map(v=>[v.workId,v.defaultMembershipId]));
 function packageRows(scope,ns,es,ms,cs,ps,cas){
  const visible=new Set(ns.map(n=>n.id));
  const aliases=bundle.registry.aliases.filter(a=>visible.has(a.target.id));
  const claimList=[...ns.flatMap(n=>n.evidence),...es.flatMap(e=>e.evidence),...ms.flatMap(m=>m.evidence),...cs.flatMap(c=>c.evidence),...ps.flatMap(p=>p.evidence)];
  const sourceIds=new Set(claimList.flatMap(c=>c.sourceIds));
  const sourceList=[...sourceIds].sort().map(id=>{const s=sources.get(id);return {id:s.id,url:s.url,publisher:s.publisher,sourceType:s.sourceType,observedAt:s.observedAt,access:s.access};});
  return {version:1,scope,language:'en',publicJsonIsNotSecret:true,activeVisitorRuntime:false,nodes:ns,connections:es,memberships:ms,credits:cs,publications:ps,candidates:cas,sources:sourceList,aliases,defaultMemberships:defaults,media:{records:decisions.filter(d=>visible.has(d.owner.id)),fallbackAssets:media.fallbackAssets},counts:{nodes:ns.length,connections:es.length,memberships:ms.length,credits:cs.length,publications:ps.length}};
 }
 const safeNodes=nodes.filter(n=>!sensitive(n)),visible=new Set(safeNodes.map(n=>n.id));
 const safeEdges=edges.filter(e=>!sensitive(e)&&visible.has(e.from.id)&&visible.has(e.to.id)&&(!e.via||visible.has(e.via.id)));
 const safeCredits=credits.filter(c=>!sensitive(c)&&visible.has(c.personId)&&visible.has(c.subject.id));
 const defaultProjection=packageRows('default-no-plot',safeNodes,safeEdges,memberships,safeCredits,publications,candidates);
 // A separate opt-in delta, never a preloaded hidden DOM fragment or a duplicate default graph.
 const safeIds=new Set(safeEdges.map(e=>e.id));
 const plotProjection=packageRows('explicit-plot-opt-in',nodes.filter(n=>!visible.has(n.id)),edges.filter(e=>!safeIds.has(e.id)),[],credits.filter(c=>!safeCredits.some(s=>s.id===c.id)),[],[]);
 plotProjection.aliases=bundle.registry.aliases.filter(a=>!visible.has(a.target.id)&&nodeMap.has(a.target.id));
 // Publication/edition references are bibliographic; no source prose or status projectScope is copied.
 return {defaultProjection,plotProjection,counts:{canonicalNavigableEntities:nodes.length,defaultEntities:safeNodes.length,plotOnlyEntities:nodes.length-safeNodes.length,canonicalConnections:edges.length,defaultConnections:safeEdges.length,plotOnlyConnections:edges.length-safeEdges.length,memberships:memberships.length,credits:credits.length,publications:publications.length,unconfirmedSourceCandidates:candidates.length,byType:Object.fromEntries(NAV_TABLES.map(k=>[k,(bundle[k]||[]).length]))}};
}
function combineProjection(base,plot,{allowPlot=false}={}){
 if(allowPlot!==true)return structuredClone(base);
 const out=structuredClone(base);for(const k of ['nodes','connections','memberships','credits','publications','aliases','sources']){const key=r=>r.id||r.alias;const seen=new Set(out[k].map(key));for(const r of plot[k])if(!seen.has(key(r))){out[k].push(structuredClone(r));seen.add(key(r));}}
 out.scope='explicit-plot-opt-in';out.counts={nodes:out.nodes.length,connections:out.connections.length,memberships:out.memberships.length,credits:out.credits.length,publications:out.publications.length};return out;
}
function neighbors(projection,id){return projection.connections.filter(e=>e.from.id===id||e.to.id===id).map(e=>({...e,target:projection.nodes.find(n=>n.id===(e.from.id===id?e.to.id:e.from.id)),reverse:e.to.id===id}));}
function resolveLegacy(projection,input){const found=resolveAlias({registry:{aliases:projection.aliases}},input);return found?{...found,href:route(found.target.id)}:null;}
function selectMedia(projection,id,{language='en'}={}){
 const n=projection.nodes.find(n=>n.id===id);if(!n)return null;
 const fallback=kind=>projection.media.fallbackAssets.find(f=>f.kind===kind);
 function forOwner(owner,kind,extra={}){const rec=projection.media.records.find(r=>r.owner.id===owner);const f=fallback(kind);return {...extra,ownerId:owner,artworkId:rec?.artworkId||null,kind,src:rec?.displayAllowed?rec.localPath:f.localPath,variants:rec?.displayAllowed?rec.variants:[],officialArtwork:rec?.displayAllowed===true,fallbackPath:f.localPath,reason:rec?.displayAllowed?'approved-local':rec?'permission-required':'no-registered-artwork',label:rec?.displayAllowed?'Approved local artwork':'Placeholder — not official artwork'};}
 if(n.type==='adaptation')return forOwner(id,'screen');
 if(n.type==='edition')return forOwner(id,'book',{editionId:id,language:n.data.language});
 if(!['work','collection'].includes(n.type))return null;
 function editionOf(owner){const eds=projection.nodes.filter(n=>n.type==='edition'&&n.data.publicationOf.id===owner);return eds.find(e=>e.data.language===language)||(language==='nl'?eds.find(e=>e.data.language==='en'):undefined);}
 const own=editionOf(id);if(own)return forOwner(own.id,'book',{editionId:own.id,language:own.data.language,languageFallback:own.data.language!==language});
 const memberships=projection.memberships.filter(m=>m.workId===id);const registered=memberships.find(m=>m.id===projection.defaultMemberships[id]);const selected=registered?.verification==='source-supported'?registered:memberships.find(m=>m.verification==='source-supported')||registered||memberships[0];
 if(selected){const col=projection.nodes.find(n=>n.id===selected.collectionId),ed=editionOf(col.id);return ed&&selected.verification==='source-supported'?forOwner(ed.id,'book',{editionId:ed.id,collectionId:col.id,collectionLabel:col.label,collectionHref:col.href,language:ed.data.language,languageFallback:ed.data.language!==language,membershipId:selected.id,membershipVerification:selected.verification}):{kind:'collection-reference',collectionId:col.id,collectionLabel:col.label,collectionHref:col.href,membershipId:selected.id,membershipVerification:selected.verification,label:(selected.verification==='source-supported'?'Collected in ':'Reported collection (provisional): ')+col.label,src:null,officialArtwork:false};}
 // A story without a proven standalone edition is not missing a fictional own cover.
 const otherEdition=projection.nodes.find(e=>e.type==='edition'&&e.data.publicationOf.id===id);if(otherEdition)return {kind:'edition-reference',src:null,officialArtwork:false,editionId:otherEdition.id,language:otherEdition.data.language,label:'No '+language.toUpperCase()+' edition cover registered; another-language edition example is available.'};
 if(n.type==='work'&&['short-story','novella','poem'].includes(n.data.kind))return {kind:'text-only',src:null,officialArtwork:false,label:'No standalone edition or containing collection registered; no independent cover expected.'};
 return forOwner(id,'book');
}
module.exports={createReadyProjection,combineProjection,neighbors,resolveLegacy,selectMedia,NAV_TABLES,DISPLAY_FIELDS,route,sensitive};
