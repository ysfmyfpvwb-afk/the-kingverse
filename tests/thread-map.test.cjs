'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {generatePilot}=require('../scripts/build_pilot.cjs'),M=require('../scripts/thread/core.js'),cytoscape=require('../assets/vendor/cytoscape-3.34.4/cytoscape.min.js');
const out=generatePilot(),file=[...out.files.keys()].find(p=>/thread\/map\..*\.json$/.test(p)),graph=JSON.parse(out.files.get(file)),ids=['loc:000007','wrk:000092'];
test('Expanded map preserves safe canonical edges, the literary Shawshank route and edition-specific artwork',()=>{
 for(const id of ids)assert.ok(graph.nodes.some(n=>n.id===id));assert.equal(graph.edges.filter(e=>e.kind==='connection').length,out.base.connections.filter(e=>graph.nodes.some(n=>n.id===e.from.id)&&graph.nodes.some(n=>n.id===e.to.id)).length);assert.equal(graph.edges.filter(e=>ids.includes(e.from)&&ids.includes(e.to)).length,1);for(const n of graph.nodes)assert.ok(out.base.nodes.some(original=>original.id===n.id));assert.ok(graph.starts.includes('loc:000005'));assert.ok(graph.starts.includes('ser:000001'));
 for(const e of graph.edges.filter(e=>e.kind==='connection')){const original=out.base.connections.find(c=>c.id===e.id);assert.ok(original);assert.equal(e.from,original.from.id);assert.equal(e.to,original.to.id);assert.equal(e.explanation,original.explanation);assert.deepEqual(e.evidence,original.evidence);assert.equal(e.certainty,original.certainty);assert.deepEqual(e.spoiler,original.spoiler);for(const claim of e.evidence)for(const source of claim.sourceIds)assert.ok(graph.sources.some(s=>s.id===source));}
 const novella=graph.nodes.find(n=>n.id===ids[1]);assert.equal(novella.media.collectionId,'col:000003');assert.ok(novella.media.editionId);assert.ok(!graph.nodes.some(n=>n.type==='adaptation'));
});
test('Literary routes remain bidirectional without film or TV discovery stops',()=>{
 assert.deepEqual(M.path(graph,ids[0],ids[1]),ids);assert.deepEqual(M.path(graph,ids[1],ids[0]),[...ids].reverse());assert.deepEqual(M.neighbors(graph,ids[0]).map(r=>r.node.id),[ids[1]]);assert.deepEqual(M.path(graph,ids[0],'adp:000045'),[]);
 const cy=cytoscape({headless:true,elements:[...graph.nodes.map(n=>({data:{id:n.id}})),...graph.edges.map(e=>({data:{id:e.id,source:e.from,target:e.to}}))]});const route=cy.elements().aStar({root:cy.getElementById(ids[0]),goal:cy.getElementById(ids[1])});assert.ok(route.found);assert.deepEqual(route.path.nodes().map(n=>n.id()),ids);cy.destroy();
});
test('Map assets and detail links remain inside GitHub Pages subpaths; the library is bundled locally',()=>{
 const html=out.files.get('explorer/pilot/thread/index.html'),root=path.resolve(__dirname,'..');for(const [,url]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(url.startsWith('https:')||url.startsWith('#'))continue;const u=new URL(url,'https://example.test/the-kingverse/explorer/pilot/thread/');assert.ok(u.pathname.startsWith('/the-kingverse/'));let p=u.pathname.replace('/the-kingverse/','');if(p.endsWith('/'))p+='index.html';assert.ok(out.files.has(p)||fs.existsSync(path.join(root,p)),p);}assert.ok(html.includes('cytoscape-3.34.4/cytoscape.min.js'));assert.ok(fs.existsSync(path.join(root,'assets/vendor/cytoscape-3.34.4/LICENSE')));
});

