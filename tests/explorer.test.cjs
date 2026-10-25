'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {ROOT,loadBundle}=require('../scripts/validate_foundation.cjs');
const {createModel}=require('../scripts/explorer_model.cjs');
const {createRenderer,generateFiles}=require('../scripts/build_explorer.cjs');
const bundle=loadBundle();const model=createModel(bundle,ROOT);
const renderer=createRenderer(bundle);const files=generateFiles();
test('Explorer output is reproducible and all generated files match canonical records',()=>{
 assert.equal(files.size,16);assert.deepEqual(generateFiles(),files);
 for(const [name,content] of files)assert.equal(fs.readFileSync(path.join(ROOT,'explorer',name),'utf8'),content,name);
 assert.equal(bundle.works.length,2);assert.equal(bundle.adaptations.length,0);
});
test('Every static and revealed link resolves under a GitHub Pages subpath',()=>{
 const base='https://example.test/the-kingverse/';
 for(const [name,content] of files){
  const text=name.endsWith('.json')?Object.values(JSON.parse(content)).join(''):content;
  for(const [,url] of text.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(url.startsWith('https://'))continue;
   const target=new URL(url,base+'explorer/'+name);
   assert.ok(target.pathname.startsWith('/the-kingverse/'),`${name}: ${url} escapes repository root`);
   let file=decodeURIComponent(target.pathname.slice('/the-kingverse/'.length));
   if(file.endsWith('/'))file+='index.html';
   assert.ok(fs.existsSync(path.join(ROOT,file)),`${name}: missing ${file}`);
   if(target.hash&&!target.search&&target.pathname.includes('/explorer/')){
    const dest=fs.readFileSync(path.join(ROOT,file),'utf8');assert.ok(dest.includes(`id="${target.hash.slice(1)}"`));
   }
  }
 }
});
test('Safe HTML and metadata contain no plot connections or unlabelled theories',()=>{
 for(const r of model.entities.values()){
  const html=renderer.render(r);
  for(const rel of model.relations(r.id,true)){
   assert.ok(!html.includes(rel.explanation.en));assert.ok(!html.includes(`data-relation="${rel.id}"`));
  }
  assert.ok(!html.includes('Breakers'));assert.ok(!html.includes('The Waste Lands'));
  assert.ok(html.includes('No interpretative connection is currently recorded.'));
  assert.ok(html.includes('noindex,follow'));
 }
});
test('Connections and credits navigate in both directions without stored reverse edges',()=>{
 const tal=model.relations('wrk:000001');assert.equal(tal.length,4);
 assert.equal(tal.find(c=>c.predicate==='sequel_to').label,'Continues in');
 assert.equal(model.relations('wrk:000002').find(c=>c.predicate==='sequel_to').label,'Sequel to');
 assert.equal(model.relations('chr:000001').length,2);
 assert.equal(model.relations('loc:000001')[0].target.id,'wrk:000001');
 assert.equal(model.relations('per:000002').length,2);
 assert.ok(renderer.render(model.get('per:000002')).includes('Co-author of'));
 assert.equal(bundle.connections.length,8);
});
test('Edition uncertainty, co-author roles, source precision and provider identity remain visible',()=>{
 const tal=renderer.render(model.get('wrk:000001'));const bh=renderer.render(model.get('wrk:000002'));
 for(const html of [tal,bh]){
  assert.ok(html.includes('Stephen King'));assert.ok(html.includes('Peter Straub'));
  assert.equal((html.match(/Co-author · whole text/g)||[]).length,2);
  assert.ok(html.includes('Provisional evidence'));assert.ok(html.includes('Independent confirmation is not claimed.'));
  assert.ok(html.includes('These are not confirmed first editions.'));assert.ok(html.includes('ISBN not yet confirmed'));
  assert.ok(!html.includes('imdb.com'));assert.ok(!html.includes('ratingValue'));
 }
 assert.ok(tal.includes('November 1984'));assert.ok(!tal.includes('1 November 1984'));
 assert.ok(bh.includes('15 September 2001'));
 const revealed=renderer.relationParts(model.relations('wrk:000001',true));
 assert.ok(revealed.nodes.includes('Strongly implied'));assert.ok(revealed.nodes.includes('Provisional evidence'));
 assert.ok(revealed.nodes.includes('books%3Athe-dark-tower-the-waste-lands'));
});
test('Rendering follows changed canonical data and escapes untrusted markup',()=>{
 const copy=structuredClone(bundle);copy.characters[0].name='<script>alert(1)</script>';
 copy.connections[1].explanation.en='Changed evidence & context';
 const html=createRenderer(copy).render(copy.works[0]);
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert'));
 assert.ok(html.includes('Changed evidence &amp; context'));
 copy.registry.entries=copy.registry.entries.filter(r=>r.id!==copy.characters[0].id);
 assert.throws(()=>createModel(copy,ROOT),/Unregistered/);
});
// DOM harness exercises progressive enhancement, filtering, failed fetch and re-consent.
function ui({fail=false,imageComplete=true,imageWidth=0}={}){
 const handlers={};const items=[];let fetched=0;
 const rect={x:0,y:0,width:200,height:100,bottom:100};
 const item=(kind,confidence,plot=false)=>({dataset:{kind,certainty:confidence,...(plot?{plot:'true'}:{})},hidden:false,classList:{contains:n=>n==='map-node'},getBoundingClientRect:()=>rect,remove(){items.splice(items.indexOf(this),1);}});
 items.push(item('work','explicit'),item('character','explicit'));
 const elements={kind:{value:'all'},certainty:{value:'all'},'connection-status':{},spoilers:{setAttribute(k,v){this[k]=v}},'spoiler-status':{}};
 for(const [id,el] of Object.entries(elements))el.addEventListener=(event,fn)=>{handlers[id+':'+event]=fn;};
 const svg={setAttribute(){},replaceChildren(){},append(){}};
 const map={dataset:{},addEventListener(){},getBoundingClientRect:()=>rect,querySelector:s=>s==='.map-lines'?svg:{getBoundingClientRect:()=>rect},querySelectorAll:()=>items.filter(i=>!i.hidden)};
 for(const id of ['map-nodes','relation-list'])elements[id]={append(fragment){if(id==='map-nodes')items.push(...fragment.children);}};
 const fallback={hidden:true};
 const retry={hidden:true,disabled:false,addEventListener(event,fn){handlers['retry:'+event]=fn;}};
 const figure={querySelector:s=>s==='.cover-fallback'?fallback:retry};
 const image={complete:imageComplete,naturalWidth:imageWidth,src:'https://stephenking.com/approved-cover.jpg',getAttribute:()=>image.src,closest:()=>figure,addEventListener(event,fn){handlers['image:'+event]=fn;}};
 const document={
  querySelector:s=>s==='.connection-map'?map:{hidden:true},
  querySelectorAll:s=>s==='.cover img'?[image]:s==='[data-plot]'?items.filter(i=>i.dataset.plot):items,
  getElementById:id=>elements[id],createElementNS:()=>({setAttribute(){}}),
  createElement:()=>({content:{children:[item('externalReference','strongly-implied',true)]},set innerHTML(v){}})
 };
 const context=vm.createContext({document,window:{addEventListener(event,fn){handlers['window:'+event]=fn;}},fetch:async()=>{fetched++;if(fail)throw Error();return {ok:true,json:async()=>({nodes:'<a>test</a>',cards:'<article>test</article>'})};}});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'explorer/explorer.js'),'utf8'),context);
 return {elements,items,handlers,image,fallback,retry,map,fetched:()=>fetched};
}
test('Plot payload is opt-in, filterable and removed on hide; image error falls back',async()=>{
 const u=ui();assert.equal(u.fetched(),0);assert.equal(u.image.hidden,true);
 u.elements.kind.value='character';u.handlers['kind:change']();
 assert.equal(u.items.filter(i=>!i.hidden).length,1);
 await u.handlers['spoilers:click']();assert.equal(u.fetched(),1);assert.equal(u.elements.spoilers['aria-expanded'],'true');
 assert.equal(u.items.filter(i=>!i.hidden).length,1);
 u.elements.kind.value='all';u.elements.certainty.value='strongly-implied';u.handlers['certainty:change']();
 assert.equal(u.items.filter(i=>!i.hidden).length,1);
 await u.handlers['spoilers:click']();assert.equal(u.items.length,2);assert.equal(u.elements.spoilers['aria-expanded'],'false');
 assert.ok(u.elements['connection-status'].textContent.includes('Try another filter'));
 assert.equal(ui().fetched(),0);
});
test('Failed plot fetch offers retry and leaves safe connections intact',async()=>{
 const u=ui({fail:true});await u.handlers['spoilers:click']();
 assert.equal(u.items.length,2);assert.equal(u.elements.spoilers.disabled,false);
 assert.ok(u.elements['spoiler-status'].textContent.includes('try again'));
});

