'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {generatePilot}=require('../scripts/build_pilot.cjs'),M=require('../scripts/thread/core.js'),cytoscape=require('../assets/vendor/cytoscape-3.34.4/cytoscape.min.js');
const out=generatePilot(),file=[...out.files.keys()].find(p=>/thread\/map\..*\.json$/.test(p)),graph=JSON.parse(out.files.get(file)),ids=['loc:000007','wrk:000092','adp:000045'];
test('Expanded map preserves safe canonical edges, the original Shawshank route and edition-specific artwork',()=>{
 for(const id of ids)assert.ok(graph.nodes.some(n=>n.id===id));assert.equal(graph.edges.length,out.base.connections.filter(e=>e.certainty==='explicit'&&['none','premise'].includes(e.spoiler.level)).length);assert.equal(graph.edges.filter(e=>ids.includes(e.from)&&ids.includes(e.to)).length,2);for(const n of graph.nodes)assert.ok(out.base.nodes.some(original=>original.id===n.id));assert.ok(graph.starts.includes('loc:000005'));assert.ok(graph.starts.includes('ser:000001'));
 for(const e of graph.edges){const original=out.base.connections.find(c=>c.id===e.id);assert.ok(original);assert.equal(e.from,original.from.id);assert.equal(e.to,original.to.id);assert.equal(e.explanation,original.explanation);assert.deepEqual(e.evidence,original.evidence);assert.equal(e.certainty,'explicit');assert.ok(['none','premise'].includes(e.spoiler.level));for(const claim of e.evidence)for(const source of claim.sourceIds)assert.ok(graph.sources.some(s=>s.id===source));}
 const novella=graph.nodes.find(n=>n.id===ids[1]);assert.equal(novella.media.collectionId,'col:000003');assert.ok(novella.media.editionId);assert.equal(graph.nodes.find(n=>n.id===ids[2]).releaseYear,1994);
});
test('Indirect discoveries traverse the novella in both directions and never create a prison-to-film edge',()=>{
 assert.deepEqual(M.path(graph,ids[0],ids[2]),ids);assert.deepEqual(M.path(graph,ids[2],ids[0]),[...ids].reverse());assert.deepEqual(M.neighbors(graph,ids[0]).map(r=>r.node.id),[ids[1]]);assert.deepEqual(M.neighbors(graph,ids[2]).map(r=>r.node.id),[ids[1]]);assert.deepEqual(M.path(graph,ids[0],'unknown'),[]);
 const cy=cytoscape({headless:true,elements:[...graph.nodes.map(n=>({data:{id:n.id}})),...graph.edges.map(e=>({data:{id:e.id,source:e.from,target:e.to}}))]});const route=cy.elements().aStar({root:cy.getElementById(ids[0]),goal:cy.getElementById(ids[2])});assert.ok(route.found);assert.deepEqual(route.path.nodes().map(n=>n.id()),ids);cy.destroy();
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
 const next=M.storySequence(graph,'wrk:000005').find(r=>r.node.id==='wrk:000051');assert.ok(next);assert.equal(next.label,'Continues in');assert.equal(M.storySequence(graph,'wrk:000051').find(r=>r.node.id==='wrk:000005').label,'Sequel to');assert.ok(next.sequenceEdge.evidence.length);assert.deepEqual(M.path(graph,'adp:000070','wrk:000051'),['adp:000070','wrk:000005','wrk:000051']);assert.ok(!graph.edges.some(e=>e.predicate==='sequel_to'&&e.from==='adp:000015'&&e.to==='adp:000070'));
});

test('Doctor Sleep is a screen sequel to Kubrick’s 1980 film with separate source evidence and no 1997 sequel edge',()=>{
 const next=M.storySequence(graph,'adp:000046').find(r=>r.node.id==='adp:000015');assert.ok(next);assert.equal(next.label,'Continues in');assert.equal(M.storySequence(graph,'adp:000015').find(r=>r.node.id==='adp:000046').label,'Sequel to');assert.ok(next.sequenceEdge.evidence.flatMap(c=>c.sourceIds).some(id=>graph.sources.find(s=>s.id===id)?.url.includes('bloody-disgusting.com/interviews/3567118')));assert.ok(!M.storySequence(graph,'adp:000070').some(r=>r.node.id==='adp:000015'));assert.ok(M.neighbors(graph,'adp:000015').some(r=>r.node.id==='wrk:000051'&&r.edges.some(e=>e.predicate==='adaptation_of')));
});
