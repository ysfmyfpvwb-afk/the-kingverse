'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {ROOT}=require('../scripts/validate_foundation.cjs');const {generatePilot}=require('../scripts/build_pilot.cjs');const C=require('../scripts/pilot/shared.js');
const out=generatePilot();
async function harness(mediaOverride,route='?entity=wrk%3A000001',storage=new Map()){
 const ids=new Map(),events={},calls=[];let holdPlot=false,resolvePlot;
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.handlers={};this.value='';this._text='';this.dataset={};this.classList={add(){}};}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent||'').join('');}
  get childNodes(){return this.children;}get lastElementChild(){return this.children.at(-1);}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}prepend(...nodes){for(const n of nodes)n.parent=this;this.children.unshift(...nodes);}replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  replaceWith(node){const p=this.parent;if(p)p.children[p.children.indexOf(this)]=node;}
  removeAttribute(k){delete this.attrs[k];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]||this[k]||null;}addEventListener(k,f){this.handlers[k]=f;}focus(){document.activeElement=this;}showModal(){this.open=true;}close(){this.open=false;}
  querySelector(tag){for(const c of this.children){if(c.tagName===tag)return c;const n=c.querySelector?.(tag);if(n)return n;}return null;}
 }
 const document={body:{style:{}},title:'',activeElement:null,createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n;},getElementById:id=>ids.get(id),addEventListener:(k,f)=>{events[k]=f;}};
 for(const id of ['main','back','trail','breadcrumbs','explorer-home','discover','record-dialog','record-title','record-body','close-record','search-dialog','query','close-search','search-form','search-type','search-more','search-status','search-results']){const n=new Element('div');n.id=id;}ids.get('search-type').value='all';
 const history={state:null,back(){},pushState(s,_,href){this.state=s;applyUrl(href);},replaceState(s,_,href){this.state=s;applyUrl(href);}},location={search:route,origin:'https://example.test',pathname:'/the-kingverse/explorer/pilot/',href:'https://example.test/the-kingverse/explorer/pilot/'+route};function applyUrl(href){if(href){const u=new URL(href,location.href);Object.assign(location,{href:u.href,search:u.search,pathname:u.pathname});}}let clock=0;
 const context={document,history,location,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{addEventListener:(k,f)=>{events[k]=f;},scrollTo(){}},PilotCore:C,performance:{now:()=>++clock},TextEncoder,structuredClone,URL,URLSearchParams,Map,Set,setTimeout,clearTimeout,
 fetch:url=>{calls.push(url);const file=url.split('?')[0],original=out.files.get('explorer/pilot/'+file),text=mediaOverride&&file==='data/wrk-000001/index.json'?JSON.stringify({...JSON.parse(original),media:mediaOverride}):original;const response={ok:!!text,text:async()=>text};if(holdPlot&&file.endsWith('/plot.json')){holdPlot=false;return new Promise(resolve=>{resolvePlot=()=>resolve(response);});}return Promise.resolve(response);}};
 document.head={append(script){calls.push(script.src);vm.runInNewContext(fs.readFileSync(ROOT+'/scripts/pilot/details.js','utf8'),context);script.handlers.load();}};
 vm.runInNewContext(fs.readFileSync(ROOT+'/scripts/pilot/pilot.js','utf8').replaceAll('__VERSION__',out.report.dataVersion).replaceAll('__SEARCH__',out.report.assets.search).replaceAll('__DETAILS__',out.report.assets.details),context);
 const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};await settle();
 return {ids,events,calls,document,context,settle,hold:()=>{holdPlot=true;},resolve:()=>resolvePlot()};
}
test('Actual pilot client loads only the entity payload initially and shares one lazy search index',async()=>{
 const h=await harness();assert.match(h.ids.get('main').textContent,/The Talisman/);assert.equal(h.calls.length,1);assert.match(h.calls[0],/data\/wrk-000001\/index.json/);assert.ok(!h.calls.some(c=>c.includes('search.')));
 h.ids.get('discover').focus();await h.ids.get('discover').handlers.click();assert.equal(h.calls.length,2);assert.equal(h.ids.get('search-dialog').open,true);
 h.ids.get('query').value='Zwart huis';h.ids.get('search-form').handlers.submit({preventDefault(){}});await h.settle();assert.match(h.ids.get('search-results').textContent,/Black House/);
 h.ids.get('query').value='Father Callahan';h.ids.get('search-form').handlers.submit({preventDefault(){}});await h.settle();assert.match(h.ids.get('search-results').textContent,/Father Callahan/);assert.match(h.ids.get('search-status').textContent,/1 available result/);assert.equal(h.calls.length,2);h.ids.get('search-dialog').handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(h.ids.get('search-dialog').open,false);assert.equal(h.document.activeElement.id,'discover');
});
test('Formerly gated pages and connections open directly and remain visible after back navigation and refresh',async()=>{
 const h=await harness(undefined,'?entity=chr%3A000005');assert.match(h.ids.get('main').textContent,/Father Callahan/);assert.match(h.document.title,/Father Callahan/);assert.ok(!h.ids.has('spoilers'));assert.ok(!h.calls.some(c=>c.includes('/plot.json')));
 h.context.location.search='?entity=wrk%3A000002';await h.events.popstate();assert.match(h.ids.get('main').textContent,/Black House/);assert.match(h.ids.get('main').textContent,/The Territories/);assert.ok(!/plot details hidden|Reveal plot|spoiler/i.test(h.ids.get('main').textContent));
 h.context.location.search='?entity=chr%3A000005';await h.events.pageshow({persisted:true});await h.settle();assert.match(h.document.title,/Father Callahan/);assert.ok(!h.ids.has('spoilers'));
});
test('An unavailable placeholder produces readable text without an error loop',async()=>{
 const h=await harness(),img=h.ids.get('main').querySelector('img');img.attrs.src=img.src;img.handlers.error();img.handlers.error();assert.ok(!h.ids.get('main').querySelector('img'));assert.match(h.ids.get('main').textContent,/Image unavailable/);
});