test('Returning through browser history clears spoiler consent and filters',async()=>{
 const u=ui();await u.handlers['spoilers:click']();
 u.elements.kind.value='externalReference';u.handlers['kind:change']();
 u.handlers['window:pageshow']({persisted:true});
 assert.equal(u.items.length,2);assert.equal(u.elements.kind.value,'all');
 assert.equal(u.elements.spoilers['aria-expanded'],'false');
 assert.equal(u.elements['spoiler-status'].textContent,'Plot connections hidden.');
});

test('Each relation renders once with a full-card native link and separate source disclosure',()=>{
 for(const r of model.entities.values()){
  const html=renderer.render(r);
  const rows=model.relations(r.id);
  assert.equal((html.match(/class="map-node"/g)||[]).length,rows.length);
  assert.equal((html.match(/class="connection-link"/g)||[]).length,rows.length);
  assert.ok(!html.includes('id="relation-list"'));
  for(const rel of rows){
   assert.equal(html.split(`data-relation="${rel.id}"`).length-1,1);
   assert.ok(html.includes(rel.explanation.en.replaceAll('&','&amp;')));
  }
  const parts=renderer.relationParts(model.relations(r.id,true));
  assert.equal(parts.cards,'');
  for(const [anchor] of parts.nodes.matchAll(/<a class="connection-link"[^>]*>[^]*?<\/a>/g))assert.ok(!anchor.includes('<details'));
  assert.equal((parts.nodes.match(/<\/a><details class="evidence"/g)||[]).length,model.relations(r.id,true).length);
 }
});
test('Cached covers stay visible and late load recovers from failure without replacing approved artwork',()=>{
 const loaded=ui({imageWidth:255});assert.equal(loaded.image.hidden,false);assert.equal(loaded.fallback.hidden,true);
 const pending=ui({imageComplete:false});assert.equal(pending.fallback.hidden,true);
 pending.handlers['image:error']();assert.equal(pending.image.hidden,true);assert.equal(pending.retry.hidden,false);
 const url=pending.image.src;
 pending.handlers['retry:click']();assert.equal(pending.image.src,url);assert.equal(pending.retry.disabled,true);
 pending.handlers['image:error']();assert.equal(pending.retry.disabled,false);
 pending.handlers['image:load']();assert.equal(pending.image.hidden,false);assert.equal(pending.fallback.hidden,true);assert.equal(pending.retry.hidden,true);
});
test('Dense maps keep all results filterable while suppressing decorative connector clutter',()=>{
 const u=ui();
 for(let i=0;i<20;i++)u.items.push({...u.items[0],dataset:{kind:'work',certainty:'explicit'}});
 u.handlers['kind:change']();assert.equal(u.map.dataset.dense,'true');
 assert.ok(u.elements['connection-status'].textContent.includes('22 connections'));
 u.elements.kind.value='character';u.handlers['kind:change']();
 assert.equal(u.items.filter(i=>!i.hidden).length,1);assert.equal(u.map.dataset.dense,'false');
});
