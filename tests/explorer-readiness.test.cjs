'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {ROOT,loadBundle}=require('../scripts/validate_foundation.cjs');
const {generateReadyFiles,checkBaseline,writeFixture}=require('../scripts/build_explorer_ready.cjs');
const {createReadyProjection,combineProjection,neighbors,resolveLegacy,selectMedia}=require('../scripts/explorer_ready_model.cjs');
const {validateReady}=require('../scripts/validate_explorer_ready.cjs');
const {generateMedia,validateMedia,permittedLocal,digest}=require('../scripts/build_media_library.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')),bundle=loadBundle(ROOT+'/data/v2-shadow'),review=read('data/migration/batch-05-review.json'),media=read('data/media/library.json');
const options={assessments:review.assessments,screenCandidates:review.screenCandidates,storyViews:read('data/migration/story-views.json').views,media};
const fresh=()=>({base:read('data/readiness/default.json'),plot:read('data/readiness/plot.json')});
test('Readiness build reproduces all outputs and every Batch 05/visitor file stays byte-identical',()=>{
 assert.equal(checkBaseline().baseCommit,'12f14beb0abb201afc40943e98658647323cb8db');
 const a=generateReadyFiles();for(const[p,v]of a.files)assert.equal(fs.readFileSync(ROOT+'/'+p,'utf8'),v,p);
 assert.deepEqual(generateReadyFiles().files,a.files);assert.equal(a.report.activeVisitorRuntime,false);assert.equal(a.report.completeBibliography,false);
});
test('546 typed entities and 94 native relationships survive the two projections without identity inflation',()=>{
 const {base,plot}=fresh(),all=combineProjection(base,plot,{allowPlot:true});assert.equal(base.nodes.length,540);assert.equal(plot.nodes.length,6);assert.equal(all.nodes.length,546);assert.equal(base.connections.length,66);assert.equal(plot.connections.length,28);assert.equal(all.connections.length,94);assert.deepEqual(validateReady(base,plot,bundle),[]);
 assert.equal(all.memberships.length,155);assert.equal(all.credits.length,291);assert.equal(all.publications.length,239);assert.equal(all.nodes.filter(n=>n.type==='edition').length,154);assert.ok(all.nodes.filter(n=>n.type==='edition').every(n=>n.data.identityStatus==='incomplete-example'));assert.deepEqual(all.nodes.find(n=>n.id==='per:000001').data.pseudonyms,['Richard Bachman']);
 const seasonal=all.nodes.find(n=>n.data.productionUnits?.length);assert.equal(seasonal.data.productionUnits[0].episodeCount,8);assert.equal(seasonal.data.productionUnits[1].status,'announced');assert.equal(seasonal.data.productionUnits[1].releaseDate,null);
 assert.equal(new Set(all.nodes.map(n=>n.id)).size,546);assert.equal(new Set(all.connections.map(n=>n.id)).size,94);
});
test('Every relationship preserves direction, certainty, spoiler, claims and current uncertainty override',()=>{
 const {base,plot}=fresh(),all=combineProjection(base,plot,{allowPlot:true});
 for(const old of bundle.connections){const p=all.connections.find(c=>c.id===old.id);assert.equal(p.predicate,old.predicate);assert.equal(p.certainty,old.certainty);assert.deepEqual(p.spoiler,old.spoiler);assert.deepEqual(p.evidence.map(e=>e.id),old.verification.claimIds);for(const c of p.evidence){const original=bundle.claims.find(k=>k.id===c.id);assert.equal(c.status,original.status);assert.deepEqual(c.sourceIds,original.sourceIds);}}
 assert.equal(all.connections.find(c=>c.id==='rel:000007').verification,'provisional');assert.equal(all.connections.find(c=>c.id==='rel:000008').verification,'provisional');
 const wrapper=all.connections.find(c=>c.id==='rel:000006');assert.equal(wrapper.to.id,'wrk:000025');assert.equal(wrapper.originalEndpoints.to.id,'xref:000001');
});
test('The complete trilogy navigates through series, sequels, makers and specific editions',()=>{
 const {base}=fresh();for(const id of ['wrk:000001','wrk:000002','wrk:000067'])assert.ok(base.nodes.some(n=>n.id===id));
 const series=base.connections.filter(e=>e.predicate==='part_of_series'&&e.to.id==='ser:000002').sort((a,b)=>a.seriesPosition-b.seriesPosition);assert.deepEqual(series.map(e=>e.from.id),['wrk:000001','wrk:000002','wrk:000067']);
 assert.ok(neighbors(base,'wrk:000002').some(e=>e.target.id==='wrk:000067'));assert.ok(neighbors(base,'wrk:000067').some(e=>e.target.id==='wrk:000002'));
 assert.ok(base.nodes.filter(n=>n.type==='edition'&&n.data.publicationOf.id==='wrk:000001').length>=2);
 const credits=base.credits.filter(c=>c.subject.id==='wrk:000067');assert.ok(credits.some(c=>c.role==='illustrator'));assert.equal(credits.filter(c=>['author','coauthor'].includes(c.role)).length,2);
});
test('Multiple collections and multiple adaptations stay many-to-many; uncertain candidates are not native edges',()=>{
 const {base}=fresh(),multi=base.memberships.filter(m=>m.workId==='wrk:000161');assert.equal(multi.length,2);assert.equal(new Set(multi.map(m=>m.collectionId)).size,2);assert.ok(multi.every(m=>m.order===null));
 const versions=base.connections.filter(c=>c.predicate==='adaptation_of'&&c.to.id==='wrk:000010');assert.equal(versions.length,2);assert.equal(new Set(versions.map(c=>base.nodes.find(n=>n.id===c.from.id).label)).size,2);
 assert.equal(base.candidates.length,54);const candidate=base.candidates.find(c=>c.status==='provisional');assert.ok(base.nodes.some(n=>n.id===candidate.adaptationId));assert.ok(base.nodes.some(n=>n.id===candidate.target.id));assert.ok(!base.connections.some(e=>e.from.id===candidate.adaptationId&&e.to.id===candidate.target.id&&e.predicate==='adaptation_of'));
 assert.ok(neighbors(base,'wrk:000007').length<neighbors(combineProjection(base,fresh().plot,{allowPlot:true}),'wrk:000007').length);
});
test('Every legacy book/story/screen route still resolves to its same entity and preserves language/search state',()=>{
 const {base}=fresh();const aliases=bundle.registry.aliases.filter(a=>a.kind==='legacy-id'&&/^(books|stories|films):/.test(a.alias));assert.equal(aliases.length,355);
 for(const a of aliases){const view=a.alias.split(':')[0],url='https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=nl#'+view+'?item='+encodeURIComponent(a.alias)+'&q=King&filter=all&sort=title';const p=resolveLegacy(base,url);assert.equal(p.target.id,a.target.id);assert.equal(p.state.language,'nl');assert.equal(p.state.q,'King');assert.equal(p.state.sort,'title');assert.ok(base.nodes.some(n=>n.href===p.href));}
 assert.equal(resolveLegacy(base,'#films?item=books%3Athe-talisman'),null);
});
test('Default descriptions, labels, evidence and navigation omit plot nodes and unclassified source prose',()=>{
 const b=structuredClone(bundle);b.works[0].summary.en='SPOILER_SUMMARY';b.characters[0].continuity='SPOILER_CONTINUITY';b.works[0].aliases.push({language:'en',value:'SPOILER_ALIAS',spoiler:{level:'plot',workIds:['wrk:000001']}});b.claims[0].locator='SPOILER_LOCATOR';b.sources[0].notes='SPOILER_SOURCE_NOTE';b.characters.find(n=>n.id==='chr:000005').name='SPOILER_HIDDEN_NAME';b.connections.find(c=>c.spoiler.level==='plot').explanation.en='SPOILER_EDGE';
 const p=createReadyProjection(b,options);assert.ok(!JSON.stringify(p.defaultProjection).includes('SPOILER_'));assert.ok(JSON.stringify(p.plotProjection).includes('SPOILER_HIDDEN_NAME'));assert.ok(JSON.stringify(p.plotProjection).includes('SPOILER_EDGE'));
 assert.equal(combineProjection(p.defaultProjection,p.plotProjection,{allowPlot:'false'}).scope,'default-no-plot');
 for(const text of ['Father Callahan','Ted Brautigan','Patrick Danville','Dinky Earnshaw','Randall Flagg','Lud'])assert.ok(!JSON.stringify(fresh().base).includes(text),text);
 const html=fs.readFileSync(ROOT+'/scripts/readiness-fixture/index.html.template','utf8');assert.ok(!html.includes('SPOILER_'));assert.ok(html.includes('not a public Explorer release')||html.includes('Not a public Explorer release'));
});
test('Broken references, lost sources/verification and projection duplicates fail',()=>{
 for(const mutate of [b=>b.connections[0].to.id='wrk:999999',b=>b.nodes.push(b.nodes[0]),b=>b.connections[0].certainty='interpretive',b=>b.sources[0].url='https://wrong.example/',b=>b.connections[0].evidence[0].sourceIds=['src:999999'],b=>b.nodes[0].evidence[0].independentlyConfirmed=!b.nodes[0].evidence[0].independentlyConfirmed]){const {base,plot}=fresh();mutate(base);assert.ok(validateReady(base,plot,bundle).length);}
 const dup=fresh();dup.plot.connections.push(dup.base.connections[0]);assert.ok(validateReady(dup.base,dup.plot,bundle).length);
 const bad=structuredClone(bundle);bad.connections[0].to.id='wrk:999999';assert.throws(()=>createReadyProjection(bad,options),/Broken/);
});
test('Plot information is a separately fetched delta and fixture resets choice on navigation',()=>{
 const js=fs.readFileSync(ROOT+'/scripts/readiness-fixture/fixture.js','utf8');assert.ok(js.includes("fetch('plot.json')"));assert.ok(js.indexOf("fetch('plot.json')")>js.indexOf("button.addEventListener('click'"));assert.ok(js.includes('revealed=false;plotCache=undefined'));assert.ok(!js.includes('innerHTML'));assert.ok(js.includes("img.addEventListener('error'"));
 const {base,plot}=fresh();assert.ok(!JSON.stringify(base).includes(plot.nodes[0].label));assert.equal(combineProjection(base,plot).connections.length,66);
});
test('Isolated fixture cannot overwrite the repository or an unrelated nonempty directory',()=>{
 const generated=generateReadyFiles(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kingverse-b06-test-'));
 try{assert.throws(()=>writeFixture(ROOT+'/explorer',generated),/outside/);fs.writeFileSync(path.join(tmp,'private-file'),'retain');assert.throws(()=>writeFixture(tmp,generated),/unrelated/);fs.unlinkSync(path.join(tmp,'private-file'));const out=writeFixture(tmp,generated);for(const name of ['index.html','fixture.js','fixture.css','default.json','plot.json','assets/media/fallbacks/book.svg','assets/media/fallbacks/screen.svg'])assert.ok(fs.existsSync(path.join(out,name)),name);}finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('Media inventory covers 152 covers and 82 posters; no third-party asset is silently cleared',()=>{
 assert.equal(media.records.length,234);assert.equal(media.counts.knownCovers,152);assert.equal(media.counts.knownPosters,82);assert.equal(media.counts.locallyPublishableArtwork,0);assert.equal(media.counts.permissionRequired,234);assert.equal(media.counts.projectAuthoredFallbacks,2);assert.equal(media.missingSlots.length,16);assert.deepEqual(validateMedia(media,bundle),[]);
 assert.ok(media.records.every(r=>!r.displayAllowed&&r.localPath===null&&r.rightsHolder===null&&r.technical.remoteRecheckedInBatch06===false));
 for(const [p,v]of generateMedia().files)assert.equal(fs.readFileSync(ROOT+'/'+p,'utf8'),v,p);
});
test('Media gates reject fabricated permission, crossed ownership, missing records and fake local assets',()=>{
 for(const mutate of [m=>m.records[0].displayAllowed=true,m=>m.records[0].localPath='assets/media/covers/unapproved.webp',m=>m.records[0].owner.id=m.records[1].owner.id,m=>m.records.pop(),m=>m.records[0].rights.status='allowed',m=>m.fallbackAssets[0].sha256='0'.repeat(64),m=>m.records[0].rights.evidence=null]){const m=structuredClone(media);mutate(m);assert.ok(validateMedia(m,bundle).length);}
 const m=structuredClone(media.records[0]);m.displayAllowed=true;m.rights.status='allowed';m.rights.evidence=['synthetic test proof'];m.rights.licence='synthetic-test-only';m.rightsHolder='Test fixture';m.technical.status='available';m.technical.evidence='test';m.technical.observedAt='2026-10-26';m.localPath='assets/media/covers/edn-000001/original.webp';m.integrity={sha256:'0'.repeat(64),bytes:10,width:1,height:1,mime:'image/webp'};m.variants=[{path:m.localPath,...m.integrity}];assert.equal(permittedLocal(m),true);const bad=structuredClone(media);bad.records[0]=m;assert.ok(validateMedia(bad,bundle).some(e=>e.code==='media-integrity'||e.code==='media-path'));
 m.technical.status='referrer-dependent-refusal';assert.equal(permittedLocal(m),false);
});
test('Story media uses registered collection editions, never a fictional own cover or an unlabelled NL-to-EN image',()=>{
 const {base}=fresh(),story=selectMedia(base,'wrk:000161');assert.equal(story.collectionId,'col:000008');assert.equal(story.editionId,'edn:000142');assert.equal(story.officialArtwork,false);assert.equal(story.src,'assets/media/fallbacks/book.svg');assert.ok(story.collectionHref.includes('col%3A000008'));
 const noCollection=base.nodes.find(n=>n.type==='work'&&n.data.kind==='short-story'&&!base.memberships.some(m=>m.workId===n.id)&&!base.nodes.some(e=>e.type==='edition'&&e.data.publicationOf.id===n.id));assert.ok(noCollection);assert.equal(selectMedia(base,noCollection.id).kind,'text-only');assert.equal(selectMedia(base,noCollection.id).src,null);
 const copy=structuredClone(base);copy.nodes=copy.nodes.filter(n=>!(n.type==='edition'&&n.data.publicationOf.id==='wrk:000001'&&n.data.language==='en'));const s=selectMedia(copy,'wrk:000001',{language:'en'});assert.equal(s.src,null);assert.equal(s.kind,'edition-reference');
 const nl=selectMedia(base,'wrk:000001',{language:'nl'});assert.equal(nl.language,'nl');const uncertain=structuredClone(base);for(const m of uncertain.memberships.filter(m=>m.workId==='wrk:000161'))m.verification='provisional';assert.equal(selectMedia(uncertain,'wrk:000161').kind,'collection-reference');assert.equal(selectMedia(uncertain,'wrk:000161').src,null);
});
test('Original fallbacks are small responsive SVGs with intact bytes and explicit non-official descriptions',()=>{
 for(const f of media.fallbackAssets){const data=fs.readFileSync(ROOT+'/'+f.localPath);assert.equal(digest(data),f.sha256);assert.equal(data.length,f.bytes);assert.ok(f.bytes<1500);assert.equal(f.width/f.height,2/3);assert.ok(data.toString().includes('NOT OFFICIAL ART'));assert.ok(data.toString().includes('viewBox="0 0 320 480"'));assert.ok(!/https?:\/\//.test(data.toString().replace('http://www.w3.org/2000/svg','')));}
});
