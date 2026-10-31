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
 const {db,patch}=generateMainCompletion();assert.equal(db.books.length,96);assert.equal(db.films.length,111);
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
 const misery=run("detailContent(B.find(r=>r.canonicalId==='wrk:000021'))");assert.match(misery,/2016-01-05/);assert.match(misery,/9781501143106/);assert.equal(run("media(B.find(r=>r.canonicalId==='wrk:000021')).image"),run("MEDIA.books.Misery.en.image"));assert.equal(run('DB.editions.length'),190);
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

test('Sometimes screen family connects the original main film to both later productions without false story links',()=>{
 run("tab='films';lang='en'");const original=run("detailContent(F.find(f=>f.canonicalId==='adp:000071'))");assert.match(original,/Sometimes They Come Back\.\.\. Again/);assert.match(original,/Sometimes They Come Back\.\.\. for More/);for(const id of ['adp:000110','adp:000111']){const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/Sometimes They Come Back film series/);assert.match(html,/Sources & context/);assert.doesNotMatch(html,/data-next="stories"/);}
});

test('Shining, Doctor Sleep and Misery main details link to their literary character and place pages',()=>{
 run("tab='books';lang='en'");for(const [work,targets]of [['wrk:000005',['chr:000013','chr:000014','chr:000015','loc:000006']],['wrk:000051',['chr:000013','chr:000016']],['wrk:000021',['chr:000017','chr:000018']]]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(work)}))`);for(const id of targets)assert.ok(html.includes('entity='+encodeURIComponent(id)));}
});

test('Reviewed core film introductions reach the main site with optional sources and unchanged existing posters',()=>{
 run("tab='films';lang='en'");for(const e of require('../data/completion-b/review.json').enrichments.filter(e=>e.subject.type==='adaptation')){const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(e.subject.id)}))`);assert.ok(html.includes(e.value.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);assert.doesNotMatch(html,/A film in The Kingverse|Source relationships and production uncertainties/);}
 const poster=run("MEDIA.films['Misery|1990']");assert.equal(run("media(F.find(f=>f.canonicalId==='adp:000032')).image"),poster.image);
});

test('All fourteen Everything’s Eventual stories have shared canonical introductions across every main collection view',()=>{
 run("tab='stories';lang='en'");for(let i=150;i<=163;i++){const id='wrk:'+String(i).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){assert.ok(row.summary.en.length>60);const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}}
 const story=run("S.find(s=>s.canonicalId==='wrk:000156').summary.en"),collection=run("B.find(b=>b.canonicalId==='col:000008').summary.en");assert.notEqual(story,collection);assert.doesNotMatch(story,/Dinky Earnshaw/);
});

test('Fifteen Bazaar story introductions appear on main details while poem and work identities stay distinct',()=>{
 run("tab='stories';lang='en'");const ids=[198,199,200,201,202,203,204,205,206,207,208,211,212,214,215].map(n=>'wrk:'+String(n).padStart(6,'0'));for(const id of ids){const rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}}
 assert.match(run("S.find(s=>s.canonicalId==='wrk:000204').summary.en"),/narrative poem/);assert.doesNotMatch(run("S.find(s=>s.canonicalId==='wrk:000199').summary.en"),/dies|died|heart attack/);
});

test('Hearts story introductions and recurring-character links appear on main pages without confusing the same-title collection',()=>{
 run("tab='stories';lang='en'");for(let i=145;i<=149;i++){const id='wrk:'+String(i).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`),html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.ok(row);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Hearts in Atlantis/);if(i!==147)assert.match(html,/entity=chr%3A0000(19|20|21)/);}
 assert.notEqual(run("S.find(s=>s.canonicalId==='wrk:000146').summary.en"),run("B.find(b=>b.canonicalId==='col:000007').summary.en"));
});

test('All twelve You Like It Darker stories have reading introductions and retain the existing Cujo continuation link',()=>{
 run("tab='stories';lang='en'");for(const n of [186,187,188,189,190,191,192,193,194,195,196,197]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`),html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.ok(row);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/You Like It Darker/);}
 const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000195'))");assert.match(html,/sequel to Cujo/);assert.doesNotMatch(run("S.find(s=>s.canonicalId==='wrk:000195').summary.en"),/Vic|Tad|Donna/);
});

