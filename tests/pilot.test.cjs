'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {ROOT}=require('../scripts/validate_foundation.cjs');
const {generatePilot,checkPilotBaseline,LIMIT}=require('../scripts/build_pilot.cjs');
const {validatePilotOutput}=require('../scripts/validate_pilot.cjs');
const C=require('../scripts/pilot/shared.js');const describe=require('../scripts/pilot/descriptions.cjs');
const out=generatePilot(),index=id=>{const dir='data/'+id.replace(':','-'),p=out.payloads.get(dir+'/index.json'),details=out.payloads.get(dir+'/details.json');return details?{...p,sections:{...p.sections,...details.sections}}:p;},plot=id=>out.payloads.get('data/'+id.replace(':','-')+'/plot.json');
test('Pilot is reproducible, all generated files match, and all earlier baseline files are preserved',()=>{
 assert.equal(checkPilotBaseline().baseCommit,'1bf82bb232d9f8e0f4ad8dd08724883ffa9b3c76');assert.deepEqual(validatePilotOutput(out),[]);
 for(const[p,v]of out.files)assert.equal(fs.readFileSync(path.join(ROOT,p),'utf8'),v,p);
 assert.deepEqual(generatePilot().files,out.files);assert.deepEqual(out.base,require('../scripts/completion_pilot.cjs').completionPilot().defaultProjection);
});
test('Every canonical identity, type and endpoint has an independent bounded deep-link payload',()=>{
 assert.equal(out.full.nodes.length,653);for(const n of out.full.nodes){const p=index(n.id);assert.ok(p);if(out.base.nodes.some(s=>s.id===n.id)){assert.equal(p.node.id,n.id);assert.equal(p.node.type,n.type);assert.equal(p.node.label,n.label);}else assert.equal(p.scope,'gated');}
 const types=new Set(out.full.nodes.map(n=>n.type));assert.equal(types.size,8);
 for(const[name,p]of out.payloads)if(!name.startsWith('search.')){assert.ok(Buffer.byteLength(out.files.get('explorer/pilot/'+name))<=LIMIT);for(const e of p.connections||[])assert.ok(index(e.target.id));}
 assert.equal(out.report.payload.initialAggregateProjectBytesLoaded,0);assert.ok(out.report.payload.maxEntityBytes<40000);assert.ok(out.report.payload.searchGzipBytes<13*1024);
});
test('All 207 relationships preserve source claims, certainty, spoiler scope and current verification in both directions',()=>{
 const seen=new Set();for(const n of out.full.nodes){for(const e of [...index(n.id).connections||[],...plot(n.id).connections]){seen.add(e.id);const old=out.full.connections.find(c=>c.id===e.id);assert.deepEqual(e.evidence,old.evidence);assert.equal(e.certainty,old.certainty);assert.deepEqual(e.spoiler,old.spoiler);assert.equal(e.verification,old.verification);assert.equal(e.target.id,e.from.id===n.id?e.to.id:e.from.id);}}
 assert.equal(seen.size,207);assert.equal(plot('wrk:000002').connections.find(e=>e.id==='rel:000007').verification,'provisional');
});
test('The full Talisman chain has direct sibling navigation from canonical series memberships',()=>{
 for(const id of ['wrk:000001','wrk:000002','wrk:000067']){const p=index(id),members=p.series.find(s=>s.series.id==='ser:000002').members;assert.deepEqual(members.map(m=>m.target.id),['wrk:000001','wrk:000002','wrk:000067']);assert.deepEqual(members.map(m=>m.position),[1,2,3]);}
 assert.ok(index('wrk:000001').connections.some(e=>e.target.id==='wrk:000002'));assert.ok(index('wrk:000067').connections.some(e=>e.target.id==='wrk:000002'));
 assert.ok(index('wrk:000067').creators.some(c=>c.role==='illustrator'));assert.equal(index('wrk:000067').creators.filter(c=>['author','coauthor'].includes(c.role)).length,2);
});
test('Editions, multiple collections, remakes and source hypotheses remain separately navigable',()=>{
 assert.equal(index('wrk:000001').sections.editions.total,3);assert.equal(index('edn:000001').parent.id,'wrk:000001');
 const m=index('wrk:000161').sections.memberships.items;assert.equal(m.length,2);assert.equal(new Set(m.map(m=>m.target.id)).size,2);assert.ok(m.every(m=>m.verification==='source-supported'));assert.equal(index('wrk:000161').media.collectionId,'col:000008');
 const fire=index('wrk:000010').connections.filter(e=>e.predicate==='adaptation_of');assert.equal(fire.length,2);assert.equal(new Set(fire.map(e=>e.target.label)).size,2);
 assert.equal(index('adp:000013').sections.candidates.total,0);assert.equal(out.full.candidates.length,54);assert.ok(index('adp:000013').connections.some(e=>e.to.type==='series'));
});
test('Long contribution and collection lists use six-record chunks with no missing or duplicated records',()=>{
 for(const [id,k]of [['per:000001','creators'],['col:000006','memberships']]){const section=index(id).sections[k],rows=[...section.items];let next=section.next;assert.ok(next);while(next){const p=out.payloads.get(next);assert.ok(p.items.length<=6);rows.push(...p.items);next=p.next;}assert.equal(rows.length,section.total);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);}
});
test('Default pages, search aliases, metadata and gated entries contain none of the six plot-only labels',()=>{
 const search=out.payloads.get(out.report.assets.search);assert.equal(search.records.length,647);
 for(const n of out.plot.nodes){for(const name of out.report.files.filter(f=>f.file.endsWith('/index.json')).map(f=>f.file))assert.ok(!JSON.stringify(out.payloads.get(name)).includes(n.label),name);assert.ok(!JSON.stringify(search).includes(n.label));assert.ok(!out.files.get('explorer/pilot/index.html').includes(n.label));assert.ok(!('node'in index(n.id)));}
 assert.ok(plot('chr:000005').node);assert.equal(plot('chr:000005').node.label,'Father Callahan');
});
test('Search supports safe alternative titles, language distinctions and type filters without plot lookups',()=>{
 const records=out.payloads.get(out.report.assets.search).records;
 assert.ok(C.search(records,'Zwart huis').some(r=>r.id==='wrk:000002'));assert.ok(C.search(records,'talisman','edition').every(r=>r.type==='edition'));
 assert.ok(C.search(records,'salems lot','work').some(r=>r.id==='wrk:000004'));assert.ok(C.search(records,'11.22.63','work').length);assert.equal(C.search(records,'Father Callahan').length,0);assert.equal(C.search(records,'Richard Bachman','person')[0].id,'per:000001');
 assert.equal(C.routeId('?entity=wrk%3A000067'),'wrk:000067');assert.equal(C.routeId('?entity=../../app.js'),null);
});
test('Human relation direction, certainty filters and precise dates are preserved without fabricated days',()=>{
 const edges=index('wrk:000001').connections;assert.equal(C.relationLabel(edges.find(e=>e.predicate==='sequel_to')),'Continues in');assert.equal(C.relationLabel(index('wrk:000002').connections.find(e=>e.predicate==='sequel_to')),'Sequel to');
 assert.ok(C.filterConnections(edges,'character').every(e=>e.target.type==='character'));assert.ok(C.filterConnections(edges,'all','explicit').every(e=>e.certainty==='explicit'));
 assert.equal(C.dateLabel({value:'1984-11',precision:'month'}),'November 1984');assert.equal(C.dateLabel({value:'1984',precision:'year'}),'1984');
});
test('Archive sources are reused exactly; local assets and page links stay beneath GitHub Pages subpaths',()=>{
 const archive=require('../scripts/foundation_compat.cjs').readGenerated('media.js','MEDIA');const urls=new Set([...Object.values(archive.books).flatMap(Object.values),...Object.values(archive.films)].filter(m=>m.imageStatus==='verified').map(m=>m.image));for(const p of out.payloads.values())if(p.media?.src){if(p.media.remoteArtwork)assert.ok(urls.has(p.media.src));else assert.ok(fs.existsSync(ROOT+'/'+p.media.src));}
 const html=out.files.get('explorer/pilot/index.html');for(const[,url]of html.matchAll(/(?:href|src)="([^"]+)"/g))assert.ok(new URL(url,'https://example.test/the-kingverse/explorer/pilot/').pathname.startsWith('/the-kingverse/'));
 const js=out.files.get('explorer/pilot/'+out.report.assets.js);assert.ok(!js.includes('data/readiness/'));assert.ok(!js.includes('innerHTML'));assert.ok(js.includes("if(e.persisted)navigate()"));
});
test('Lost evidence, broken next links, spoiler leaks and invalid series peers are rejected',()=>{
 for(const mutate of [o=>o.payloads.get('data/wrk-000001/index.json').connections[0].certainty='interpretive',o=>o.payloads.get('data/wrk-000001/index.json').connections[0].target.id='wrk:000067',o=>o.payloads.get('data/wrk-000001/details.json').sections.creators.next='missing.json',o=>o.payloads.get('data/wrk-000001/index.json').node.label='Father Callahan',o=>o.payloads.get('data/wrk-000001/index.json').series[0].members[0].connectionId='rel:999999']){const copy={...out,payloads:structuredClone(out.payloads)};mutate(copy);assert.ok(validatePilotOutput(copy).length);}
});
test('Destination grouping preserves every edge, certainty and claim before and after filtering',()=>{
 const edges=[...index('wrk:000001').connections,...plot('wrk:000001').connections],before=structuredClone(edges),groups=C.groupConnections(edges);assert.deepEqual(edges,before);assert.equal(new Set(groups.map(g=>g.target.id)).size,groups.length);assert.equal(groups.flatMap(g=>g.edges).length,edges.length);assert.deepEqual(new Set(groups.flatMap(g=>g.edges.map(e=>e.id))),new Set(edges.map(e=>e.id)));assert.ok(groups.length<edges.length);for(const g of C.groupConnections(C.filterConnections(edges,'all','interpretive')))assert.ok(g.edges.every(e=>e.certainty==='interpretive'));
});
test('Safe bibliographic descriptions work for every projected type and do not require or invent a synopsis',()=>{
 for(const n of out.full.nodes){const p=index(n.id);assert.equal(typeof describe(p,n),'string');}const text=describe(index('wrk:000001'),index('wrk:000001').node);assert.match(text,/Stephen King and Peter Straub/);assert.match(text,/Book 1 of The Talisman Trilogy/);assert.ok(!text.includes('has not yet been verified'));
});
test('Bibliographic data and its renderer are on demand; main payload has one copy of every native edge',()=>{
 const p=out.payloads.get('data/wrk-000001/index.json'),d=out.payloads.get('data/wrk-000001/details.json');assert.equal(p.hasDetails,true);assert.ok(!p.sections.editions);assert.equal(d.sections.editions.total,3);assert.ok(!p.sections.publications);const html=out.files.get('explorer/pilot/index.html');assert.ok(!html.includes('src="'+out.report.assets.details+'"'));assert.ok(out.files.has('explorer/pilot/'+out.report.assets.details));assert.ok(out.report.payload.maxEntityBytes<=28700);
});
test('Initial Talisman transfer stays below 1.9 in both raw and gzip estimates; only audited editorial premises are reused',()=>{
 const z=require('node:zlib');let raw=0,gzip=0;for(const p of ['index.html',out.report.assets.js,out.report.assets.css,'data/wrk-000001/index.json']){const s=out.files.get('explorer/pilot/'+p);raw+=Buffer.byteLength(s);gzip+=z.gzipSync(s).length;}assert.ok(raw<=59401,String(raw));assert.ok(gzip<=15541,String(gzip));for(const[id,claim]of [['wrk:000001','clm:000114'],['wrk:000002','clm:000115']]){const n=index(id).node;assert.ok(n.evidence.some(c=>c.id===claim&&c.fieldPath==='/summary'&&c.status==='verified'));assert.ok(!n.description.includes('A novel record'));}
});
test('Primary dark-theme text and control boundaries retain measurable contrast',()=>{
 const css=out.files.get('explorer/pilot/'+out.report.assets.css),rgb=h=>h.match(/\w\w/g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),lum=h=>rgb(h.replace('#','')).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05),color=n=>css.match(new RegExp('--'+n+':(#[0-9a-f]{6})'))[1];for(const fg of ['text','gold','muted'])for(const bg of ['bg','panel'])assert.ok(ratio(color(fg),color(bg))>=4.5);assert.ok(ratio('#6d7968',color('panel'))>=3);assert.match(css,/html:has\(dialog\[open\]\)/);
});

