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
 const {db,patch}=generateMainCompletion();assert.equal(db.books.length,96);assert.equal(db.films.length,109);
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
 assert.equal(run('B.filter(r=>r.id.startsWith(\'books:\')).length'),96);
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

test('Core novel introductions reach the main details without changing editions or existing covers',()=>{
 run("tab='books';lang='en'");for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='work'&&run(`B.some(b=>b.canonicalId===${JSON.stringify(e.subject.id)})`))){const html=run(`detailContent(B.find(r=>r.canonicalId===${JSON.stringify(e.subject.id)}))`);assert.ok(html.includes(e.value.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);assert.doesNotMatch(html,/A work by Stephen King\. Explore its editions/);}
 assert.match(run("detailContent(B.find(r=>r.canonicalId==='wrk:000005'))"),/Overlook Hotel/);assert.equal(run("media(B.find(r=>r.canonicalId==='wrk:000005')).image"),run("MEDIA.books['The Shining'].en.image"));
});

test('New publisher editions render on main pages with edition dates separate from original work years',()=>{
 run("tab='books';lang='en'");const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000242'))");assert.match(html,/2000/);assert.match(html,/2020-06-02/);assert.match(html,/9781982159375/);assert.match(html,/Scribner/);assert.match(html,/simonandschuster\.com/);
 const misery=run("detailContent(B.find(r=>r.canonicalId==='wrk:000021'))");assert.match(misery,/2016-01-05/);assert.match(misery,/9781501143106/);assert.equal(run("media(B.find(r=>r.canonicalId==='wrk:000021')).image"),run("MEDIA.books.Misery.en.image"));assert.equal(run('DB.editions.length'),169);
});

test('Visitor connection explanations use readable content while retaining optional source links',()=>{
 run("tab='stories';lang='en'");const html=run("detailContent(S.find(r=>r.canonicalId==='wrk:000087'))");assert.match(html,/brings King’s story Children of the Corn to the screen/);assert.doesNotMatch(html,/literary-source field/);assert.match(html,/Sources & context/);assert.match(html,/catalog\.afi\.com/);
});

test('The complete Gwendy reading sequence is visible on the main site without false King co-authorship',()=>{
 run("tab='books';lang='en'");const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000250'))");assert.match(html,/Richard Chizmar/);assert.match(html,/Stephen King/);assert.match(html,/Introduction/);assert.match(html,/9781587677311/);assert.match(html,/Gwendy Trilogy/);assert.match(html,/Book 1/);assert.match(html,/Book 3/);
 assert.equal(run("B.find(r=>r.canonicalId==='wrk:000250').Auteur"),'Richard Chizmar');assert.equal(run("B.filter(r=>bn(r)===\"Gwendy's Magic Feather\").length"),1);
});

test('Collection descriptions appear on main pages beside existing contents and cover assets',()=>{
 run("tab='books';lang='en'");for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='collection')){const html=run(`detailContent(B.find(r=>r.canonicalId===${JSON.stringify(e.subject.id)}))`);assert.ok(html.includes(e.value.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));if(run(`S.some(s=>s.collectionIds?.includes(B.find(r=>r.canonicalId===${JSON.stringify(e.subject.id)}).id))`))assert.match(html,/Stories in this collection/);}
 assert.equal(run("media(B.find(r=>r.canonicalId==='col:000002')).image"),run("MEDIA.books['Night Shift'].en.image"));
});

test('Every current main-library book and collection has its own usable English introduction',()=>{
 run("tab='books';lang='en'");assert.equal(run('B.length'),96);assert.equal(run('B.filter(b=>b.summary?.en?.length>40).length'),96);for(const id of run('B.map(b=>b.id)')){const html=run(`detailContent(B.find(b=>b.id===${JSON.stringify(id)}))`);assert.doesNotMatch(html,/A work by Stephen King\. Explore its editions|plot description has not yet been verified/);assert.match(html,/Sources & context/);}
});

test('Main book and story pages link to the new profiles and sequel without revealing Holly in The Outsider',()=>{
 run("tab='books';lang='en'");for(const [book,target]of [['wrk:000065','chr%3A000012'],['wrk:000019','loc%3A000004'],['wrk:000012','loc%3A000005']]){const html=run(`detailContent(B.find(r=>r.canonicalId===${JSON.stringify(book)}))`);assert.ok(html.includes('entity='+target));}
 const outside=run("detailContent(B.find(r=>r.canonicalId==='wrk:000058'))");assert.doesNotMatch(outside,/entity=chr%3A000012/);
 run("tab='stories'");const story=run("detailContent(S.find(r=>r.canonicalId==='wrk:000195'))");assert.match(story,/Rattlesnakes.*sequel to Cujo/s);assert.match(story,/data-next="books"/);
});

test('Sixteen collection stories have individual reading introductions on every existing main view',()=>{
 run("tab='stories';lang='en'");const ids=['wrk:000092','wrk:000093','wrk:000094','wrk:000095','wrk:000118','wrk:000119','wrk:000120','wrk:000121','wrk:000177','wrk:000178','wrk:000179','wrk:000180','wrk:000182','wrk:000183','wrk:000184','wrk:000185'];
 for(const id of ids){const rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){assert.ok(row.summary.en.length>80);const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}}
});

test('Seven Night Shift story introductions preserve collection media and adaptation navigation',()=>{
 run("tab='stories';lang='en'");for(const id of ['wrk:000073','wrk:000074','wrk:000078','wrk:000079','wrk:000084','wrk:000085','wrk:000087']){const row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(row.summary.en.length>60);const html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/Night Shift/);assert.match(html,/Sources & context/);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.equal(run(`media(S.find(s=>s.canonicalId===${JSON.stringify(id)})).image`),run("MEDIA.books['Night Shift'].en.image"));}
 const corn=run("detailContent(S.find(s=>s.canonicalId==='wrk:000087'))");assert.match(corn,/Children of the Corn \(1984\)/);assert.match(corn,/Children of the Corn \(2009\)/);assert.match(corn,/Children of the Corn \(2023\)/);
});

test('Three more Corn films are searchable main entries with descriptions and working franchise navigation',()=>{
 run("tab='films';lang='en'");for(const id of ['adp:000107','adp:000108','adp:000109']){const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/Children of the Corn film series/);assert.match(html,/Sources & context/);assert.ok(html.includes('entity='+encodeURIComponent(id)));assert.doesNotMatch(html,/data-next="stories"/);assert.ok(run(`F.filter(f=>f.canonicalId===${JSON.stringify(id)}).length`)===1);}
});

test('Standalone story editions appear on every main story view with their original collection cover and without duplicate books',()=>{
 run("tab='stories';lang='en'");for(const [id,isbn]of [['wrk:000094','9781668264164'],['wrk:000093','9781982115449'],['wrk:000121','9781668264201'],['wrk:000183','9781668208786'],['wrk:000118','9781982136055']]){const rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.match(html,/Standalone editions/);assert.ok(html.includes(isbn));assert.equal(row.standalonePublications.filter(p=>p.isbn===isbn).length,1);assert.ok(row.editionIds.some(e=>run(`DB.editions.find(e=>e.id===${JSON.stringify(e)})`).isbn===isbn));}}
 assert.equal(run('B.length'),96);assert.equal(run("media(S.find(s=>s.canonicalId==='wrk:000094')).image"),run("MEDIA.books['Different Seasons'].en.image"));
});
