'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {generatePilot}=require('../scripts/build_pilot.cjs'),M=require('../scripts/thread/core.js'),cytoscape=require('../assets/vendor/cytoscape-3.34.4/cytoscape.min.js');
const out=generatePilot(),file=[...out.files.keys()].find(p=>/thread\/map\..*\.json$/.test(p)),graph=JSON.parse(out.files.get(file)),ids=['loc:000007','wrk:000092','adp:000045'];
test('Shawshank map preserves the existing two sourced, safe edges and edition-specific collection artwork',()=>{
 assert.deepEqual(graph.nodes.map(n=>n.id),ids);assert.equal(graph.edges.length,2);
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