test('Core literary premises use the same verified introductions as the main catalog',()=>{
 for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='work')){const n=index(e.subject.id).node;assert.equal(n.description,e.value.en);assert.ok(n.evidence.some(c=>c.fieldPath==='/summary'&&c.status==='verified'&&c.selected));assert.ok(!n.description.includes('A novel by Stephen King.'));}
});

test('New edition shelves and parent routes identify physical editions without inventing original-publication dates',()=>{
 const e=index('edn:000155');assert.equal(e.parent.id,'wrk:000242');assert.equal(e.node.data.isbn13,'9781982159375');assert.equal(e.node.data.publicationDate.value,'2020-06-02');assert.equal(e.node.data.publicationDate.meaning,'edition-publication');assert.ok(index('wrk:000242').sections.editions.items.some(r=>r.id==='edn:000155'));
 assert.ok(!index('wrk:000242').publicationDates.some(d=>d.value==='2020-06-02'));assert.equal(index('edn:000159').node.data.format,'Hardcover');
});

test('Public connection explanations preserve the same safe, readable copy in both navigation directions',()=>{
 for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='connection')){const c=out.full.connections.find(c=>c.id===e.subject.id);for(const id of [c.from.id,c.to.id])assert.equal(index(id).connections.find(r=>r.id===c.id).explanation,e.value.en);}
 assert.equal(index('adp:000039').connections.find(e=>e.id==='rel:000018').certainty,'strongly-implied');
});

