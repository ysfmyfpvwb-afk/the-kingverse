'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {ROOT}=require('../scripts/validate_foundation.cjs');const {generatePilot}=require('../scripts/build_pilot.cjs');const C=require('../scripts/pilot/shared.js');
const out=generatePilot();
async function harness(mediaOverride){
 const ids=new Map(),events={},calls=[];let holdPlot=false,resolvePlot;
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.handlers={};this.value='';this._text='';this.dataset={};this.classList={add(){}};}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent||'').join('');}
  get childNodes(){return this.children;}get lastElementChild(){return this.children.at(-1);}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  replaceWith(node){const p=this.parent;if(p)p.children[p.children.indexOf(this)]=node;}
  removeAttribute(k){delete this.attrs[k];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]||null;}addEventListener(k,f){this.handlers[k]=f;}focus(){document.activeElement=this;}showModal(){this.open=true;}close(){this.open=false;}
  querySelector(tag){for(const c of this.children){if(c.tagName===tag)return c;const n=c.querySelector?.(tag);if(n)return n;}return null;}
 }
 const document={body:{style:{}},title:'',activeElement:null,createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n;},getElementById:id=>ids.get(id),addEventListener:(k,f)=>{events[k]=f;}};
 for(const id of ['main','back','trail','discover','record-dialog','record-title','record-body','close-record','search-dialog','query','close-search','search-form','search-type','search-more','search-status','search-results']){const n=new Element('div');n.id=id;}ids.get('search-type').value='all';
 const history={state:null,back(){},pushState(s){this.state=s;},replaceState(s){this.state=s;}},location={search:'',origin:'https://example.test',pathname:'/the-kingverse/explorer/pilot/',href:'https://example.test/the-kingverse/explorer/pilot/'};let clock=0;
 const context={document,history,location,window:{addEventListener:(k,f)=>{events[k]=f;},scrollTo(){}},PilotCore:C,performance:{now:()=>++clock},TextEncoder,structuredClone,URL,URLSearchParams,Map,Set,setTimeout,clearTimeout,
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
 h.ids.get('query').value='Father Callahan';h.ids.get('search-form').handlers.submit({preventDefault(){}});await h.settle();assert.equal(h.ids.get('search-results').textContent,'');assert.match(h.ids.get('search-status').textContent,/0 available results/);assert.equal(h.calls.length,2);h.ids.get('search-dialog').handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(h.ids.get('search-dialog').open,false);assert.equal(h.document.activeElement.id,'discover');
});
test('Delayed plot responses, back navigation and refresh cannot silently reveal a previous page',async()=>{
 const h=await harness();h.hold();const pending=h.ids.get('spoilers').handlers.click();h.context.location.search='?entity=wrk%3A000002';await h.events.popstate();assert.match(h.ids.get('main').textContent,/Black House/);h.resolve();await pending;assert.equal(h.ids.get('spoilers').textContent,'Reveal plot connections');assert.ok(!h.ids.get('main').textContent.includes('Father Callahan'));
 h.context.location.search='?entity=chr%3A000005';await h.events.popstate();assert.ok(!h.ids.get('main').textContent.includes('Father Callahan'));assert.ok(!h.document.title.includes('Father Callahan'));
 await h.ids.get('spoilers').handlers.click();assert.match(h.ids.get('main').textContent,/Father Callahan/);assert.match(h.document.title,/Father Callahan/);
 await h.events.pageshow({persisted:true});await h.settle();assert.ok(!h.ids.get('main').textContent.includes('Father Callahan'));assert.ok(!h.document.title.includes('Father Callahan'));assert.equal(h.ids.get('spoilers').textContent,'Reveal plot connections');
});
test('An unavailable placeholder produces readable text without an error loop',async()=>{
 const h=await harness(),img=h.ids.get('main').querySelector('img');img.attrs.src=img.src;img.handlers.error();img.handlers.error();assert.ok(!h.ids.get('main').querySelector('img'));assert.match(h.ids.get('main').textContent,/Image unavailable/);
});

test('Book details fetch code and bounded bibliography only on request; Escape and browser Back restore the work',async()=>{
 const h=await harness();assert.equal(h.calls.length,1);assert.ok(!h.calls.some(c=>c.includes('details')));h.ids.get('record-open').focus();await h.ids.get('record-open').handlers.click();assert.equal(h.ids.get('record-dialog').open,true);assert.equal(h.document.body.style.overflow,'hidden');assert.match(h.ids.get('record-body').textContent,/Edition shelf/);assert.ok(h.calls.some(c=>c.includes('/details.json')));assert.equal(h.calls.filter(c=>c.startsWith('details.')).length,1);
 h.ids.get('record-dialog').handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(h.ids.get('record-dialog').open,false);assert.equal(h.document.body.style.overflow,'');assert.equal(h.document.activeElement.id,'record-open');h.context.history.state=null;await h.events.popstate();assert.match(h.ids.get('main').textContent,/The Talisman/);await h.ids.get('record-open').handlers.click();assert.equal(h.calls.filter(c=>c.startsWith('details.')).length,1);h.context.history.state=null;await h.events.popstate();assert.equal(h.ids.get('record-dialog').open,false);assert.equal(h.document.body.style.overflow,'');await h.ids.get('spoilers').handlers.click();h.ids.get('record-open').focus();await h.ids.get('record-open').handlers.click();h.context.history.state=null;await h.events.popstate();assert.equal(h.ids.get('spoilers').textContent,'Reveal plot connections');assert.equal(h.document.activeElement.id,'record-open');
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
