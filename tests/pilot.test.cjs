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
 assert.equal(out.full.nodes.length,592);for(const n of out.full.nodes){const p=index(n.id);assert.ok(p);if(out.base.nodes.some(s=>s.id===n.id)){assert.equal(p.node.id,n.id);assert.equal(p.node.type,n.type);assert.equal(p.node.label,n.label);}else assert.equal(p.scope,'gated');}
 const types=new Set(out.full.nodes.map(n=>n.type));assert.equal(types.size,8);
 for(const[name,p]of out.payloads)if(!name.startsWith('search.')){assert.ok(Buffer.byteLength(out.files.get('explorer/pilot/'+name))<=LIMIT);for(const e of p.connections||[])assert.ok(index(e.target.id));}
 assert.equal(out.report.payload.initialAggregateProjectBytesLoaded,0);assert.ok(out.report.payload.maxEntityBytes<40000);assert.ok(out.report.payload.searchGzipBytes<12000);
});
test('All 114 relationships preserve source claims, certainty, spoiler scope and current verification in both directions',()=>{
 const seen=new Set();for(const n of out.full.nodes){for(const e of [...index(n.id).connections||[],...plot(n.id).connections]){seen.add(e.id);const old=out.full.connections.find(c=>c.id===e.id);assert.deepEqual(e.evidence,old.evidence);assert.equal(e.certainty,old.certainty);assert.deepEqual(e.spoiler,old.spoiler);assert.equal(e.verification,old.verification);assert.equal(e.target.id,e.from.id===n.id?e.to.id:e.from.id);}}
 assert.equal(seen.size,114);assert.equal(plot('wrk:000002').connections.find(e=>e.id==='rel:000007').verification,'provisional');
});
test('The full Talisman chain has direct sibling navigation from canonical series memberships',()=>{
 for(const id of ['wrk:000001','wrk:000002','wrk:000067']){const p=index(id),members=p.series.find(s=>s.series.id==='ser:000002').members;assert.deepEqual(members.map(m=>m.target.id),['wrk:000001','wrk:000002','wrk:000067']);assert.deepEqual(members.map(m=>m.position),[1,2,3]);}
 assert.ok(index('wrk:000001').connections.some(e=>e.target.id==='wrk:000002'));assert.ok(index('wrk:000067').connections.some(e=>e.target.id==='wrk:000002'));
 assert.ok(index('wrk:000067').creators.some(c=>c.role==='illustrator'));assert.equal(index('wrk:000067').creators.filter(c=>['author','coauthor'].includes(c.role)).length,2);
});
test('Editions, multiple collections, remakes and source hypotheses remain separately navigable',()=>{
 assert.equal(index('wrk:000001').sections.editions.total,2);assert.equal(index('edn:000001').parent.id,'wrk:000001');
 const m=index('wrk:000161').sections.memberships.items;assert.equal(m.length,2);assert.equal(new Set(m.map(m=>m.target.id)).size,2);assert.ok(m.every(m=>m.verification==='source-supported'));assert.equal(index('wrk:000161').media.collectionId,'col:000008');
 const fire=index('wrk:000010').connections.filter(e=>e.predicate==='adaptation_of');assert.equal(fire.length,2);assert.equal(new Set(fire.map(e=>e.target.label)).size,2);
 assert.equal(index('adp:000013').sections.candidates.total,0);assert.equal(out.full.candidates.length,54);assert.ok(index('adp:000013').connections.some(e=>e.to.type==='series'));
});
test('Long contribution and collection lists use six-record chunks with no missing or duplicated records',()=>{
 for(const [id,k]of [['per:000001','creators'],['col:000006','memberships']]){const section=index(id).sections[k],rows=[...section.items];let next=section.next;assert.ok(next);while(next){const p=out.payloads.get(next);assert.ok(p.items.length<=6);rows.push(...p.items);next=p.next;}assert.equal(rows.length,section.total);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);}
});
test('Default pages, search aliases, metadata and gated entries contain none of the six plot-only labels',()=>{
 const search=out.payloads.get(out.report.assets.search);assert.equal(search.records.length,586);
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
 const p=out.payloads.get('data/wrk-000001/index.json'),d=out.payloads.get('data/wrk-000001/details.json');assert.equal(p.hasDetails,true);assert.ok(!p.sections.editions);assert.equal(d.sections.editions.total,2);assert.ok(!p.sections.publications);const html=out.files.get('explorer/pilot/index.html');assert.ok(!html.includes('src="'+out.report.assets.details+'"'));assert.ok(out.files.has('explorer/pilot/'+out.report.assets.details));assert.ok(out.report.payload.maxEntityBytes<=28700);
});
test('Initial Talisman transfer stays below 1.9 in both raw and gzip estimates; only audited editorial premises are reused',()=>{
 const z=require('node:zlib');let raw=0,gzip=0;for(const p of ['index.html',out.report.assets.js,out.report.assets.css,'data/wrk-000001/index.json']){const s=out.files.get('explorer/pilot/'+p);raw+=Buffer.byteLength(s);gzip+=z.gzipSync(s).length;}assert.ok(raw<=59401,String(raw));assert.ok(gzip<=15541,String(gzip));for(const[id,claim]of [['wrk:000001','clm:000114'],['wrk:000002','clm:000115']]){const n=index(id).node;assert.ok(n.evidence.some(c=>c.id===claim&&c.fieldPath==='/summary'&&c.status==='verified'));assert.ok(!n.description.includes('A novel record'));}
});
test('Primary dark-theme text and control boundaries retain measurable contrast',()=>{
 const css=out.files.get('explorer/pilot/'+out.report.assets.css),rgb=h=>h.match(/\w\w/g).map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4),lum=h=>rgb(h.replace('#','')).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05),color=n=>css.match(new RegExp('--'+n+':(#[0-9a-f]{6})'))[1];for(const fg of ['text','gold','muted'])for(const bg of ['bg','panel'])assert.ok(ratio(color(fg),color(bg))>=4.5);assert.ok(ratio('#6d7968',color('panel'))>=3);assert.match(css,/html:has\(dialog\[open\]\)/);
});