test('Gwendy’s complete trilogy reuses the two prior work IDs and exposes the middle novel’s proper credits',()=>{
 const row=index('wrk:000250');assert.deepEqual(row.series.find(s=>s.series.id==='ser:000005').members.map(m=>[m.target.id,m.position]),[['wrk:000057',1],['wrk:000250',2],['wrk:000063',3]]);
 assert.deepEqual(row.creators.filter(c=>c.role==='author').map(c=>c.person.id),['per:000004']);assert.equal(row.sections.creators.items.find(c=>c.target.id==='per:000001').role,'foreword');assert.equal(index('edn:000160').parent.id,'wrk:000250');
});

test('Collection introductions are shared with the main catalog and retain field-level proof',()=>{
 for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='collection')){const row=index(e.subject.id);assert.equal(row.node.description,e.value.en);assert.ok(row.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.equal(row.sections.memberships.total,out.base.memberships.filter(m=>m.collectionId===e.subject.id).length);}
});

test('All 96 main-library introductions agree with their canonical Explorer pages',()=>{
 const db=require('../scripts/build_main_completion.cjs').generateMainCompletion().db;assert.equal(db.books.length,96);for(const b of db.books)assert.equal(index(b.canonicalId).node.description,b.summary.en,b['Engelse titel']);
});

