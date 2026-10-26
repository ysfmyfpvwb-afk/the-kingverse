'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {ROOT,loadBundle,validate}=require('../scripts/validate_foundation.cjs');
const {generateShadow,hash}=require('../scripts/migrate_shadow.cjs');
const {validateUniverse}=require('../scripts/validate_universe.cjs');
const {TAXONOMY,projectGraph,neighbors,seriesNavigation,relationships,semanticKey}=require('../scripts/universe_model.cjs');
const read=f=>JSON.parse(fs.readFileSync(ROOT+'/'+f,'utf8')),fresh=()=>loadBundle(ROOT+'/data/v2-shadow'),review=()=>read('data/migration/batch-05-review.json');
test('Batch 05 preserves every prior native record, alias and canonical ID; historical batches remain bounded',()=>{
 const b=fresh(),prior=generateShadow(ROOT,{batch:'04'}).bundle,map=new Map(Object.values(b).filter(Array.isArray).flat().filter(r=>r?.id).map(r=>[r.id,r]));
 for(const r of Object.values(prior).filter(Array.isArray).flat().filter(r=>r?.id))assert.equal(hash(JSON.stringify(map.get(r.id))),hash(JSON.stringify(r)),r.id);
 for(const a of prior.registry.aliases)assert.ok(b.registry.aliases.some(n=>JSON.stringify(n)===JSON.stringify(a)));
 assert.equal(prior.connections.length,26);assert.equal(b.connections.length,94);assert.equal(b.works.length,241);assert.equal(b.collections.length,15);assert.equal(b.editions.length,154);assert.equal(b.adaptations.length,96);
 assert.equal(validate(loadBundle()).valid,true);assert.equal(validate(b,{checkCompatibility:false}).valid,true);
});
test('Exactly 17 legacy Tower source rows receive mutually exclusive traceable decisions',()=>{
 const r=review(),b=fresh(),counts={};for(const row of r.towerRecords){counts[row.outcome]=(counts[row.outcome]||0)+1;assert.ok(row.connectionIds.every(id=>b.connections.some(c=>c.id===id)));}
 assert.deepEqual(counts,{migrated:13,merged:2,provisional:2});assert.deepEqual(r.towerRecords.map(r=>r.index),Array.from({length:17},(_,i)=>i));
 assert.deepEqual(r.towerRecords[8].connectionIds,['rel:000007']);assert.deepEqual(r.towerRecords[12].connectionIds,['rel:000008']);
});
test('All 78 exact inherited screen pairs assessed without title matching or whole-series volume inflation',()=>{
 const r=review(),inv=read('data/migration/batch-05-inventory.json'),key=x=>x.adaptationId+'/'+x.target.id;
 assert.deepEqual(r.screenCandidates.map(key),inv.screenCandidateScope.map(key));
 const counts={};for(const c of r.screenCandidates)counts[c.outcome]=(counts[c.outcome]||0)+1;
 assert.deepEqual(counts,{ 'insufficient-evidence':43,confirmed:24,provisional:11 });
 const seriesCandidates=r.screenCandidates.filter(c=>c.legacyFilmId==='films:the-dark-tower-2017');assert.equal(seriesCandidates.length,6);assert.ok(seriesCandidates.every(c=>c.outcome==='provisional'&&!c.connectionIds.length));
 const b=fresh();assert.equal(b.connections.filter(c=>c.predicate==='adaptation_of'&&c.to.type==='series').length,1);
 const q=read('data/migration/batch-05-decisions.json');assert.equal(q.sourceSupportedLiteraryConnections,38);assert.equal(q.separateRemakeConnections,2);
});
test('Every new verified connection has field-scoped claims and inspected evidence; unavailable direct acquisition stays recorded',()=>{
 const b=fresh(),r=review(),acq=read('data/migration/batch-05-acquisition.json');
 assert.deepEqual(validateUniverse(b,r),[]);
 for(const edge of r.connections){const c=b.connections.find(c=>c.id===edge.id);for(const field of ['from','predicate','to','certainty','explanation','spoiler'])assert.ok(b.claims.some(k=>c.verification.claimIds.includes(k.id)&&k.fieldPath==='/'+field&&k.status===edge.status));}
 assert.ok(acq.sources.some(s=>s.error?.includes('403')));assert.ok(acq.sources.some(s=>s.url.endsWith('/darktower/books/')&&s.error?.includes('404')));assert.equal(acq.readerObservations[0].access,'full-public-page');
 for(const c of r.screenCandidates){assert.ok(c.reviewSources.every(url=>acq.sources.some(s=>s.url===url)));}
});
test('Series and trilogy navigation reuse identities and existing sequel chain without changing makers',()=>{
 const b=fresh(),n=seriesNavigation(b,'wrk:000067');assert.deepEqual(n.map(c=>c.from.id),['wrk:000001','wrk:000002','wrk:000067']);assert.deepEqual(n.map(c=>c.seriesPosition),[1,2,3]);
 assert.equal(b.series.length,2);const wind=b.connections.find(c=>c.from.id==='wrk:000049'&&c.predicate==='part_of_series');assert.equal(wind.seriesPosition,undefined);
 const old=generateShadow(ROOT,{batch:'04'}).bundle;assert.deepEqual(b.credits,old.credits);assert.equal(b.works.filter(w=>w.originalTitle==='Other Worlds Than These').length,1);
 assert.ok(neighbors(b,'wrk:000067').edges.some(c=>c.predicate==='sequel_to'));
});
test('Taxonomy adapters retain existing predicates and membership IDs rather than duplicating 155 edges',()=>{
 const b=fresh();for(const type of ['sequel_of','prequel_of','part_of_series','contains_story','features_character','takes_place_in','shares_character_with','shares_location_with','references_work','dark_tower_connection','adaptation_of','remake_of'])assert.ok(TAXONOMY[type]);
 const m=b.collectionMemberships[0],projected=relationships(b,m.collectionId,{type:'contains_story'});assert.ok(projected.some(e=>e.id===m.id&&e.to.id===m.workId));assert.ok(!b.connections.some(c=>c.predicate==='contains_story'));
 assert.ok(relationships(b,'wrk:000001',{type:'features_character'}).some(c=>c.to.id==='chr:000001'));assert.equal(relationships(b,'wrk:000002',{type:'sequel_of'})[0].to.id,'wrk:000001');
});
test('Default graph filters plot, ending and sensitive entities before labels, aliases and explanations',()=>{
 const b=fresh();b.characters.find(c=>c.id==='chr:000005').aliases=[{value:'SPOILER_ALIAS'}];const secret=b.connections.find(c=>c.spoiler.level==='plot');secret.explanation.en='SPOILER_EXPLANATION';
 const sensitive=b.characters.find(c=>c.id==='chr:000005');sensitive.name='SPOILER_NAME';
 const plain=JSON.stringify(projectGraph(b)),full=JSON.stringify(projectGraph(b,{allowPlot:true}));assert.ok(!plain.includes('SPOILER_'));assert.equal(JSON.stringify(projectGraph(b,{allowPlot:'false'})),plain);assert.ok(full.includes('SPOILER_NAME')&&full.includes('SPOILER_EXPLANATION'));assert.ok(!full.includes('SPOILER_ALIAS'));
 assert.ok(projectGraph(b).edges.every(c=>!['plot','ending'].includes(c.spoiler.level)));
 // A wrongly downgraded edge cannot expose a plot-sensitive node.
 const c=b.connections.find(c=>c.from.id===sensitive.id);c.spoiler.level='premise';assert.ok(!JSON.stringify(projectGraph(b)).includes('SPOILER_NAME'));
});
test('Default dashboard contains no new plot names, pairs or descriptions in visible HTML, metadata or accessibility labels',()=>{
 const html=fs.readFileSync(ROOT+'/migration-quality.html','utf8'),safe=JSON.stringify(read('data/migration/universe-safe.json'));
 for(const text of ['Father Callahan','Ted Brautigan','Patrick Danville','Dinky Earnshaw','Maturin','can-toi','Lud is mentioned']){assert.ok(!html.includes(text),text);assert.ok(!safe.includes(text),text);}
 assert.ok(html.includes('contains plot spoilers'));assert.ok(html.includes('id="connected-universe"'));
});
test('Shared-entity derivations require real premises and inherit spoiler sensitivity',()=>{
 for(const mutate of [c=>c.derivation.premiseIds=['rel:999999','rel:000001'],c=>c.via.id='chr:000001',c=>c.spoiler.level='none']){const b=fresh(),c=b.connections.find(c=>c.derivation);mutate(c);assert.ok(validateUniverse(b,review()).some(e=>e.code.startsWith('derivation')));}
 const b=fresh(),rose=b.connections.find(c=>c.predicate==='mentioned_in'&&c.to.id==='wrk:000030');assert.ok(rose);assert.ok(!b.connections.some(c=>c.from.id==='wrk:000030'&&c.predicate==='set_in'));
});
test('Semantic duplicates, inverse sequel duplication, cycles and conflicting series positions fail',()=>{
 const b=fresh(),source=b.connections.find(c=>c.id==='rel:000001');b.connections.push({...source,id:'rel:999998',from:source.to,to:source.from,predicate:'prequel_to'});assert.ok(validateUniverse(b,review()).some(e=>e.code==='semantic-duplicate'));
 const c=fresh();c.connections.push({...source,id:'rel:999998',from:source.to,to:source.from});assert.ok(validateUniverse(c,review()).some(e=>e.code==='sequel-cycle'));
 const d=fresh(),members=d.connections.filter(c=>c.predicate==='part_of_series'&&c.seriesPosition);members[1].seriesPosition=members[0].seriesPosition;assert.ok(validateUniverse(d,review()).some(e=>e.code==='series-position-conflict'));
 const e=fresh(),old=e.connections.find(c=>c.id==='rel:000006');const duplicate={...old,to:{type:'work',id:'wrk:000025'}};assert.equal(semanticKey(e,old),semanticKey(e,duplicate));
});
test('Provisional targets, unproven identities and publication/rights questions are not silently promoted',()=>{
 const b=fresh(),r=review();assert.ok(!b.connections.some(c=>c.predicate==='same_as'));assert.ok(!b.characters.some(c=>c.name==='Maturin'));assert.equal(r.assessments[0].connectionId,'rel:000007');
 const plotted=projectGraph(b,{allowPlot:true,assessments:r.assessments});assert.equal(plotted.edges.find(c=>c.id==='rel:000007').verification,'provisional');
 const bad=review();bad.screenCandidates.find(c=>c.outcome==='insufficient-evidence').outcome='confirmed';assert.ok(validateUniverse(b,bad).some(e=>e.code==='unsupported-confirmation'));
});