test('Book details fetch code and bounded bibliography only on request; Escape and browser Back restore the work',async()=>{
 const h=await harness();assert.equal(h.calls.length,1);assert.ok(!h.calls.some(c=>c.includes('details')));h.ids.get('record-open').focus();await h.ids.get('record-open').handlers.click();assert.equal(h.ids.get('record-dialog').open,true);assert.equal(h.document.body.style.overflow,'hidden');assert.match(h.ids.get('record-body').textContent,/Edition shelf/);assert.ok(h.calls.some(c=>c.includes('/details.json')));assert.equal(h.calls.filter(c=>c.startsWith('details.')).length,1);
 h.ids.get('record-dialog').handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(h.ids.get('record-dialog').open,false);assert.equal(h.document.body.style.overflow,'');assert.equal(h.document.activeElement.id,'record-open');h.context.history.state=null;await h.events.popstate();assert.match(h.ids.get('main').textContent,/The Talisman/);await h.ids.get('record-open').handlers.click();assert.equal(h.calls.filter(c=>c.startsWith('details.')).length,1);h.context.history.state=null;await h.events.popstate();assert.equal(h.ids.get('record-dialog').open,false);assert.equal(h.document.body.style.overflow,'');h.ids.get('record-open').focus();await h.ids.get('record-open').handlers.click();h.context.history.state=null;await h.events.popstate();assert.ok(!h.ids.has('spoilers'));assert.equal(h.document.activeElement.id,'record-open');
});

test('New bibliography is reachable through search, and reader pages do not render internal audit notes',async()=>{
 const h=await harness();await h.ids.get('discover').handlers.click();h.ids.get('query').value='On Writing';h.ids.get('search-form').handlers.submit({preventDefault(){}});await h.settle();assert.match(h.ids.get('search-results').textContent,/On Writing: A Memoir of the Craft/);
 h.context.location.search='?entity=wrk%3A000242';await h.events.popstate();assert.match(h.ids.get('main').textContent,/memoir about becoming a writer/);assert.doesNotMatch(h.ids.get('main').textContent,/canonical|migration|field-specific|clm:|wrk:|Record scope|independently verified/);
 await h.ids.get('record-open').handlers.click();assert.match(h.ids.get('record-body').textContent,/Sources & context/);assert.doesNotMatch(h.ids.get('record-body').textContent,/field-specific|permission for reuse|Detailed edition|clm:/);
});

test('Approved local artwork shows its credit and falls back cleanly if the file fails',async()=>{
 const fallback='assets/media/fallbacks/book.svg',src='assets/explorer-media/covers/edn-000002/approved.jpg';
 const h=await harness({src,fallbackPath:fallback,officialArtwork:true,reason:'approved-local',credit:{text:'Artwork credit supplied with permission',url:null},validUntil:'2099-01-01'});
 const main=h.ids.get('main'),img=main.querySelector('img');assert.equal(img.src,'../../'+src);assert.match(main.textContent,/Artwork credit supplied with permission/);
 img.handlers.error();assert.equal(img.src,'../../'+fallback);assert.doesNotMatch(main.textContent,/Artwork credit supplied with permission/);assert.match(main.textContent,/Cover not available/);
});

test('Anthology bylines show unique editors while details retain every contribution role',async()=>{
 const h=await harness(),find=(n,cls)=>n.className===cls?n:n.children.map(c=>find(c,cls)).find(Boolean);h.context.location.search='?entity=col%3A000017';await h.events.popstate();const by=find(h.ids.get('main'),'byline');assert.equal(by.textContent,'Edited by Stephen King · Bev Vincent');assert.equal(by.children.filter(c=>c.tagName==='a').length,2);await h.ids.get('record-open').handlers.click();assert.match(h.ids.get('record-body').textContent,/Authors & contributors · 4/);assert.equal((h.ids.get('record-body').textContent.match(/Editor/g)||[]).length,2);assert.equal((h.ids.get('record-body').textContent.match(/Contributor/g)||[]).length,2);h.context.history.state=null;await h.events.popstate();h.context.location.search='?entity=wrk%3A000056';await h.events.popstate();const authors=find(h.ids.get('main'),'byline');assert.match(authors.textContent,/^By /);assert.match(authors.textContent,/Owen King/);assert.equal(authors.children.filter(c=>c.tagName==='a'&&c.textContent==='Stephen King').length,1);
});

