'use strict';
// Offline query model only. Deliberately not connected to the visitor runtime.
const TAXONOMY=Object.freeze({sequel_of:{predicate:'sequel_to'},prequel_of:{predicate:'prequel_to'},part_of_series:{predicate:'part_of_series'},contains_story:{table:'collectionMemberships',inverse:true},features_character:{predicate:'appears_in',inverse:true},takes_place_in:{predicate:'set_in'},shares_character_with:{predicate:'shares_character_with',derived:true},shares_location_with:{predicate:'shares_location_with',derived:true},references_work:{predicate:'references_work'},dark_tower_connection:{predicate:'dark_tower_connection'},adaptation_of:{predicate:'adaptation_of'},remake_of:{predicate:'remake_of'}});
const records=b=>Object.values(b).filter(Array.isArray).flat().filter(x=>x?.id);
function projectGraph(bundle,{allowPlot=false,assessments=[]}={}){
 allowPlot=allowPlot===true;
 const map=new Map(records(bundle).map(r=>[r.id,r]));
 const safe=r=>allowPlot||!['plot','ending'].includes(r.spoiler?.level);
 // Filter before resolving endpoints, source notes, aliases, explanations or accessibility labels.
 const edges=bundle.connections.filter(c=>safe(c)&&safe(map.get(c.from.id)||{})&&safe(map.get(c.to.id)||{}));
 const ids=new Set(edges.flatMap(e=>[e.from.id,e.to.id]));
 const nodes=[...ids].map(id=>{const r=map.get(id);return {id,type:r.entityType,label:r.originalTitle||r.name||r.title?.en||r.title||id};});
 return {scope:allowPlot?'explicit-plot-opt-in':'default-no-plot',publicDataIsNotSecret:true,nodes,edges:edges.map(c=>({id:c.id,from:c.from,to:c.to,predicate:c.predicate,certainty:c.certainty,spoiler:c.spoiler,explanation:c.explanation.en,claimIds:c.verification.claimIds,verification:assessments.some(a=>a.connectionId===c.id)?'provisional':c.verification.claimIds.every(id=>bundle.claims.find(k=>k.id===id)?.status==='verified')?'source-supported':'provisional',...(c.seriesPosition?{seriesPosition:c.seriesPosition}:{}),...(c.derivation?{derived:true,premiseIds:c.derivation.premiseIds}:{})}))};
}
function neighbors(bundle,id,options){const graph=projectGraph(bundle,options);const edges=graph.edges.filter(e=>e.from.id===id||e.to.id===id);const ids=new Set(edges.flatMap(e=>[e.from.id,e.to.id]));return {...graph,nodes:graph.nodes.filter(n=>ids.has(n.id)),edges};}
function seriesNavigation(bundle,workId,options){const graph=projectGraph(bundle,options);const seriesIds=graph.edges.filter(e=>e.from.id===workId&&e.predicate==='part_of_series').map(e=>e.to.id);return graph.edges.filter(e=>e.predicate==='part_of_series'&&seriesIds.includes(e.to.id)).sort((a,b)=>(a.seriesPosition||Infinity)-(b.seriesPosition||Infinity));}
function relationships(bundle,id,{type,...options}={}){
 const rule=TAXONOMY[type];if(!rule)throw Error('Unknown relationship type '+type);
 if(rule.table==='collectionMemberships')return bundle.collectionMemberships.filter(m=>m.collectionId===id).map(m=>({id:m.id,from:{type:'collection',id:m.collectionId},to:{type:'work',id:m.workId},predicate:'contains_story',claimIds:m.verification.claimIds,order:m.order}));
 return projectGraph(bundle,options).edges.filter(e=>e.predicate===rule.predicate).map(e=>rule.inverse?{...e,from:e.to,to:e.from}:e).filter(e=>e.from.id===id);
}
function canonicalTarget(bundle,id){const x=bundle.externalReferences.find(x=>x.id===id);return x?bundle.registry.aliases.find(a=>a.alias===x.legacyId)?.target.id||id:id;}
function semanticKey(bundle,c){let a=canonicalTarget(bundle,c.from.id),z=canonicalTarget(bundle,c.to.id),p=c.predicate;if(p==='prequel_to'){[a,z]=[z,a];p='sequel_to';}if(['shares_character_with','shares_location_with','shared_reference','shared_cosmology','thematic_parallel','same_as'].includes(p)&&a>z)[a,z]=[z,a];return JSON.stringify([a,p,z]);}
module.exports={TAXONOMY,projectGraph,neighbors,seriesNavigation,relationships,semanticKey,canonicalTarget};