test('Busy places reveal at most four new neighbors at a time and two-step suggestions do not duplicate direct connections',()=>{
 const id='loc:000005',adjacent=M.neighbors(graph,id);assert.ok(adjacent.length>4);let visible=M.reveal(graph,id,new Set([id]));assert.equal(visible.size,5);visible=M.reveal(graph,id,visible);assert.equal(visible.size,9);const direct=new Set([id,...adjacent.map(r=>r.node.id)]),indirect=M.twoHop(graph,id);assert.ok(indirect.length);assert.equal(new Set(indirect.map(r=>r.n.id)).size,indirect.length);for(const r of indirect){assert.ok(!direct.has(r.n.id));assert.equal(r.path.length,3);for(let i=1;i<r.path.length;i++)assert.ok(M.neighbors(graph,r.path[i-1]).some(n=>n.node.id===r.path[i]));}assert.equal(M.edgeLabel({predicate:'appears_in'}),'Character appearance');assert.equal(M.edgeLabel({predicate:'part_of_series'}),'Series connection');
});

test('Series membership lists all eight Tower novels separately from its film and related works, without numbering the companion novel',()=>{
 assert.equal(M.seriesMembers(graph,'ser:000004').length,0);const members=M.seriesMembers(graph,'ser:000001');assert.equal(members.length,8);assert.deepEqual(members.slice(0,7).map(r=>r.position),[1,2,3,4,5,6,7]);assert.equal(members.at(-1).node.id,'wrk:000049');assert.equal(members.at(-1).position,undefined);assert.ok(!members.some(r=>r.node.id==='wrk:000067'||r.node.id==='adp:000013'));for(const m of members){const original=out.base.connections.find(e=>e.id===m.edge.id);assert.equal(m.position,original.seriesPosition);}
});

test('Connected series exposes the Talisman–Tower bridge both ways with its actual intermediary and evidence',()=>{
 for(const[from,to]of [['ser:000001','ser:000002'],['ser:000002','ser:000001']]){const bridge=M.seriesConnections(graph,from).find(r=>r.n.id===to);assert.ok(bridge);assert.deepEqual(bridge.path,[from,'wrk:000067',to]);assert.equal(bridge.edges.length,2);for(const edge of bridge.edges){assert.ok(graph.edges.some(e=>e.id===edge.id));assert.ok(edge.evidence.length);}}
 assert.deepEqual(M.seriesConnections(graph,'chr:000003'),[]);assert.ok(graph.starts.includes('ser:000002'));
});

test('Shining and Doctor Sleep have a sourced literary sequel link, independent of the 1997 screen continuity',()=>{
 const next=M.storySequence(graph,'wrk:000005').find(r=>r.node.id==='wrk:000051');assert.ok(next);assert.equal(next.label,'Continues in');assert.equal(M.storySequence(graph,'wrk:000051').find(r=>r.node.id==='wrk:000005').label,'Sequel to');assert.ok(next.sequenceEdge.evidence.length);assert.deepEqual(M.path(graph,'wrk:000005','wrk:000051'),['wrk:000005','wrk:000051']);assert.ok(!graph.edges.some(e=>e.predicate==='sequel_to'&&e.from==='adp:000015'&&e.to==='adp:000070'));
});

test('Screen productions remain on detail pages but never enter map search, edges or spoiler overlays',()=>{
 for(const layer of [graph]){assert.ok(!layer.nodes.some(n=>n.type==='adaptation'));assert.ok(!layer.edges.some(e=>e.from.startsWith('adp:')||e.to.startsWith('adp:')));}
 assert.ok(!M.search(graph.nodes,'Shawshank').some(n=>n.type==='adaptation'));
 for(const n of out.base.nodes.filter(n=>n.type==='adaptation')){const entry=JSON.parse(out.files.get('explorer/pilot/data/'+n.id.replace(':','-')+'/index.json'));assert.equal(entry.node.id,n.id);assert.equal(entry.hasConnectionMap,false);}
 assert.ok(out.base.connections.some(e=>e.predicate==='sequel_to'&&e.from.id==='adp:000015'&&e.to.id==='adp:000046'));
});