test('New character and town profiles open directly with useful descriptions while Holly’s later appearance stays gated',()=>{
 for(const id of ['chr:000012','loc:000004','loc:000005']){const n=index(id).node;assert.ok(n.description.length>80);assert.ok(n.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(out.payloads.get(out.report.assets.search).records.some(r=>r.id===id));for(const c of index(id).connections)assert.ok(index(c.target.id));}
 assert.equal(index('chr:000012').connections.length,6);assert.equal(plot('chr:000012').connections.length,1);assert.equal(plot('chr:000012').connections[0].target.id,'wrk:000058');assert.ok(!index('wrk:000058').connections.some(c=>c.target.id==='chr:000012'));
 assert.equal(index('loc:000004').connections.length,3);assert.equal(index('loc:000005').connections.length,8);assert.ok(index('wrk:000195').connections.some(c=>c.predicate==='sequel_to'&&c.target.id==='wrk:000012'));
});

test('Night Shift publisher-only description evidence ships with its source and no internal source notes',()=>{
 for(const id of ['wrk:000073','wrk:000074','wrk:000078','wrk:000084','wrk:000085']){const p=index(id),c=p.node.evidence.find(c=>c.fieldPath==='/summary'&&c.selected);assert.ok(c);assert.ok(c.sourceIds.every(id=>p.sources.some(s=>s.id===id&&new URL(s.url).hostname==='www.penguinrandomhouse.com')));assert.ok(p.sources.every(s=>!('notes'in s)&&!('snapshotRef'in s)));}
});

test('Three new Corn film pages share a navigable franchise shelf without invented story adaptation or sequence',()=>{
 const members=index('adp:000107').series.find(s=>s.series.id==='ser:000004').members;assert.equal(members.length,9);assert.equal(new Set(members.map(m=>m.target.id)).size,9);
 for(const id of ['adp:000107','adp:000108','adp:000109']){const p=index(id);assert.ok(p.node.description.length>80);assert.ok(out.payloads.get(out.report.assets.search).records.some(r=>r.id===id));assert.ok(p.connections.every(c=>c.predicate==='part_of_series'));assert.ok(p.series[0].members.every(m=>m.position===null));assert.equal(p.media?.remoteArtwork||false,false);}
});

test('Standalone editions are independently navigable while keeping original collection membership and dates',()=>{
 for(const [id,work,date]of [['edn:000165','wrk:000094','2026-08-25'],['edn:000166','wrk:000093','2018-12-04'],['edn:000167','wrk:000121','2026-10-06'],['edn:000168','wrk:000183','2025-06-10'],['edn:000169','wrk:000118','2019-11-12']]){const p=index(id);assert.equal(p.parent.id,work);assert.equal(p.node.data.publicationDate.value,date);assert.equal(p.node.data.publicationDate.meaning,'edition-publication');assert.ok(index(work).sections.editions.items.some(e=>e.id===id));assert.ok(index(work).sections.memberships.total>=1);assert.ok(!index(work).publicationDates.some(d=>d.value===date));}
});

test('Sometimes screen pages expose a three-production shelf with correct direct navigation and source evidence',()=>{
 for(const id of ['adp:000071','adp:000110','adp:000111']){const p=index(id),s=p.series.find(s=>s.series.id==='ser:000006');assert.deepEqual(s.members.map(m=>m.target.id),['adp:000071','adp:000110','adp:000111']);assert.ok(s.members.every(m=>m.position===null&&index(m.target.id)));}
 assert.equal(index('ser:000006').connections.length,3);for(const id of ['adp:000110','adp:000111']){const p=index(id);assert.ok(p.node.description.length>80);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.connections.every(c=>c.predicate==='part_of_series'));}
});

