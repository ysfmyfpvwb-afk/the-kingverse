'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {ROOT}=require('../scripts/validate_foundation.cjs');const {generatePilot}=require('../scripts/build_pilot.cjs');const C=require('../scripts/pilot/shared.js');
const out=generatePilot();
async function harness(){
 const ids=new Map(),events={},calls=[];let holdPlot=false,resolvePlot;
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.handlers={};this.value='';this._text='';this.dataset={};this.classList={add(){}};}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent||'').join('');}
  get childNodes(){return this.children;}get lastElementChild(){return this.children.at(-1);}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes);}
  replaceWith(node){const p=this.parent;if(p)p.children[p.children.indexOf(this)]=node;}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]||null;}addEventListener(k,f){this.handlers[k]=f;}focus(){document.activeElement=this;}showModal(){this.open=true;}close(){this.open=false;}
  querySelector(tag){for(const c of this.children){if(c.tagName===tag)return c;const n=c.querySelector?.(tag);if(n)return n;}return null;}
 }
 const document={title:'',activeElement:null,createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n;},getElementById:id=>ids.get(id),addEventListener:(k,f)=>{events[k]=f;}};
 for(const id of ['main','back','discover','search-dialog','query','close-search','search-form','search-type','search-more','search-status','search-results']){const n=new Element('div');n.id=id;}ids.get('search-type').value='all';
 const history={state:null,back(){}},location={search:'',origin:'https://example.test',pathname:'/the-kingverse/explorer/pilot/',href:'https://example.test/the-kingverse/explorer/pilot/'};let clock=0;
 const context={document,history,location,window:{addEventListener:(k,f)=>{events[k]=f;},scrollTo(){}},PilotCore:C,performance:{now:()=>++clock},TextEncoder,structuredClone,URL,URLSearchParams,Map,Set,setTimeout,clearTimeout,
 fetch:url=>{calls.push(url);const file=url.split('?')[0],text=out.files.get('explorer/pilot/'+file);const response={ok:!!text,text:async()=>text};if(holdPlot&&file.endsWith('/plot.json')){holdPlot=false;return new Promise(resolve=>{resolvePlot=()=>resolve(response);});}return Promise.resolve(response);}};
 vm.runInNewContext(fs.readFileSync(ROOT+'/scripts/pilot/pilot.js','utf8').replaceAll('__VERSION__',out.report.dataVersion).replaceAll('__SEARCH__',out.report.assets.search),context);
 const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};await settle();
 return {ids,events,calls,document,context,settle,hold:()=>{holdPlot=true;},resolve:()=>resolvePlot()};
}
test('Actual pilot client loads only the entity payload initially and shares one lazy search index',async()=>{
 const h=await harness();assert.match(h.ids.get('main').textContent,/The Talisman/);assert.equal(h.calls.length,1);assert.match(h.calls[0],/data\/wrk-000001\/index.json/);assert.ok(!h.calls.some(c=>c.includes('search.')));
 await h.ids.get('discover').handlers.click();assert.equal(h.calls.length,2);assert.equal(h.ids.get('search-dialog').open,true);
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
 const h=await harness(),img=h.ids.get('main').querySelector('img');img.attrs.src=img.src;img.handlers.error();assert.ok(!h.ids.get('main').querySelector('img'));assert.match(h.ids.get('main').textContent,/Image unavailable/);
});