test('Ten Just After Sunset introductions reach existing main story views without giving away the central reveals',()=>{
 run("tab='stories';lang='en'");for(const n of [164,165,166,167,168,169,170,171,175,176]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`),html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.ok(row);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Just After Sunset/);assert.match(html,/Sources & context/);}
 assert.doesNotMatch(run("S.find(s=>s.canonicalId==='wrk:000164').summary.en"),/ghost|dead|afterlife/i);assert.doesNotMatch(run("S.find(s=>s.canonicalId==='wrk:000170').summary.en"),/atomic|nuclear|bomb/i);
});

test('Skeleton Crew story introductions and two dated editions appear without replacing existing collection covers',()=>{
 run("tab='stories';lang='en'");for(const n of [96,97,98,99,100,101,102,105,115]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`),html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.ok(row);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Skeleton Crew/);}
 run("tab='books'");const html=run("detailContent(B.find(b=>b.canonicalId==='col:000004'))");for(const s of ['9781501143502','2016-12-06','9781668207741','2025-02-25','Media Tie-In Trade Paperback'])assert.ok(html.includes(s));assert.equal(run("media(B.find(b=>b.canonicalId==='col:000004')).image"),run("MEDIA.books['Skeleton Crew'].en.image"));
});

test('Remake introductions use the correct cast and year on main pages without transferring character outcomes',()=>{
 run("tab='films';lang='en'");for(const [id,cast]of [['adp:000004','Sissy Spacek'],['adp:000057','Angela Bettis'],['adp:000083','Chloë Grace Moretz'],['adp:000068','David Soul'],['adp:000069','Rob Lowe'],['adp:000072','Ruby Dee'],['adp:000073','Whoopi Goldberg']]){const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`);assert.ok(html.includes(cast));assert.doesNotMatch(run(`F.find(f=>f.canonicalId===${JSON.stringify(id)}).summary.en`),/survives|ending|massacre|Randall Flagg/);}
 assert.doesNotMatch(run("F.find(f=>f.canonicalId==='adp:000065').summary.en"),/David Drayton|Thomas Jane|Billy/);
});

test('Further film introductions keep remake casts and their own opening premises on the main site',()=>{
 run("tab='films';lang='en'");const get=id=>run(`F.find(f=>f.canonicalId===${JSON.stringify(id)}).summary.en`);assert.match(get('adp:000019'),/Drew Barrymore/);assert.match(get('adp:000020'),/Ryan Kiera Armstrong/);assert.doesNotMatch(get('adp:000019'),/Zac Efron/);assert.match(get('adp:000041'),/2019.*Arnold Schwarzenegger|Arnold Schwarzenegger/s);assert.doesNotMatch(get('adp:000041'),/daughter|month|billion|2025/);assert.match(get('adp:000042'),/Edgar Wright.*2025/);assert.match(get('adp:000070'),/Steven Weber/);assert.doesNotMatch(get('adp:000070'),/Jack Nicholson/);assert.match(get('adp:000078'),/Anthony Michael Hall.*six-year/);assert.doesNotMatch(get('adp:000024'),/Ted Brautigan/);
});

test('Sixteen Nightmares introductions reach the main story pages with collection context and optional sources',()=>{
 run("tab='stories';lang='en'");for(const n of [122,123,124,128,129,130,131,133,134,135,138,139,141,142,143,144]){const id='wrk:'+String(n).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Nightmares/);assert.match(html,/Sources & context/);}}
});

test('Anthology main details navigate to each adapted story and expose the film from its story',()=>{
 run("tab='films';lang='en'");const tv=run("detailContent(F.find(f=>f.canonicalId==='adp:000067'))"),movie=run("detailContent(F.find(f=>f.canonicalId==='adp:000094'))");for(const n of [79,142,123,138,158,140,150,132]){const id='wrk:'+String(n).padStart(6,'0'),title=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)} )['Engelse verhaalnaam']`);assert.ok(tv.includes(title.replaceAll('&','&amp;').replaceAll("'",'&#39;')),title);}assert.match(movie,/The Cat from Hell/);
 run("tab='stories';lang='en'");assert.match(run("detailContent(S.find(s=>s.canonicalId==='wrk:000172'))"),/Tales from the Darkside/);assert.match(run("detailContent(S.find(s=>s.canonicalId==='wrk:000079'))"),/Nightmares/);
});

