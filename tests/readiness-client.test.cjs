'use strict';
// Exercise the real isolated client against delayed fetches, without browser/network dependencies.
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {ROOT}=require('../scripts/validate_foundation.cjs');
test('A late plot response cannot reveal spoilers after navigating away; fresh explicit consent works',async()=>{
 const ids=new Map(),events={},calls=[];
 class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.handlers={};this.value='';this._text='';}
  set id(id){this._id=id;ids.set(id,this);}get id(){return this._id;}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('');}
  append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this._text='';this.children=nodes;}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]||null;}
  addEventListener(k,fn){this.handlers[k]=fn;}focus(){}
 }
 for(const id of ['find','catalog','counts','main']){const n=new Element('div');n.id=id;}
 const document={createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n;},getElementById:id=>ids.get(id)};
 const base=JSON.parse(fs.readFileSync(ROOT+'/data/readiness/default.json')),plot=JSON.parse(fs.readFileSync(ROOT+'/data/readiness/plot.json'));
 let resolvePlot;const delayed=new Promise(resolve=>{resolvePlot=resolve;});
 const context={document,location:{hash:'#entity=wrk%3A000001'},URLSearchParams,structuredClone,addEventListener:(name,fn)=>{events[name]=fn;},fetch:url=>{calls.push(url);return url==='default.json'?Promise.resolve({ok:true,json:async()=>base}):delayed;}};
 vm.runInNewContext(fs.readFileSync(ROOT+'/scripts/readiness-fixture/fixture.js','utf8'),context);
 for(let i=0;i<8;i++)await Promise.resolve();
 assert.match(ids.get('counts').textContent,/540 projected entities/);assert.deepEqual(calls,['default.json']);
 const pending=ids.get('reveal').handlers.click();assert.deepEqual(calls,['default.json','plot.json']);
 context.location.hash='#entity=wrk%3A000002';events.hashchange();assert.match(ids.get('main').textContent,/Black House/);
 resolvePlot({ok:true,json:async()=>plot});await pending;
 assert.match(ids.get('counts').textContent,/540 projected entities/);assert.equal(ids.get('reveal').textContent,'Reveal plot connections');assert.ok(!ids.get('catalog').textContent.includes('Father Callahan'));
 await ids.get('reveal').handlers.click();assert.match(ids.get('counts').textContent,/546 projected entities/);assert.equal(ids.get('reveal').textContent,'Hide plot connections');
 await ids.get('reveal').handlers.click();assert.match(ids.get('counts').textContent,/540 projected entities/);
 context.location.hash='#entity=chr%3A000005';events.hashchange();assert.match(ids.get('main').textContent,/Additional entity information/);assert.ok(!ids.get('main').textContent.includes('Father Callahan'));
 await ids.get('reveal').handlers.click();assert.match(ids.get('main').textContent,/Father Callahan/);
 context.location.hash='#entity=wrk%3A000001';events.hashchange();assert.match(ids.get('counts').textContent,/540 projected entities/);
});
