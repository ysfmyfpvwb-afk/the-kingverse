const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {generateMainCompletion}=require('../scripts/build_main_completion.cjs');
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{value:'',dataset:{},options:[{},{}],innerHTML:'',textContent:'',classList:{add(){},remove(){},contains(){return false},toggle(){}},setAttribute(){},focus(){},querySelectorAll(){return []}});return elements.get(id);}
const context=vm.createContext({URL,URLSearchParams,console,location:{hash:''},history:{pushState(){},replaceState(){}},localStorage:{getItem(){return 'en'},setItem(){}},document:{getElementById:element,querySelector(){return element('shell')},querySelectorAll(){return []},documentElement:{},body:{style:{}}}});
for(const file of ['catalog.js','media.js','catalog-completion.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8').replace(/init\(\);\s*$/,''),context);
const run=code=>vm.runInContext(code,context);
test('shared additions are reproducible, unique and present in the main catalog',()=>{
 const {db,patch}=generateMainCompletion();assert.equal(db.books.length,95);assert.equal(db.films.length,106);
 assert.equal(JSON.stringify(patch),run('JSON.stringify(CATALOG_UPDATES)'));
 for(const group of ['books','stories','films','works'])assert.equal(db[group].length,new Set(db[group].map(r=>r.id)).size);
 for(const title of ['On Writing: A Memoir of the Craft','GUNS','Secret Windows: Essays and Fiction on the Craft of Writing','Hansel and Gretel'])assert.ok(db.books.some(r=>r['Engelse titel']===title),title);
 const secret=db.books.find(r=>r.canonicalId==='col:000016');assert.equal(db.stories.filter(r=>r.collectionIds.includes(secret.id)).length,3);
});
test('new books render searchable descriptions, optional sources and Explorer links',()=>{
 run("tab='books';lang='en';$('search').value='On Writing';render()");assert.match(element('results').innerHTML,/On Writing: A Memoir of the Craft/);
 const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000242'))");assert.match(html,/<details><summary>Sources &amp; context|<details><summary>Sources & context/);assert.match(html,/entity=wrk%3A000242/);assert.doesNotMatch(html,/Still to verify|Sources are checked by field/);
 const secret=run("detailContent(B.find(r=>r.canonicalId==='col:000016'))");assert.match(secret,/Stories in this collection \(3\)/);
});
test('screen sequels keep film provenance and series links navigate to existing records',()=>{
 run("tab='films'");const sequel=run("detailContent(F.find(r=>r.canonicalId==='adp:000097'))");assert.match(sequel,/Firestarter \(1984\)/);assert.doesNotMatch(sequel,/source relationship has not yet/);
 run("tab='books'");const mercedes=run("detailContent(B.find(r=>bn(r)==='Mr. Mercedes'))");assert.match(mercedes,/Bill Hodges/);assert.match(mercedes,/Finders Keepers/);
});
test('existing images, legacy routes and enriched Dutch editions remain usable',()=>{
 run("tab='books';lang='en'");assert.equal(run("media(B.find(r=>bn(r)==='The Talisman')).image"),run("MEDIA.books['The Talisman'].en.image"));
 run("lang='nl'");assert.equal(run("title(B.find(r=>bn(r)===\"'Salem's Lot\"))"),'Bezeten stad');
 assert.ok(run('DB.editions.filter(e=>e.publisher&&e.language===\'nl\').length')>=60);
 assert.equal(run('B.filter(r=>r.id.startsWith(\'books:\')).length'),95);
 for(const group of ['B','S','F'])assert.equal(run(`${group}.every(r=>(r.connected||[]).every(c=>c.target.kind==='explorer'||({books:B,stories:S,films:F})[c.target.kind]?.some(t=>t.id===c.target.id)))`),true);
});

test('Corn film additions appear in search and link both the main franchise shelf and Explorer',()=>{
 run("tab='films';lang='en';$('search').value='Corn';$('filter').value='';render()");assert.match(element('results').innerHTML,/Fields of Terror/);assert.match(element('results').innerHTML,/Revelation/);
 const html=run("detailContent(F.find(r=>r.canonicalId==='adp:000100'))");assert.match(html,/Greg Spence/);assert.match(html,/Children of the Corn film series/);assert.match(html,/Isaac&#39;s Return/);assert.match(html,/entity=adp%3A000100/);assert.doesNotMatch(html,/source relationship has not yet|Based on.*short story/);
 run("tab='films'");assert.match(run("detailContent(F.find(r=>r.canonicalId==='adp:000007'))"),/Fields of Terror/);
});

test('New Corn adaptations appear at the story and collection, while Pet Two stays a screen sequel',()=>{
 run("tab='stories';lang='en'");let html=run("detailContent(S.find(r=>r.canonicalId==='wrk:000087'))");assert.match(html,/2009/);assert.match(html,/2023/);
 run("tab='books'");html=run("detailContent(B.find(r=>bn(r)==='Night Shift'))");assert.match(html,/2009/);assert.match(html,/2023/);
 run("tab='films'");html=run("detailContent(F.find(r=>r.canonicalId==='adp:000104'))");assert.match(html,/Pet Sematary \(1989\)/);assert.doesNotMatch(html,/data-next="books"/);
 html=run("detailContent(F.find(r=>r.canonicalId==='adp:000106'))");assert.match(html,/data-next="stories"/);assert.match(html,/Kurt Wimmer/);
});