test('Twenty additional short-work introductions reach every existing main story view',()=>{
 run("tab='stories';lang='en'");for(const n of [216,217,219,220,222,223,224,225,226,227,229,230,232,233,234,235,237,238,240,241]){const id='wrk:'+String(n).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length,id);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}}
 assert.match(run("S.find(s=>s.canonicalId==='wrk:000216').summary.en"),/Stewart O/);assert.match(run("S.find(s=>s.canonicalId==='wrk:000225').summary.en"),/Joe Hill/);assert.match(run("S.find(s=>s.canonicalId==='wrk:000240').summary.en"),/Richard Matheson/);
});

test('Five English reissues appear on the main book pages without changing original years or covers',()=>{
 run("tab='books';lang='en'");for(const [work,isbn,date]of [['wrk:000001','9781451694918','2012-11-06'],['wrk:000002','9781501192296','2018-04-17'],['wrk:000003','9781984898104','2018-12-31'],['wrk:000005','9780345806789','2013-08-27'],['wrk:000007','9780307947307','2012-08-07']]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(work)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));}
 assert.equal(run("B.find(b=>b.canonicalId==='wrk:000001').Jaar"),1984);assert.equal(run("B.find(b=>b.canonicalId==='wrk:000003').Jaar"),1974);assert.equal(run("media(B.find(b=>b.canonicalId==='wrk:000005')).image"),run("MEDIA.books['The Shining'].en.image"));
});

test('Short-work context links are visible from main story and novel details',()=>{
 run("tab='stories';lang='en'");for(const [work,label]of [['wrk:000217','Overlook Hotel'],['wrk:000229','Duma Key'],['wrk:000234','The Tommyknockers'],['wrk:000237','Wolves of the Calla']])assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(work)}))`),new RegExp(label));run("tab='books';lang='en'");assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000046'))"),/Memory/);assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000005'))"),/Before the Play/);
});

test('Three further Scribner paperbacks show correct edition metadata on existing main book pages',()=>{
 run("tab='books';lang='en'");for(const [work,isbn,date]of [['wrk:000009','9781668094754','2025-08-05'],['wrk:000010','9781501192319','2018-12-11'],['wrk:000015','9781668075784','2024-09-03']]){const row=run(`B.find(b=>b.canonicalId===${JSON.stringify(work)})`),html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(work)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));assert.match(html,/Scribner/);assert.notEqual(row.Jaar,+date.slice(0,4));}
});

test('Six bibliographic short-work introductions are readable without claiming an unavailable plot',()=>{
 run("tab='stories';lang='en'");for(const n of [218,221,228,231,236,239]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`),html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.ok(row.summary.en.length>60);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}assert.match(run("S.find(s=>s.canonicalId==='wrk:000221').summary.en"),/May 15, 2026/);assert.match(run("S.find(s=>s.canonicalId==='wrk:000239').summary.en"),/Ploughshares/);
});