test('Shining and Misery profiles have sourced introductions, direct book links and no accidental screen continuity',()=>{
 for(const id of ['chr:000013','chr:000014','chr:000015','chr:000016','chr:000017','chr:000018','loc:000006']){const p=index(id);assert.ok(p.node.description.length>80);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.connections.every(c=>c.target.type==='work'&&index(c.target.id)));assert.ok(out.payloads.get(out.report.assets.search).records.some(r=>r.id===id));}
 assert.deepEqual(index('chr:000013').connections.map(c=>c.target.id),['wrk:000005','wrk:000051']);assert.deepEqual(index('loc:000006').connections.map(c=>c.target.id),['wrk:000005','wrk:000217']);
});

test('Reviewed film reading introductions share main-site copy and retain film-specific source proof',()=>{
 for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='adaptation')){const p=index(e.subject.id);assert.equal(p.node.description,e.value.en);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.doesNotMatch(p.node.description,/A film in The Kingverse|production uncertainties/);for(const c of p.node.evidence.filter(c=>c.fieldPath==='/summary'&&c.selected))assert.ok(c.sourceIds.every(id=>p.sources.some(s=>s.id===id)));}
 assert.doesNotMatch(index('adp:000070').node.description,/Stanley Kubrick/);assert.match(index('adp:000048').node.description,/Oregon/);assert.doesNotMatch(index('adp:000048').node.description,/Maine/);
});