test('Collected novels use book labels and preserve direct membership navigation',async()=>{
 const h=await harness();h.context.location.search='?entity=col%3A000018';await h.events.popstate();const main=h.ids.get('main');assert.match(main.textContent,/Books in this volume · 3/);assert.equal((main.textContent.match(/Read this book/g)||[]).length,3);assert.match(main.textContent,/Book 1/);assert.match(main.textContent,/Book 3/);assert.doesNotMatch(main.textContent,/Story [123]/);assert.match(main.textContent,/Chizmar wrote the middle novel/);
});

test('Explorer breadcrumbs and previous discovery use a bounded tab trail, including refresh and direct entry',async()=>{
 const storage=new Map(),h=await harness(undefined,'',storage);
 assert.equal(h.ids.get('back').hidden,true);assert.match(h.ids.get('main').textContent,/The Kingverse Explorer/);assert.match(h.ids.get('breadcrumbs').textContent,/HomeExplorer Home/);
 const click=async(a)=>{h.events.click({target:{closest:()=>a},button:0,preventDefault(){}});await h.settle();};
 const a=h.document.createElement('a');a.href='?entity=wrk%3A000001';await click(a);assert.match(h.ids.get('breadcrumbs').textContent,/The Talisman/);assert.equal(h.ids.get('back').href,'./');
 a.href='?entity=wrk%3A000002';await click(a);assert.match(h.ids.get('breadcrumbs').textContent,/Black House/);assert.equal(h.ids.get('back').href,'?entity=wrk%3A000001');
 await click(h.ids.get('back'));assert.match(h.ids.get('main').textContent,/The Talisman/);assert.equal(h.context.location.search,'?entity=wrk%3A000001');
 const refreshed=await harness(undefined,'?entity=wrk%3A000001',storage);assert.equal(refreshed.ids.get('back').hidden,false);assert.equal(refreshed.ids.get('back').href,'./');
 const direct=await harness(undefined,'?entity=chr%3A000005');assert.equal(direct.ids.get('back').hidden,true);assert.match(direct.ids.get('breadcrumbs').textContent,/Father Callahan/);
 const saved=JSON.parse(storage.get('kingverse-explorer-trail'));assert.deepEqual(saved,[null,'wrk:000001']);
});

test('Crossroads has three semantic entrances and preserves thematic and book links into the map',async()=>{
 const h=await harness(undefined,'');assert.equal(h.ids.get('crossroads-thread').tagName,'button');assert.equal(h.ids.get('crossroads-path').href,'#rabbit-holes');assert.equal(h.ids.get('crossroads-find').tagName,'button');assert.ok(!h.ids.has('home-query'));assert.match(h.ids.get('main').textContent,/The Kingverse Explorer/);
 const links=[];const walk=n=>{if(n.tagName==='a')links.push(n);for(const c of n.children||[])walk(c);};walk(h.ids.get('main'));for(const name of ['The Dark Tower','Castle Rock','The Talisman','The Shining','The Stand'])assert.ok(links.some(a=>a.textContent.includes(name)&&a.href.startsWith('thread/?entity=')),name);
 h.ids.get('crossroads-path').handlers.click({preventDefault(){}});assert.equal(h.document.activeElement.id,'rabbit-title');
 await h.ids.get('crossroads-find').handlers.click();assert.equal(h.ids.get('search-dialog').open,true);h.ids.get('query').value='Shining';h.ids.get('search-form').handlers.submit({preventDefault(){}});await h.settle();assert.match(h.ids.get('search-results').textContent,/The Shining/);for(const li of h.ids.get('search-results').children){assert.ok(li.children[0].href.startsWith('thread/?entity='));assert.ok(!/adp%3A|edn%3A|per%3A/.test(li.children[0].href));}
});

test('Follow a Thread picks a real connected entity and avoids repeating the previous starting point',async()=>{
 const h=await harness(undefined,'');const search=JSON.parse(out.files.get('explorer/pilot/'+out.report.assets.search));const select=async()=>{await h.ids.get('crossroads-thread').handlers.click();const route=new URL(h.context.location.href,'https://example.test/the-kingverse/explorer/pilot/'),id=route.searchParams.get('entity');assert.equal(route.pathname,'/the-kingverse/explorer/pilot/thread/');const entry=search.records.find(r=>r.id===id);assert.ok(entry?.hasConnectionMap);assert.ok(entry.connectionCount>=2);return id;};
 const first=await select();h.context.location.search='';await h.events.pageshow({persisted:true});await h.settle();const second=await select();assert.notEqual(second,first);
});