test('Reader pages keep quality notes inside the optional sources disclosure in both languages',()=>{
 for(const lang of ['en','nl']){run(`lang=${JSON.stringify(lang)};tab='stories'`);const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000225'))"),visible=html.replace(/<details>[\s\S]*?<\/details>/g,'');assert.doesNotMatch(visible,/Date in source record|Datum in bronregistratie|A collection date|Een datum bij een bundeluitgave|No collection relationship|Geen bundelrelatie/);assert.match(html,lang==='en'?/A collection date/:/Een datum bij een bundeluitgave/);assert.match(visible,/In the Tall Grass|Het hoge gras|Het Hoge Gras/);}
 run("lang='en';tab='films'");const old=run("detailContent(F.find(f=>f.imdb))"),visible=old.replace(/<details>[\s\S]*?<\/details>/g,'');assert.doesNotMatch(visible,/Cached observation|Rating not yet verified|not a live rating/);assert.match(old,/not a live rating/);assert.match(old,/<details><summary>Sources &amp; context|<details><summary>Sources & context/);
 const stub=run("detailContent(F.find(f=>!f.director&&!f.showrunner&&!media(f)?.director))");assert.doesNotMatch(stub.replace(/<details>[\s\S]*?<\/details>/g,''),/Not yet verified/);
});

test('Five newly connected screen productions appear from their main literary pages',()=>{
 for(const[group,work,label]of [['stories','wrk:000225','In the Tall Grass'],['stories','wrk:000183','The Life of Chuck'],['books','wrk:000008','The Long Walk'],['stories','wrk:000128','Quicksilver Highway'],['books','wrk:000018','Thinner']]){run(`lang='en';tab=${JSON.stringify(group)}`);const html=run(`detailContent(${group==='books'?'B':'S'}.find(w=>w.canonicalId===${JSON.stringify(work)}))`);assert.match(html,new RegExp(label));assert.match(html,/Explore connections/);}
 run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000091'))"),/Chattery Teeth/);assert.doesNotMatch(run("detailContent(F.find(f=>f.canonicalId==='adp:000049'))"),/The Eyes of the Dragon/);
});

test('Four core screen adaptations navigate to the precise novel or novella on main pages',()=>{
 for(const[group,id,label]of [['books','wrk:000031','The Green Mile'],['books','wrk:000005','The Shining'],['stories','wrk:000118','The Langoliers'],['stories','wrk:000177','1922']]){run(`lang='en';tab=${JSON.stringify(group)}`);const html=run(`detailContent(${group==='books'?'B':'S'}.find(r=>r.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(label));assert.match(html,/Explore connections/);}
 run("tab='films';lang='en'");const l=run("detailContent(F.find(f=>f.canonicalId==='adp:000063'))"),n=run("detailContent(F.find(f=>f.canonicalId==='adp:000051'))");assert.match(l,/novella collected in Four Past Midnight/);assert.match(n,/novella collected in Full Dark, No Stars/);
});

test('Shawshank reading paths and two Night Shift introductions reach main story pages',()=>{
 run("tab='stories';lang='en'");const s=run("detailContent(S.find(s=>s.canonicalId==='wrk:000092'))");assert.match(s,/entity=chr%3A000022/);assert.match(s,/entity=loc%3A000007/);assert.match(s,/The Shawshank Redemption/);for(const n of [72,75]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(row.summary.en.length>80);assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`),/Night Shift/);}run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000045'))"),/novella collected in Different Seasons/);
});