test('Generic map covers story entities and their relationships without turning editions or translations into discovery stops',()=>{
 assert.deepEqual(new Set(graph.nodes.map(n=>n.id)),new Set(out.base.nodes.filter(n=>!['edition','adaptation','person'].includes(n.type)&&!(n.type==='series'&&n.data.seriesKind!=='literary-series')).map(n=>n.id)));assert.equal(graph.edges.filter(e=>e.kind==='credit'||e.predicate==='creator_credit').length,0);assert.equal(graph.edges.filter(e=>e.kind==='membership').length,out.base.memberships.length);assert.equal(graph.edges.filter(e=>e.kind==='edition'||e.predicate==='edition_of').length,0);assert.ok(!graph.nodes.some(n=>n.type==='edition'));assert.ok(!M.search(graph.nodes,'Shining').some(n=>n.type==='edition'));for(const n of out.base.nodes.filter(n=>n.type==='edition')){const entry=JSON.parse(out.files.get('explorer/pilot/data/'+n.id.replace(':','-')+'/index.json'));assert.equal(entry.hasConnectionMap,false);}
 for(const edge of graph.edges){assert.ok(graph.nodes.some(n=>n.id===edge.from));assert.ok(graph.nodes.some(n=>n.id===edge.to));assert.ok(edge.evidence.length,edge.id);for(const c of edge.evidence)for(const id of c.sourceIds)assert.ok(graph.sources.some(s=>s.id===id),id);}
 assert.ok(!graph.nodes.some(n=>n.type==='person'));assert.ok(!M.search(graph.nodes,'Stephen King').some(n=>n.type==='person'));
 for(const n of out.base.nodes.filter(n=>n.type==='person')){const entry=JSON.parse(out.files.get('explorer/pilot/data/'+n.id.replace(':','-')+'/index.json'));assert.equal(entry.hasConnectionMap,false);}
 const king=out.base.nodes.find(n=>n.type==='person'&&n.label==='Stephen King');assert.ok(king);assert.ok(out.base.credits.some(c=>c.personId===king.id&&c.subject.id==='wrk:000002'));
 const uncertain=out.base.connections.find(e=>e.certainty==='strongly-implied');assert.ok(uncertain);assert.equal(M.confidence([uncertain]),'Strongly implied');
 const isolated=graph.nodes.find(n=>!graph.edges.some(e=>e.from===n.id||e.to===n.id));assert.ok(isolated);assert.deepEqual(M.neighbors(graph,isolated.id),[]);assert.ok(M.search(graph.nodes,isolated.label).some(n=>n.id===isolated.id));assert.ok(M.search(graph.nodes,'Zwart huis').some(n=>n.id==='wrk:000002'));
});
test('Every formerly gated character and relationship is visible immediately, including search and direct detail pages',()=>{
 const prior=require('../scripts/completion_pilot.cjs').completionPilot().plotProjection;
 for(const n of prior.nodes){assert.ok(graph.nodes.some(r=>r.id===n.id));assert.ok(M.search(graph.nodes,n.label).some(r=>r.id===n.id));const page=JSON.parse(out.files.get('explorer/pilot/data/'+n.id.replace(':','-')+'/index.json'));assert.equal(page.node.id,n.id);assert.equal(page.scope,'default');}
 assert.ok(!out.files.get('explorer/pilot/thread/index.html').includes('Spoiler'));assert.ok(!('plotFile' in graph));
});

test('Every sourced literary connection is reachable both ways; the new official mentions keep their plot scope and source claims',()=>{
 const full=graph;
 assert.ok(!full.nodes.some(n=>n.id==='ser:000004'||n.id==='ser:000006'));
 const ids=new Set(full.nodes.map(n=>n.id));
 for(const e of [...out.base.connections,...out.plot.connections].filter(e=>ids.has(e.from.id)&&ids.has(e.to.id))){const edge=full.edges.find(r=>r.id===e.id);assert.ok(edge,e.id);assert.equal(edge.explanation,e.explanation);assert.deepEqual(edge.evidence,e.evidence);assert.ok(M.neighbors(full,e.from.id).some(r=>r.node.id===e.to.id));assert.ok(M.neighbors(full,e.to.id).some(r=>r.node.id===e.from.id));}
 const review=require('../data/completion-b/review.json'),register=require('../data/completion-b/register.json').allocations,rows=review.records.filter(r=>r.key.startsWith('story-thread-'));assert.equal(rows.length,33);
 for(const r of rows){const id=register['connection/'+r.key],layer=graph,edge=layer.edges.find(e=>e.id===id);assert.ok(edge,id);assert.equal(edge.predicate,r.predicate);assert.ok(edge.evidence.some(c=>c.fieldPath==='/explanation'&&c.observedAt==='2026-11-10'));assert.ok(edge.evidence.flatMap(c=>c.sourceIds).some(id=>layer.sources.find(s=>s.id===id)?.url==='https://stephenking.com/darktower/connections/'));assert.deepEqual(edge.spoiler,r.spoiler);}
});