test('Everything’s Eventual story descriptions remain distinct from the collection and preserve Tower spoiler gating',()=>{
 for(let i=150;i<=163;i++){const p=index('wrk:'+String(i).padStart(6,'0'));assert.ok(p.node.description.length>60);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000008'));}
 assert.doesNotMatch(index('wrk:000156').node.description,/Dinky Earnshaw/);assert.notEqual(index('wrk:000156').node.description,index('col:000008').node.description);assert.ok(index('wrk:000155').connections.some(c=>c.target.id==='chr:000003'));
});

test('Bazaar introductions retain source proof, collection links, poem classification and opening-only spoilers',()=>{
 for(const n of [198,199,200,201,202,203,204,205,206,207,208,211,212,214,215]){const p=index('wrk:'+String(n).padStart(6,'0'));assert.ok(p.node.description.length>80);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'&&c.observedAt==='2026-10-29'));assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000012'));}
 assert.equal(index('wrk:000204').node.data.kind,'poem');assert.doesNotMatch(index('wrk:000200').node.description,/weapon|assault|saves/);assert.doesNotMatch(index('wrk:000198').node.description,/only living|eats|devours/);
});

test('Hearts character pages link both ways to the correct stories while keeping Tower identities hidden by default',()=>{
 for(const id of ['chr:000019','chr:000020','chr:000021']){const p=index(id);assert.ok(p.node.description.length>80);assert.equal(p.connections.length,2);assert.ok(p.connections.every(c=>index(c.target.id).connections.some(e=>e.id===c.id&&e.target.id===id)));}
 for(let i=145;i<=149;i++){const p=index('wrk:'+String(i).padStart(6,'0'));assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000007'));assert.doesNotMatch(p.node.description,/Ted Brautigan|Dark Tower|Breaker/);}
});

test('Recent story introductions keep collection membership, selected evidence and spoiler-safe Cujo links',()=>{
 for(const n of [186,187,188,189,190,191,192,193,194,195,196,197]){const p=index('wrk:'+String(n).padStart(6,'0'));assert.ok(p.node.description.length>80);assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000001'));assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));}
 const r=index('wrk:000195');assert.ok(r.connections.some(c=>c.predicate==='sequel_to'&&c.target.id==='wrk:000012'));assert.doesNotMatch(r.node.description,/Vic|Tad|Donna/);
});

test('Just After Sunset descriptions retain collection covers and original-publication evidence without quoted story text',()=>{
 for(const n of [164,165,166,167,168,169,170,171,175,176]){const p=index('wrk:'+String(n).padStart(6,'0'));assert.ok(p.node.description.length>80);assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000009'));assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));}
 const p=index('wrk:000166'),c=p.node.evidence.find(c=>c.fieldPath==='/summary'&&c.selected);assert.ok(c.sourceIds.every(id=>p.sources.some(s=>s.id===id&&new URL(s.url).hostname==='www.newyorker.com')));assert.doesNotMatch(p.node.description,/Big Dog|commodore|Volvo|daughter|killed/);assert.doesNotMatch(index('wrk:000171').node.description,/suicide|kills|stone circle/i);
});

test('Skeleton Crew additions preserve story memberships and separate modern edition dates from the original collection',()=>{
 for(const n of [96,97,98,99,100,101,102,105,115]){const p=index('wrk:'+String(n).padStart(6,'0'));assert.ok(p.node.description.length>80);assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000004'));}
 for(const[id,isbn,date]of [['edn:000170','9781501143502','2016-12-06'],['edn:000171','9781668207741','2025-02-25']]){const p=index(id);assert.equal(p.parent.id,'col:000004');assert.equal(p.node.data.isbn13,isbn);assert.equal(p.node.data.publicationDate.value,date);assert.equal(p.node.data.publicationDate.meaning,'edition-publication');assert.ok(!index('col:000004').publicationDates.some(d=>d.value===date));}assert.doesNotMatch(index('wrk:000096').node.description,/suicide|kills his son|shoots|ending/);
});

test('Remake-specific summaries preserve cast, uncertain source links and default spoiler boundaries',()=>{
 for(const[id,cast]of [['adp:000004','Sissy Spacek'],['adp:000057','Angela Bettis'],['adp:000083','Chloë Grace Moretz'],['adp:000068','David Soul'],['adp:000069','Rob Lowe'],['adp:000072','Ruby Dee'],['adp:000073','Whoopi Goldberg']])assert.ok(index(id).node.description.includes(cast));
 for(const id of ['adp:000072','adp:000073'])assert.doesNotMatch(index(id).node.description,/Randall Flagg/);assert.doesNotMatch(index('adp:000038').node.description,/Ludlow|Gage.*dies|Ellie.*dies/);assert.doesNotMatch(index('adp:000039').node.description,/Ludlow|Gage.*dies|Ellie.*dies/);
});

test('Further film premises use production-specific sources and keep novel and film endings out of the introductions',()=>{
 const r=index('adp:000041'),c=r.node.evidence.find(c=>c.fieldPath==='/summary'&&c.selected);assert.ok(c.sourceIds.every(id=>r.sources.some(s=>s.id===id&&s.url==='https://www.paramount.com/movies/the-running-man')));assert.doesNotMatch(r.node.description,/daughter|billion|2025/);assert.match(r.node.description,/2019/);
 for(const id of ['adp:000011','adp:000021','adp:000024','adp:000033','adp:000044'])assert.doesNotMatch(index(id).node.description,/ending|suicide|Ted Brautigan|shoots his son|cut off her hand/);const tv=index('adp:000078');assert.match(tv.node.description,/six-year coma/);assert.doesNotMatch(index('adp:000014').node.description,/six-year/);
});

test('Five English reissue pages navigate to the existing works and keep edition dates separate',()=>{
 for(const[id,work,isbn]of [['edn:000172','wrk:000001','9781451694918'],['edn:000173','wrk:000002','9781501192296'],['edn:000174','wrk:000003','9781984898104'],['edn:000175','wrk:000005','9780345806789'],['edn:000176','wrk:000007','9780307947307']]){const e=index(id),w=index(work);assert.equal(e.parent.id,work);assert.equal(e.node.data.isbn13,isbn);assert.equal(e.node.data.publicationDate.meaning,'edition-publication');assert.ok(w.sections.editions.items.some(n=>n.id===id));assert.ok(!w.publicationDates.some(d=>d.value===e.node.data.publicationDate.value));}
});

test('Three further Scribner edition routes retain the correct work, ISBN and date precision',()=>{
 for(const[id,work,isbn,date]of [['edn:000177','wrk:000009','9781668094754','2025-08-05'],['edn:000178','wrk:000010','9781501192319','2018-12-11'],['edn:000179','wrk:000015','9781668075784','2024-09-03']]){const e=index(id);assert.equal(e.parent.id,work);assert.equal(e.node.data.isbn13,isbn);assert.equal(e.node.data.publicationDate.value,date);assert.equal(e.node.data.publicationDate.precision,'day');assert.equal(e.node.data.publicationDate.meaning,'edition-publication');assert.ok(index(work).sections.editions.items.some(n=>n.id===id));}
});

test('Three collection edition pages preserve collection parents and existing story memberships',()=>{
 for(const[id,parent,isbn,date]of [['edn:000180','col:000003','9781501143489','2016-03-29'],['edn:000181','col:000005','9781501143496','2016-08-02'],['edn:000182','col:000006','9781501192036','2017-10-31']]){const e=index(id),c=index(parent);assert.equal(e.parent.id,parent);assert.equal(e.node.data.isbn13,isbn);assert.equal(e.node.data.publicationDate.value,date);assert.equal(e.node.data.publicationDate.meaning,'edition-publication');assert.ok(c.sections.editions.items.some(r=>r.id===id));assert.ok(c.sections.memberships.total>=4);assert.ok(!c.publicationDates.some(d=>d.value===date));}
});

test('Six further collection editions keep the exact language format date and collection identity',()=>{
 for(const[id,parent,isbn,format]of [['edn:000183','col:000002','9780307947291','Paperback'],['edn:000184','col:000008','9781501197963','Trade Paperback'],['edn:000185','col:000009','9781501197659','Trade Paperback'],['edn:000186','col:000012','9781501197956','Trade Paperback'],['edn:000187','col:000013','9781982137977','Hardcover'],['edn:000188','col:000001','9781668037713','Hardcover']]){const e=index(id);assert.equal(e.parent.id,parent);assert.equal(e.node.data.isbn13,isbn);assert.equal(e.node.data.language,'en');assert.equal(e.node.data.format,format);assert.equal(e.node.data.publicationDate.meaning,'edition-publication');assert.ok(index(parent).sections.editions.items.some(r=>r.id===id));}assert.equal(index('col:000001').sections.memberships.total,12);
});

test('Three more Bazaar introductions preserve poem identity and paperback-only publication context',()=>{
 for(const id of ['wrk:000181','wrk:000210','wrk:000213']){const p=index(id);assert.ok(p.node.description.length>80);assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000012'));assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));}assert.equal(index('wrk:000210').node.data.kind,'poem');assert.match(index('wrk:000181').node.description,/absent from the original/);assert.doesNotMatch(index('wrk:000213').node.description,/Katie|wife|suicide/);
});

test('Eight further adaptations keep exact novels, short stories and anthology segment scope',()=>{
 for(const[a,w]of [[34,98],[50,161],[10,104],[68,4],[69,4],[74,23],[59,32],[60,60]]){const id='adp:'+String(a).padStart(6,'0'),wid='wrk:'+String(w).padStart(6,'0'),e=index(id).connections.find(e=>e.predicate==='adaptation_of'&&e.to.id===wid);assert.ok(e);assert.ok(index(wid).connections.some(r=>r.id===e.id&&r.target.id===id));assert.equal(e.spoiler.level,'none');assert.equal(e.certainty,'explicit');}const raft=index('adp:000010').connections.find(e=>e.to.id==='wrk:000104');assert.match(raft.explanation,/segment/);assert.ok(!index('adp:000010').connections.some(e=>e.to.type==='collection'));
});

test('All Night Shift stories have individual introductions without exposing the hidden resolutions',()=>{
 for(const n of [76,77,80,81,82,83,86,88,89,90,91]){const p=index('wrk:'+String(n).padStart(6,'0'));assert.ok(p.node.description.length>80);assert.ok(p.sections.memberships.items.some(m=>m.target.id==='col:000002'));assert.ok(p.node.evidence.some(c=>c.fieldPath==='/summary'&&c.selected&&c.status==='verified'));assert.ok(p.sources.some(s=>new URL(s.url).hostname==='en.wikipedia.org'));}for(const[n,re]of [[77,/disguise|Harper is/],[82,/narrator is|himself.*killer/],[88,/suicide|call girl/],[89,/hammer|serial killer/],[91,/painkillers|euthanize/]])assert.doesNotMatch(index('wrk:'+String(n).padStart(6,'0')).node.description,re);
});