test('Four further AFI-confirmed films link back from main books and novella',()=>{
 for(const[group,id,label]of [['books','wrk:000015','Christine'],['stories','wrk:000093','Apt Pupil'],['books','wrk:000024','The Dark Half'],['books','wrk:000028','Dolores Claiborne']]){run(`lang='en';tab=${JSON.stringify(group)}`);const html=run(`detailContent(${group==='books'?'B':'S'}.find(w=>w.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(label));assert.match(html,/Explore connections/);}
 run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000002'))"),/novella of the same name, collected in Different Seasons/);
});

test('Secret Window and Graveyard Shift point to individual stories while new novel links stay navigable',()=>{
 run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000044'))"),/Secret Window, Secret Garden, collected in Four Past Midnight/);assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000022'))"),/short story collected in Night Shift/);run("tab='stories';lang='en'");assert.match(run("detailContent(S.find(s=>s.canonicalId==='wrk:000119'))"),/Secret Window adapts/);run("tab='books';lang='en'");for(const id of ['wrk:000026','wrk:000037'])assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),/Explore connections/);
});

test('Both Running Man films share the existing novel while retaining distinct film pages',()=>{
 run("tab='books';lang='en'");const r=run("B.find(b=>b.canonicalId==='wrk:000013')"),links=r.connected.filter(c=>c.target.kind==='films'&&c.predicate==='adaptation_of');assert.equal(links.length,2);assert.equal(new Set(links.map(c=>c.target.id)).size,2);run("tab='films';lang='en'");const old=run("detailContent(F.find(f=>f.canonicalId==='adp:000041'))"),recent=run("detailContent(F.find(f=>f.canonicalId==='adp:000042'))");assert.match(old,/1987 film adapts/);assert.match(recent,/2025 film offers/);assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000040'))"),/story collected in Everything/);assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000030'))"),/short story The Mangler/);
});

test('Three platform-confirmed adaptations connect film or series to the existing literary page',()=>{
 for(const[group,id,label]of [['books','wrk:000027','Gerald'],['stories','wrk:000182','Harrigan'],['books','wrk:000048','11.22.63']]){run(`tab=${JSON.stringify(group)};lang='en'`);assert.match(run(`detailContent(${group==='books'?'B':'S'}.find(r=>r.canonicalId===${JSON.stringify(id)}))`),new RegExp(label.replaceAll('.','\\.')));}
 run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000054'))"),/novel 11\/22\/63/);
});

test('Cell and both Stand miniseries remain distinct adaptations linked to their existing novels',()=>{
 run("tab='books';lang='en'");const stand=run("B.find(b=>b.canonicalId==='wrk:000007')"),screens=stand.connected.filter(c=>c.target.kind==='films'&&c.predicate==='adaptation_of');assert.equal(screens.length,2);assert.equal(new Set(screens.map(c=>c.target.id)).size,2);assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000043'))"),/film adapts King/);run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000072'))"),/1994 miniseries adapts/);assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000073'))"),/2020 miniseries is another/);
});

test('Three identified collection paperbacks appear on existing main collection pages',()=>{
 run("tab='books';lang='en'");for(const[id,isbn,date]of [['col:000003','9781501143489','2016-03-29'],['col:000005','9781501143496','2016-08-02'],['col:000006','9781501192036','2017-10-31']]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));assert.match(html,/Stories in this collection/);}assert.equal(run('B.length'),96);
});

test('Six further collection editions show publisher metadata without replacing collection contents',()=>{
 run("tab='books';lang='en'");for(const[id,isbn,date]of [['col:000002','9780307947291','2012-08-07'],['col:000008','9781501197963','2018-04-17'],['col:000009','9781501197659','2018-01-23'],['col:000012','9781501197956','2018-03-20'],['col:000013','9781982137977','2020-04-21'],['col:000001','9781668037713','2024-05-21']]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));}const b=run("B.find(b=>b.canonicalId==='col:000001')");assert.equal(run(`S.filter(s=>s.collectionIds?.includes(${JSON.stringify(b.id)})).length`),12);
});

test('Hearts in Atlantis and Full Dark editions retain their collection reading routes',()=>{
 run("tab='books';lang='en'");for(const[id,isbn,date]of [['col:000007','9781501195976','2017-11-14'],['col:000011','9781501197949','2018-06-12']]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));assert.match(html,/Stories in this collection/);}
});

test('Bazaar poem and bonus-story introductions are shared by existing main story details',()=>{
 run("tab='stories';lang='en'");for(const n of [181,210,213]){const id='wrk:'+String(n).padStart(6,'0'),row=run(`S.find(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(row);const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Bazaar of Bad Dreams/);}
});

test('Additional screen reading paths reach the original work on main detail pages',()=>{
 run("tab='films';lang='en'");for(const n of [34,50,10,68,69,74,59,60]){const id='adp:'+String(n).padStart(6,'0'),row=run(`F.find(f=>f.canonicalId===${JSON.stringify(id)})`);assert.ok(row.connected.some(c=>c.predicate==='adaptation_of'&&['books','stories'].includes(c.target.kind)));const html=run(`detailContent(F.find(f=>f.id===${JSON.stringify(row.id)}))`);assert.match(html,/Explore connections/);assert.match(html,/data-exact=/);}
});

test('Night Shift reading introductions appear on every existing main story view',()=>{
 run("tab='stories';lang='en'");for(const n of [76,77,80,81,82,83,86,88,89,90,91]){const id='wrk:'+String(n).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Night Shift/);assert.match(html,/Sources & context/);}}
});

test('Skeleton Crew descriptions reach all existing story detail views with collection navigation',()=>{
 run("tab='stories';lang='en'");for(const n of [103,104,106,107,108,109,110,111,112,113,114,116,117]){const id='wrk:'+String(n).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Skeleton Crew/);}}
});

test('Final reading introductions are visible on the existing main story routes',()=>{
 run("tab='stories';lang='en'");for(const n of [125,126,127,132,136,137,140,172,173,174,209]){const id='wrk:'+String(n).padStart(6,'0'),rows=run(`S.filter(s=>s.canonicalId===${JSON.stringify(id)})`);assert.ok(rows.length);for(const row of rows){const html=run(`detailContent(S.find(s=>s.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(row.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.match(html,/Sources & context/);}}
});

test('New film and series reading paths are available on existing main detail pages',()=>{
 run("tab='films';lang='en'");for(const n of [37,27,61,65,16,78,79,71]){const id='adp:'+String(n).padStart(6,'0'),row=run(`F.find(f=>f.canonicalId===${JSON.stringify(id)})`);assert.ok(row.connected.some(c=>['adaptation_of','inspired_by'].includes(c.predicate)&&['books','stories'].includes(c.target.kind)));const html=run(`detailContent(F.find(f=>f.id===${JSON.stringify(row.id)}))`);assert.match(html,/Explore connections/);assert.match(html,/data-exact=/);}
});
