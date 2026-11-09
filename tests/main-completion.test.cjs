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
 const {db,patch}=generateMainCompletion();assert.equal(db.books.length,98);assert.equal(db.films.length,114);
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
 assert.equal(run('B.filter(r=>r.id.startsWith(\'books:\')).length'),97);
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
 const misery=run("detailContent(B.find(r=>r.canonicalId==='wrk:000021'))");assert.match(misery,/2016-01-05/);assert.match(misery,/9781501143106/);assert.equal(run("media(B.find(r=>r.canonicalId==='wrk:000021')).image"),run("MEDIA.books.Misery.en.image"));assert.equal(run('DB.editions.length'),262);
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
 run("tab='books';lang='en'");assert.equal(run('B.length'),98);assert.equal(run('B.filter(b=>b.summary?.en?.length>40).length'),98);for(const id of run('B.map(b=>b.id)')){const html=run(`detailContent(B.find(b=>b.id===${JSON.stringify(id)}))`);assert.doesNotMatch(html,/A work by Stephen King\. Explore its editions|plot description has not yet been verified/);assert.match(html,/Sources & context/);}
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
 assert.equal(run('B.length'),98);assert.equal(run("media(S.find(s=>s.canonicalId==='wrk:000094')).image"),run("MEDIA.books['Different Seasons'].en.image"));
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
 run("tab='books';lang='en'");for(const[id,isbn,date]of [['col:000003','9781501143489','2016-03-29'],['col:000005','9781501143496','2016-08-02'],['col:000006','9781501192036','2017-10-31']]){const html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));assert.match(html,/Stories in this collection/);}assert.equal(run('B.length'),98);
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

test('Flight or Fright is searchable as a collaboration and links its registered King story',()=>{
 run("tab='books';lang='en'");const row=run("B.find(b=>b.canonicalId==='col:000017')");assert.ok(row);assert.equal(run("B.filter(b=>bn(b)==='Flight or Fright').length"),1);const html=run(`detailContent(B.find(b=>b.id===${JSON.stringify(row.id)}))`);assert.match(html,/Bev Vincent/);assert.match(html,/Editor/);assert.match(html,/The Turbulence Expert/);assert.match(html,/9781587676796/);assert.match(html,/2018-09-04/);assert.ok(row.collaboration);assert.ok(run(`searchText(B.find(b=>b.id===${JSON.stringify(row.id)})).includes('flight or fright')`));
});

test('Tower paperback ISBNs and edition dates appear on all eight existing main book pages',()=>{
 run("tab='books';lang='en'");for(const[w,isbn,date]of [[14,'9781501143519','2016-05-03'],[22,'9781501143533','2016-05-03'],[25,'9781501143540','2016-05-03'],[34,'9781501143557','2016-05-03'],[39,'9780743251624','2005-01-04'],[40,'9780743254557','2005-04-05'],[41,'9780743254564','2005-11-01'],[49,'9781501166228','2016-12-06']]){const id='wrk:'+String(w).padStart(6,'0'),html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));}assert.equal(run('B.length'),98);
});

test('Recent novel hardcovers appear on main pages without replacing coauthor credits',()=>{
 run("tab='books';lang='en'");for(const [w,isbn]of [[52,'9781476754451'],[54,'9781501100079'],[55,'9781501129742'],[56,'9781501163401'],[58,'9781501180989'],[60,'9781982110567'],[62,'9781982173616'],[64,'9781668002179'],[66,'9781668089330']]){const id='wrk:'+String(w).padStart(6,'0');assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),new RegExp(isbn));}assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000056'))"),/Owen King/);
});

test('Classic English edition metadata reaches the original main book routes',()=>{
 run("tab='books';lang='en'");for(const[w,isbn]of [[12,'9781668075777'],[8,'9781668230480'],[13,'9781668208120'],[18,'9781501144523'],[20,'9781501192203'],[24,'9781501144196'],[23,'9781501144288'],[4,'9780345806796']]){const id='wrk:'+String(w).padStart(6,'0');assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),new RegExp(isbn));}
});

test('Nineties editions render on main book pages with digital dates limited to the verified year',()=>{
 run("tab='books';lang='en'");for(const[w,isbn]of [[26,'9781501147418'],[27,'9781501141225'],[28,'9781501141188'],[29,'9781501144226'],[30,'9781501192302'],[31,'9780743210898'],[32,'9781501192234'],[33,'9781501144271']]){const id='wrk:'+String(w).padStart(6,'0'),html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(isbn));if([27,28].includes(w)){assert.match(html,/eBook/);assert.doesNotMatch(html,/2016-01-01/);}}
});

test('Millennium edition metadata appears on the existing ten main literary pages',()=>{
 run("tab='books';lang='en'");for(const[w,isbn]of [[35,'9781501198892'],[36,'9781501157516'],[37,'9781501192227'],[38,'9780743211376'],[43,'9781668234068'],[44,'9780743289412'],[45,'9781416554844'],[46,'9781416552512'],[47,'9781439149034'],[48,'9781451627282']]){const id='wrk:'+String(w).padStart(6,'0');assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),new RegExp(isbn));}
});

test('Hard Case and remaining novels show publisher-identified editions on their original routes',()=>{
 run("tab='books';lang='en'");for(const[w,isbn]of [[11,'9781501192210'],[17,'9781501177224'],[42,'9781789093896'],[50,'9781781162644'],[51,'9781668234051'],[53,'9781476770390'],[59,'9781982102319'],[61,'9781789096491']]){const id='wrk:'+String(w).padStart(6,'0');assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),new RegExp(isbn));}
});

test('Special publication metadata reaches main pages without false comic or children-book authorship',()=>{
 run("tab='books';lang='en'");for(const[w,isbn]of [[68,'9781587672286'],[70,'9780743267533'],[245,'9781534401235'],[246,'9780062644695'],[248,'9780671032647']]){const id='wrk:'+String(w).padStart(6,'0');assert.match(run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`),new RegExp(isbn));}assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000069'))"),/Scott Snyder/);assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000246'))"),/Maurice Sendak/);assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000248'))"),/1999-02/);
});

test('Every current library entry has an identified English edition except the serial and stage project',()=>{
 const bundle=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;const missing=db.books.filter(b=>!bundle.editions.some(e=>e.publicationOf.id===b.canonicalId&&e.language==='en'&&e.identityStatus==='identified'));assert.deepEqual(missing.map(b=>b.canonicalId),['wrk:000249']);assert.equal(db.books.length,98);run("tab='books';lang='en'");assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000067'))"),/9781668233092/);assert.match(run("detailContent(B.find(b=>b.canonicalId==='col:000016'))"),/9780965006439/);assert.match(run("detailContent(B.find(b=>b.canonicalId==='wrk:000244'))"),/Amazon Kindle Single/);
});

test('Core character and setting links are visible on the corresponding main book pages',()=>{
 run("tab='books';lang='en'");for(const[w,labels]of [[3,['Carrie White']],[9,['Johnny Smith']],[4,['Ben Mears']],[31,['John Coffey','Paul Edgecombe','Cold Mountain Penitentiary']],[14,['Gilead']]]){const id='wrk:'+String(w).padStart(6,'0'),html=run(`detailContent(B.find(b=>b.canonicalId===${JSON.stringify(id)}))`);for(const label of labels)assert.ok(html.includes(label));assert.match(html,/explorer\/pilot\//);}
});

test('Turbulence uses its verified first-publication year instead of its later collection year',()=>{
 const row=generateMainCompletion().db.stories.find(s=>s.canonicalId==='wrk:000193');assert.equal(row.Jaar,2018);assert.equal(row.firstPublication.date,'2018-09');assert.equal(row.firstPublication.kind,'first-publication');assert.equal(row.collectionIds.length,2);run("tab='stories';lang='en'");const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000193'))");assert.match(html,/2018/);assert.match(html,/cemeterydance\.com/);
});

test('Dutch On Writing edition is searchable in either language and retains both translation credits',()=>{
 run("tab='books';lang='en';$('search').value='Over leven en schrijven';render()");assert.match(element('results').innerHTML,/On Writing/);
 assert.equal(run("B.filter(r=>r.canonicalId==='wrk:000242').length"),1);assert.equal(run('B.length'),98);
 const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000242'))");for(const text of ['Over leven en schrijven','9789049205218','2024-11-07','Hugo Kuipers, Nienke Kuipers'])assert.ok(html.includes(text),text);
 run("lang='nl'");assert.equal(run("title(B.find(r=>r.canonicalId==='wrk:000242'),'books')"),'Over leven en schrijven');
 const p=require('../explorer/pilot/data/edn-000256/index.json');assert.equal(p.parent.id,'wrk:000242');assert.equal(p.node.data.language,'nl');assert.equal(p.node.data.isbn13,'9789049205218');assert.deepEqual(p.sections.creators.items.map(c=>c.target.label),['Hugo Kuipers','Nienke Kuipers']);
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion());const e=b.editions.find(e=>e.id==='edn:000256');assert.equal(b.editions.filter(e=>e.isbn13==='9789049205218').length,1);assert.ok(b.claims.some(c=>c.subject.id===e.id&&c.fieldPath==='/language'&&c.value==='en'&&!c.selected&&c.status==='disputed'));run("lang='en';$('search').value=''");
});

test('Dutch paperbacks are separate from the existing audiobooks in both catalogs',()=>{
 const {db}=generateMainCompletion();
 for(const[n,old,owner,isbn,names,date]of [[257,3,2,'9789021064819',['Hugo Kuipers','Nienke Kuipers'],'2026-09-08'],[258,22,23,'9789021037233',['Margot Bakker'],'2023-01-31'],[259,26,27,'9789021026183',['Lucien Duzee'],'2020-04']]){const id='edn:'+String(n).padStart(6,'0'),audioId='edn:'+String(old).padStart(6,'0'),work='wrk:'+String(owner).padStart(6,'0'),e=db.editions.find(e=>e.canonicalId===id),audio=db.editions.find(e=>e.canonicalId===audioId),native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(e.format,'Paperback');assert.equal(audio.format,'Luisterboek');assert.notEqual(e.isbn,audio.isbn);assert.equal(e.isbn,isbn);assert.equal(e.publicationDate.value,date);assert.deepEqual(e.translators,names);assert.equal(native.parent.id,work);assert.equal(native.node.data.format,'Paperback');assert.equal(native.node.data.publicationDate.value,date);assert.deepEqual(native.sections.creators.items.filter(c=>c.role==='translator').map(c=>c.target.label),names);const row=db.books.find(r=>r.canonicalId===work);assert.ok(row.editionIds.includes(e.id)&&row.editionIds.includes(audio.id));assert.equal(db.books.filter(r=>r.canonicalId===work).length,1);}
 assert.equal(require('../explorer/pilot/data/edn-000259/index.json').node.data.publicationDate.precision,'month');assert.equal(db.books.length,98);assert.equal(db.editions.length,268);
});

test('Dutch Danse Macabre is an edition of the nonfiction work and Sunset credits are deduplicated',()=>{
 const {db}=generateMainCompletion(),e=db.editions.find(e=>e.canonicalId==='edn:000260');assert.equal(e.isbn,'9789062138449');assert.equal(e.publisher,'Loeb');assert.equal(e.publicationDate.value,'1986');assert.equal(e.publicationDate.precision,'year');assert.deepEqual(e.translators,['Mariëlla de Kuyper']);
 const p=require('../explorer/pilot/data/edn-000260/index.json');assert.equal(p.parent.id,'wrk:000243');assert.equal(p.node.data.language,'nl');assert.equal(p.node.data.publicationDate.value,'1986');assert.equal(db.books.filter(b=>b.canonicalId==='wrk:000243').length,1);assert.equal(db.books.find(b=>b.canonicalId==='wrk:000243').Jaar,1981);
 const sunset=db.editions.find(e=>e.canonicalId==='edn:000062');assert.deepEqual(sunset.translators,['Hugo Kuipers']);assert.deepEqual(require('../explorer/pilot/data/edn-000062/index.json').sections.creators.items.map(c=>c.target.label),['Hugo Kuipers']);
 run("tab='books';lang='en'");const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000243'))");assert.match(html,/9789062138449/);assert.match(html,/1986/);
});

test('Dutch Gwendy omnibus reuses three works and exposes the correct collection contents',()=>{
 const {db}=generateMainCompletion(),r=db.books.find(b=>b.canonicalId==='col:000018');assert.ok(r);assert.equal(r['Engelse titel'],'Gwendy-trilogie');assert.equal(r.Jaar,2024);assert.deepEqual(r.containsWorks.map(w=>db.books.find(b=>b.id===w.id).canonicalId),['wrk:000057','wrk:000250','wrk:000063']);
 run("tab='books';lang='en'");const html=run("detailContent(B.find(b=>b.canonicalId==='col:000018'))");for(const text of ['Contains the works','9789049204815','9789402324259','2024-09-11','2024-09-10','Nathaly Schrijnder','Annemarie Lodewijk'])assert.ok(html.includes(text),text);assert.equal(db.books.filter(b=>b.canonicalId==='wrk:000250').length,1);assert.doesNotMatch(html,/Stories in this collection/);assert.equal(db.stories.filter(s=>s.collectionIds?.includes(r.id)).length,0);
 const p=require('../explorer/pilot/data/col-000018/index.json');assert.equal(p.node.data.collectionKind,'collected-novels');assert.deepEqual(p.sections.memberships.items.map(m=>[m.target.id,m.order]),[['wrk:000057',1],['wrk:000250',2],['wrk:000063',3]]);assert.equal(require('../explorer/pilot/data/edn-000261/index.json').parent.id,'col:000018');assert.equal(require('../explorer/pilot/data/edn-000262/index.json').parent.id,'col:000018');assert.ok(p.creators.every(c=>c.role==='contributor'));
 const bundle=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion());assert.equal(bundle.works.length,250);assert.equal(bundle.editions.length,268);assert.equal(bundle.credits.filter(c=>c.subject.id==='wrk:000250'&&c.personId==='per:000001'&&['author','coauthor'].includes(c.role)).length,0);
});

test('Carrie audiobook and reconciled Danse credit preserve existing identities',()=>{
 const {db}=generateMainCompletion(),c=db.editions.find(e=>e.canonicalId==='edn:000005'),d=db.editions.find(e=>e.canonicalId==='edn:000260');assert.equal(c.isbn,'9789024591350');assert.equal(c.publisher,'Luitingh-Sijthoff');assert.equal(c.format,'Luisterboek');assert.equal(c.publicationDate.value,'2023-10-25');assert.equal(db.books.find(b=>b.canonicalId==='wrk:000003').Jaar,1974);assert.deepEqual(d.translators,['Mariëlla de Kuyper']);
 const p=require('../explorer/pilot/data/edn-000260/index.json');assert.equal(p.sections.creators.items[0].target.id,'per:000032');assert.equal(p.sections.creators.items[0].creditedAs,'Mariëlla de Kuyper');const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion());assert.equal(b.people.filter(p=>p.name==='Mariëlla Snel').length,1);assert.equal(b.people.filter(p=>p.name==='Mariëlla de Kuyper').length,0);assert.ok(b.people.find(p=>p.id==='per:000032').aliases.some(a=>a.value==='Mariëlla de Kuyper'));assert.equal(b.editions.length,268);
 const bad=structuredClone(b);bad.editions.find(e=>e.id==='edn:000260').translationCredits=[];assert.ok(require('../scripts/completion_b.cjs').validateCompletionB(bad).some(e=>e.code==='b-editorial-evidence'));
});

test('Core literary character profiles reach both catalogs without new work or screen identities',()=>{
 const {db}=generateMainCompletion(),b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion());assert.equal(b.characters.length,44);assert.equal(b.connections.length,250);assert.equal(b.works.length,250);assert.equal(b.adaptations.length,114);
 const expected={19:['Bill Denbrough','Ben Hanscom','Beverly Marsh','Mike Hanlon','Richie Tozier','Eddie Kaspbrak','Stanley Uris'],10:['Charlie McGee','Andy McGee'],16:['Louis Creed','Rachel Creed'],12:['Cujo','Donna Trenton','Vic Trenton','Tad Trenton'],52:['Bill Hodges','Jerome Robinson'],54:['Bill Hodges','Jerome Robinson'],55:['Bill Hodges','Jerome Robinson']};
 for(const[n,names]of Object.entries(expected)){const id='wrk:'+String(n).padStart(6,'0'),row=db.books.find(r=>r.canonicalId===id);for(const name of names){const c=b.characters.find(c=>c.name===name);assert.ok(c,name);assert.equal(b.characters.filter(c=>c.name===name).length,1);assert.ok(row.connected.some(link=>link.target.id===c.id));const p=require('../explorer/pilot/data/'+c.id.replace(':','-')+'/index.json');assert.equal(p.node.spoiler.level,'none');assert.ok(p.connections.some(e=>e.to.id===id||e.from.id===id));assert.ok(p.node.description.length>30);}}
 for(const c of b.characters.filter(c=>Number(c.id.slice(4))>=28)){assert.deepEqual(c.aliases,[]);assert.equal(c.spoiler.level,'none');assert.doesNotMatch(c.summary.en,/dies|death|suicide|killed|murdered|Ludlow/);}
});

test('Dated screen development projects stay separate from released adaptations and retain source history',()=>{
 const {db}=generateMainCompletion(),base=require('../scripts/build_completion.cjs').loadCompletion(),{extendCompletionB,validateCompletionB}=require('../scripts/completion_b.cjs'),b=extendCompletionB(base),reg=require('../data/completion-b/register.json');
 for(const[n,title,work,format]of [[112,'Cujo','wrk:000012','film'],[113,'The Jaunt','wrk:000101','tv-series'],[114,'The Tommyknockers','wrk:000023','film']]){const id='adp:'+String(n).padStart(6,'0'),a=b.adaptations.find(a=>a.id===id),row=db.films.find(f=>f.canonicalId===id),p=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(a.title,title);assert.equal(a.format,format);assert.equal(a.releaseYear,null);assert.deepEqual(a.releaseEvents,[]);assert.equal(a.statusHistory.at(-1).status,'development');assert.equal(a.statusHistory.at(-1).asOf,'2026-02-19');assert.equal(row.Jaar,null);assert.ok(row.sourceWorks.some(s=>(db.books.concat(db.stories).find(r=>r.id===s.id))?.canonicalId===work));assert.ok(p.connections.some(c=>c.predicate==='adaptation_of'&&c.to.id===work));assert.ok(!p.media?.remoteArtwork);}
 assert.equal(b.adaptations.find(a=>a.id==='adp:000011').releaseYear,1983);assert.equal(b.adaptations.find(a=>a.id==='adp:000074').releaseYear,1993);
 const oldId=reg.allocations['claim/film-intro-adp-000052'],old=b.claims.find(c=>c.id===oldId);assert.equal(old.selected,false);assert.match(old.value.en,/Lynne Ramsay/);const current=db.films.find(f=>f.canonicalId==='adp:000052');assert.equal(current.director,'JT Mollner');assert.equal(current.studio,'Lionsgate');assert.equal(current.distributor,null);assert.equal(current.status,'development');assert.match(current.summary.en,/July 2025/);assert.equal(b.adaptations.filter(a=>a.title==='The Girl Who Loved Tom Gordon').length,1);assert.equal(b.adaptations.find(a=>a.id==='adp:000052').makerObservations[0].creditText,'Lynne Ramsay');
 const bad=structuredClone(b);bad.claims.find(c=>c.id===oldId).selected=true;assert.ok(validateCompletionB(bad).some(e=>e.code==='b-editorial-evidence'));assert.equal(b.works.length,250);assert.equal(db.films.length,114);
});

test('Earlier story publications and separate Finn digital editions reach both sites without duplicate works',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date]of [[166,'2003-06-23'],[187,'2020-03'],[190,'2022-05-25'],[194,'2018-05-17'],[199,'2009-11-01'],[201,'2011-10-27'],[221,'2026-05-15']]){const id='wrk:'+String(n).padStart(6,'0'),events=b.publicationEvents.filter(p=>p.subject.id===id&&p.eventType==='first-publication');assert.equal(events.length,1);assert.equal(events[0].date.value,date);const rows=db.stories.filter(s=>s.canonicalId===id);assert.ok(rows.length);for(const row of rows){assert.equal(row.Jaar,+date.slice(0,4));assert.equal(row.firstPublication.date,date);}run("tab='stories';lang='en'");assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`),new RegExp(date));const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json');assert.ok(native.sections.publications.items.some(p=>p.date.value===date&&p.eventType==='first-publication'));}
 for(const[n,date]of [[166,'2003-06-30'],[199,'2009-11-09'],[221,'2026-06']])assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:'+String(n).padStart(6,'0')&&p.date.value===date&&p.eventType==='source-reported-release'));
 const editions=b.editions.filter(e=>e.publicationOf.id==='wrk:000190');assert.deepEqual(editions.map(e=>[e.isbn13,e.format]),[['9781094444963','Ebook'],['9781094444970','Audiobook']]);assert.ok(editions.every(e=>e.publicationDate.value==='2022-05-25'&&e.language==='en'));assert.ok(!b.artworks.some(a=>editions.some(e=>e.id===a.editionId)));assert.equal(b.works.length,250);assert.equal(b.collectionMemberships.filter(m=>m.workId==='wrk:000190'&&m.collectionId==='col:000001').length,1);assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000194'&&p.date.value==='2024-05'));
 const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000190'))");assert.match(html,/9781094444963/);assert.match(html,/9781094444970/);assert.match(html,/Everand Originals/);assert.match(html,/Audiobook/);assert.match(html,/You Like It Darker/);
});

test('Earlier Sunset magazine and anthology publications retain issue precision and collection history',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,label]of [[164,'2006','Playboy'],[165,'2007-07','Esquire'],[167,'2003-12','Esquire'],[168,'2003','Borderlands 5'],[175,'2007','Fall 2007'],[208,'2011-04','online publication']]){let id='wrk:'+String(n).padStart(6,'0'),p=b.publicationEvents.filter(p=>p.subject.id===id&&p.eventType==='first-publication');assert.equal(p.length,1);assert.equal(p[0].date.value,date);const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json');assert.ok(native.sections.publications.items.some(p=>p.eventType==='first-publication'&&(p.reportedTitle.includes(label)||p.publisher.includes(label))));const rows=db.stories.filter(s=>s.canonicalId===id);assert.ok(rows.every(s=>s.Jaar===+date.slice(0,4)));run("tab='stories';lang='en'");assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`),new RegExp(date));assert.ok(b.publicationEvents.some(p=>p.subject.id===id&&p.eventType==='source-reported-release'&&p.date.value===([208].includes(n)?'2015-11':'2008-11')));}
 assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000164'&&p.date.value==='2006-12'));assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000208'&&p.date.value==='2011-05'));assert.ok(!b.publicationEvents.some(p=>['wrk:000164','wrk:000168','wrk:000175','wrk:000208'].includes(p.subject.id)&&p.eventType==='first-publication'&&p.date.precision==='day'));assert.equal(b.works.length,250);assert.equal(db.stories.length,173);
});

test('Publisher story dates and the unfinished Plant ebook stay distinct from original work history',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date]of [[151,'1994-10'],[200,'2012-09'],[203,'2015-03-02']]){const id='wrk:'+String(n).padStart(6,'0');assert.equal(b.publicationEvents.filter(p=>p.subject.id===id&&p.eventType==='first-publication').length,1);assert.equal(db.stories.find(s=>s.canonicalId===id).firstPublication.date,date);run("tab='stories';lang='en'");assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`),new RegExp(date));}
 const e=b.editions.find(e=>e.publicationOf.id==='wrk:000247');assert.equal(e.id,'edn:000265');assert.equal(e.language,'en');assert.equal(e.publisher,'StephenKing.com');assert.equal(e.publicationDate.value,'2000');assert.equal(e.publicationDate.precision,'year');assert.equal(e.isbn13,null);assert.match(e.format,/unfinished/);assert.equal(b.publicationEvents.filter(p=>p.subject.id==='wrk:000247'&&p.eventType==='first-publication').length,0);assert.ok(!b.artworks.some(a=>a.editionId===e.id));run("tab='books';lang='en'");const html=run("detailContent(B.find(s=>s.canonicalId==='wrk:000247'))");assert.match(html,/six installments, unfinished/);assert.match(html,/StephenKing.com/);assert.equal(require('../explorer/pilot/data/edn-000265/index.json').parent.id,'wrk:000247');assert.equal(b.works.length,250);
});

test('Coverless standalone story editions retain the available containing collection cover',()=>{
 const p=require('../scripts/completion_pilot.cjs').completionPilot().defaultProjection,choice=p.mediaChoices['wrk:000190'];assert.equal(choice.collectionId,'col:000001');assert.equal(choice.remoteArtwork,true);assert.ok(choice.collectionHref.includes('col%3A000001'));assert.equal(p.nodes.filter(n=>n.type==='edition'&&n.data.publicationOf.id==='wrk:000190').length,2);
 const finn=require('../explorer/pilot/data/wrk-000190/index.json'),collection=require('../explorer/pilot/data/col-000001/index.json');assert.equal(finn.media.src,collection.media.src);assert.equal(finn.media.collectionLabel,'You Like It Darker');assert.equal(require('../explorer/pilot/data/wrk-000190/details.json').sections.editions.total,2);
});

test('Verified Cavalier appearances render on both sites without false first-publication claims',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,title]of [[73,'1970-10','Graveyard Shift'],[78,'1973-10','Gray Matter'],[74,'1974-08','Night Surf'],[84,'1975-05','The Lawnmower Man'],[79,'1972-09','Battleground'],[76,'1972-12','The Mangler'],[80,'1973-06','Trucks'],[81,'1974-03','Sometimes They Come Back']]){const id='wrk:'+String(n).padStart(6,'0'),p=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date);assert.equal(p.length,1);assert.equal(p[0].eventType,'source-reported-release');assert.equal(p[0].date.precision,'month');assert.equal(p[0].publisher,'Cavalier');assert.match(p[0].reportedTitle,new RegExp(title));assert.ok(!b.publicationEvents.some(p=>p.subject.id===id&&p.eventType==='first-publication'));assert.ok(b.publicationEvents.some(p=>p.subject.id===id&&p.date.value==='1978-02'));const row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.publications.find(p=>p.reportedDate===date).canonicalId,p[0].id);run("tab='stories';lang='en'");const html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/<details><summary>Publication history<\/summary>/);assert.match(html,new RegExp(date));assert.match(html,/Cavalier/);assert.doesNotMatch(html,/First publication/);const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json');assert.ok(native.sections.publications.items.some(p=>p.id===row.publications[0].canonicalId));}
 assert.equal(b.works.length,250);assert.equal(b.editions.length,268);assert.equal(db.stories.length,173);assert.equal(b.works.find(w=>w.id==='wrk:000078').originalTitle,'Grey Matter');
 const premium=db.stories.find(s=>s.canonicalId==='wrk:000199');assert.ok(premium.publications.some(p=>p.reportedDate==='2009-11-01'));assert.ok(premium.publications.some(p=>p.reportedDate==='2009-11-09'));
});

test('Six further periodical histories preserve source precision and existing works',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,publisher]of [[102,'1980-12',"Ellery Queen’s Mystery Magazine"],[217,'1982-08','Whispers'],[127,'1982-08','Whispers'],[231,'1978-02','Fantasy & Science Fiction'],[241,'1976-05','Cavalier'],[228,'1978-12','Cavalier']]){const id='wrk:'+String(n).padStart(6,'0'),p=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date);assert.equal(p.length,1);assert.equal(p[0].publisher,publisher);assert.equal(p[0].date.precision,'month');assert.equal(p[0].eventType,'source-reported-release');const row=db.stories.find(s=>s.canonicalId===id);assert.ok(row.publications.some(p=>p.reportedDate===date));run("tab='stories';lang='en'");assert.match(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`),new RegExp(date));assert.ok(require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json').sections.publications.items.some(p=>p.id===row.publications[0].canonicalId));}
 assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000231'&&p.date.value==='1979'));assert.ok(!b.publicationEvents.some(p=>p.subject.id==='wrk:000102'&&p.date.value==='1980-12-01'));assert.equal(b.works.length,250);assert.equal(db.stories.length,173);
});

test('Four sourced contributor introductions reuse people and preserve literary roles on both sites',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,w,name]of [[2,1,'Peter Straub'],[3,56,'Owen King'],[4,250,'Richard Chizmar'],[12,183,'Joe Hill']]){const personId='per:'+String(n).padStart(6,'0'),p=b.people.find(p=>p.id===personId);assert.ok(p.summary.en.length>100);const claim=b.claims.find(c=>c.subject.id===personId&&c.fieldPath==='/summary'&&c.selected);assert.equal(claim.status,'verified');assert.ok(claim.sourceIds.every(id=>/simonandschuster|penguinrandomhouse/.test(b.sources.find(s=>s.id===id).url)));const native=require('../explorer/pilot/data/'+personId.replace(':','-')+'/index.json');assert.equal(native.node.description,p.summary.en);assert.ok(native.node.evidence.some(e=>e.id===claim.id));const rows=db.books.concat(db.stories).filter(row=>row.authors?.some(a=>a.personId===personId));assert.ok(rows.length,name);for(const row of rows){run(`tab=${JSON.stringify(db.books.includes(row)?'books':'stories')};lang='en'`);const group=db.books.includes(row)?'B':'S',html=run(`detailContent(${group}.find(r=>r.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes('entity='+encodeURIComponent(personId)));assert.ok(html.includes(p.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));}}
 assert.equal(db.books.find(r=>r.canonicalId==='wrk:000250').authors.find(a=>a.name==='Richard Chizmar').role,'author');assert.equal(db.books.find(r=>r.canonicalId==='wrk:000250').authors.find(a=>a.name==='Stephen King').role,'foreword');assert.equal(b.works.length,250);assert.equal(b.people.filter(p=>p.name==='Peter Straub').length,1);assert.equal(b.credits.length,require('../scripts/build_completion.cjs').loadCompletion().credits.length+44);
});

test('ONan and Vincent profiles connect existing fiction nonfiction and anthology roles without repetition',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,w,group]of [[8,70,'books'],[8,216,'stories'],[52,17,'books']]){const personId='per:'+String(n).padStart(6,'0'),ownerId=(n===52?'col:':'wrk:')+String(w).padStart(6,'0'),person=b.people.find(p=>p.id===personId),row=db[group].find(r=>r.canonicalId===ownerId);assert.ok(row.authors.some(a=>a.personId===personId));run(`tab=${JSON.stringify(group)};lang='en'`);const html=run(`detailContent(${group==='books'?'B':'S'}.find(r=>r.id===${JSON.stringify(row.id)}))`),text=person.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;');assert.equal(html.split(text).length-1,1);assert.equal(html.split('entity='+encodeURIComponent(personId)).length-1,1);assert.match(html,/Sources & context/);assert.equal(require('../explorer/pilot/data/'+personId.replace(':','-')+'/index.json').node.description,person.summary.en);}
 const invalid=structuredClone(b);invalid.people.find(p=>p.id==='per:000052').unreviewedBiography='unchecked';assert.ok(require('../scripts/completion_b.cjs').validateCompletionB(invalid,require('../scripts/build_completion.cjs').loadCompletion()).some(e=>e.code==='b-unreviewed-field'));
 const vincent=b.credits.filter(c=>c.personId==='per:000052');assert.deepEqual(vincent.map(c=>c.role),['editor','contributor']);assert.ok(!vincent.some(c=>c.role==='coauthor'));assert.ok(vincent[1].scope.includes('afterword'));assert.equal(b.works.length,250);assert.equal(b.people.length,60);assert.equal(db.books.length,98);assert.equal(b.credits.length,require('../scripts/build_completion.cjs').loadCompletion().credits.length+44);
});

test('King and Mellencamp reader profiles preserve pseudonym and musical creator identities',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 assert.equal(b.people.filter(p=>p.name==='Stephen King').length,1);assert.equal(b.people.filter(p=>p.name==='Richard Bachman').length,0);assert.ok(b.people.find(p=>p.id==='per:000001').pseudonyms.includes('Richard Bachman'));
 run("tab='books';lang='en'");const r=db.books.find(r=>r.canonicalId==='wrk:000249'),html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000249'))");assert.equal(r.authors.find(a=>a.personId==='per:000001').role,'librettist');assert.equal(r.authors.find(a=>a.personId==='per:000031').role,'composer');assert.match(html,/Music \/ lyrics/);assert.match(html,/book for the stage/);assert.match(html,/entity=per%3A000031/);assert.match(run("detailContent(B.find(r=>r.canonicalId==='wrk:000003'))"),/Richard Bachman/);
 for(const n of [1,31]){const id='per:'+String(n).padStart(6,'0');assert.equal(require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json').node.description,b.people.find(p=>p.id===id).summary.en);}assert.equal(b.people.length,60);assert.equal(b.works.length,250);
});

test('Editing only a verified introduction renews the Explorer cache version',()=>{
 const model=require('../scripts/completion_pilot.cjs'),build=require('../scripts/build_pilot.cjs'),original=model.completionPilot,baseline=build.generatePilot();
 try{model.completionPilot=(...args)=>{const out=original(...args),p=out.bundle.people.find(p=>p.id==='per:000002'),claim=out.bundle.claims.find(c=>c.subject.id===p.id&&c.fieldPath==='/summary'&&c.selected);p.summary={en:p.summary.en+' Reader profile.'};claim.value=structuredClone(p.summary);return out;};const changed=build.generatePilot();assert.notEqual(changed.report.dataVersion,baseline.report.dataVersion);assert.match(JSON.parse(changed.files.get('explorer/pilot/data/per-000002/index.json')).node.description,/Reader profile\.$/);assert.deepEqual(changed.report.counts,baseline.report.counts);}finally{model.completionPilot=original;}
});

test('Visual-book maker profiles preserve separate American Vampire text art and photography credits',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,w,role]of [[6,69,'author'],[7,69,'illustrator'],[11,71,'photographer'],[30,246,'illustrator']]){const id='per:'+String(n).padStart(6,'0'),person=b.people.find(p=>p.id===id),row=db.books.find(r=>r.canonicalId==='wrk:'+String(w).padStart(6,'0'));assert.equal(row.authors.find(a=>a.personId===id).role,role);run("tab='books';lang='en'");const html=run(`detailContent(B.find(r=>r.id===${JSON.stringify(row.id)}))`);assert.ok(html.includes(person.summary.en.replaceAll('&','&amp;').replaceAll("'",'&#39;')));assert.ok(html.includes('entity='+encodeURIComponent(id)));const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(native.node.description,person.summary.en);assert.ok(native.node.evidence.some(e=>e.fieldPath==='/summary'&&e.status==='verified'));}
 const av=db.books.find(r=>r.canonicalId==='wrk:000069');assert.equal(av.authors.find(a=>a.name==='Rafael Albuquerque').role,'illustrator');assert.match(b.people.find(p=>p.id==='per:000006').summary.en,/separate storyline/);assert.match(b.people.find(p=>p.id==='per:000007').summary.en,/five-issue/);assert.equal(b.people.length,60);assert.equal(b.works.length,250);assert.equal(b.credits.length,require('../scripts/build_completion.cjs').loadCompletion().credits.length+44);
});

test('New Castle Rock routes and the Cujo reference reuse existing literary identities',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const n of [9,121]){const id='wrk:'+String(n).padStart(6,'0'),edges=b.connections.filter(c=>c.from.id===id&&c.to.id==='loc:000005'&&c.predicate==='set_in');assert.equal(edges.length,1);assert.equal(edges[0].certainty,'explicit');assert.equal(edges[0].spoiler.level,'premise');const row=db.books.concat(db.stories).find(r=>r.canonicalId===id),group=db.books.includes(row)?'books':'stories';run(`tab=${JSON.stringify(group)};lang='en'`);assert.match(run(`detailContent(${group==='books'?'B':'S'}.find(r=>r.id===${JSON.stringify(row.id)}))`),/entity=loc%3A000005/);assert.ok(require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json').connections.some(c=>c.target.id==='loc:000005'));}
 const refs=b.connections.filter(c=>c.from.id==='chr:000039'&&c.to.id==='wrk:000121');assert.equal(refs.length,1);assert.equal(refs[0].predicate,'mentioned_in');assert.match(refs[0].explanation.en,/referenced/);assert.ok(db.stories.find(r=>r.canonicalId==='wrk:000121').connected.some(c=>c.target.id==='chr:000039'));assert.equal(require('../explorer/pilot/data/loc-000005/index.json').connections.length,10);assert.equal(b.works.length,250);assert.equal(b.characters.length,44);assert.equal(b.locations.length,9);assert.equal(b.editions.length,268);
});

test('Bag of Bones reaches Derry on both sites without treating universe marketing as another town setting',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,edges=b.connections.filter(c=>c.from.id==='wrk:000035'&&c.to.id==='loc:000004');assert.equal(edges.length,1);assert.equal(edges[0].predicate,'set_in');assert.equal(edges[0].certainty,'explicit');assert.equal(edges[0].spoiler.level,'premise');assert.ok(!b.connections.some(c=>c.from.id==='wrk:000035'&&c.to.id==='loc:000005'));assert.equal(b.locations.filter(l=>l.name==='Derry').length,1);
 run("tab='books';lang='en'");const html=run("detailContent(B.find(r=>r.canonicalId==='wrk:000035'))");assert.match(html,/entity=loc%3A000004/);assert.match(html,/opens in Derry before moving/);assert.ok(require('../explorer/pilot/data/wrk-000035/index.json').connections.some(c=>c.target.id==='loc:000004'));const derry=require('../explorer/pilot/data/loc-000004/index.json');assert.equal(derry.connections.length,4);assert.match(derry.node.description,/Bag of Bones/);
 const review=require('../data/completion-b/review.json'),reg=require('../data/completion-b/register.json'),original=review.records.find(d=>reg.allocations[d.entityType+'/'+d.key]==='loc:000004'),prior=b.claims.find(c=>c.id===reg.allocations['claim/'+original.key+'/summary']);assert.equal(prior.selected,false);assert.deepEqual(prior.value,original.summary);assert.ok(b.claims.some(c=>c.subject.id==='loc:000004'&&c.fieldPath==='/summary'&&c.selected&&c.value.en===derry.node.description));assert.equal(b.locations.length,9);assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Two publisher-identified English editions reach both sites with dates separate from original works',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[isbn,owner,date,format,group]of [['9781982115425','wrk:000121','2018-12-04','Trade Paperback','stories'],['9781439192566','col:000011','2010-11-09','Hardcover','books']]){const matches=b.editions.filter(e=>e.isbn13===isbn);assert.equal(matches.length,1);const e=matches[0];assert.equal(e.publicationOf.id,owner);assert.equal(e.language,'en');assert.equal(e.publisher,'Scribner');assert.equal(e.format,format);assert.equal(e.publicationDate.value,date);assert.equal(e.publicationDate.precision,'day');assert.equal(e.publicationDate.meaning,'edition-publication');assert.equal(e.identityStatus,'identified');assert.ok(!b.artworks.some(a=>a.editionId===e.id));const native=require('../explorer/pilot/data/'+e.id.replace(':','-')+'/index.json');assert.equal(native.parent.id,owner);assert.equal(native.node.data.isbn13,isbn);assert.equal(native.node.data.publicationDate.value,date);assert.ok(b.publicationEvents.some(p=>p.editionId===e.id&&p.eventType==='edition-publication'&&p.subject.id===owner));const row=db[group].find(r=>r.canonicalId===owner);run(`tab=${JSON.stringify(group)};lang='en'`);const html=run(`detailContent(${group==='books'?'B':'S'}.find(r=>r.id===${JSON.stringify(row.id)}))`);assert.match(html,new RegExp(isbn));assert.match(html,new RegExp(date));assert.ok(row.editionIds.some(id=>db.editions.find(e=>e.id===id)?.canonicalId===e.id));}
 assert.equal(require('../explorer/pilot/data/wrk-000121/index.json').media.collectionId,'col:000005');assert.equal(db.stories.find(r=>r.canonicalId==='wrk:000121').Jaar,1990);assert.equal(db.books.find(r=>r.canonicalId==='col:000011').Jaar,2010);assert.equal(b.editions.length,268);assert.equal(b.works.length,250);assert.equal(b.collections.length,18);
});

test('Edition-specific collection membership is qualified on both sites without inferring ISBN scope',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,story=db.stories.find(r=>r.canonicalId==='wrk:000181'),collection=db.books.find(r=>r.canonicalId==='col:000011');
 assert.deepEqual(story.editionSpecificCollections,[collection.id]);assert.equal(require('../explorer/pilot/data/wrk-000181/index.json').media.editionSpecific,true);assert.ok(!require('../explorer/pilot/data/wrk-000177/index.json').media.editionSpecific);
 run("lang='en';tab='books'");assert.match(run("detailContent(B.find(r=>r.canonicalId==='col:000011'))"),/Under the Weather — in selected editions/);
 run("tab='stories'");const html=run("detailContent(S.find(r=>r.canonicalId==='wrk:000181'))");assert.match(html,/in selected editions/);assert.match(run("collectionLabel(S.find(r=>r.canonicalId==='wrk:000181'))"),/in selected editions/);
 run("lang='nl'");assert.match(run("detailContent(S.find(r=>r.canonicalId==='wrk:000181'))"),/in bepaalde uitgaven/);
 for(const id of ['wrk-000181','col-000011']){const entry=require('../explorer/pilot/data/'+id+'/index.json'),details=require('../explorer/pilot/data/'+id+'/details.json'),rows=[...(entry.sections.memberships?.items||[]),...(details.sections?.memberships?.items||[])];assert.equal(rows.find(r=>r.id==='mem:000115').editionSpecific,true);assert.ok(rows.filter(r=>r.id!=='mem:000115').every(r=>!r.editionSpecific));}
 const membership=b.collectionMemberships.find(m=>m.id==='mem:000115');assert.deepEqual(membership.editionIds,[]);assert.equal(b.collectionMemberships.filter(m=>m.collectionId==='col:000011').length,5);assert.equal(b.editions.length,268);
});

test('Earlier verified story appearances drive main browsing years without becoming first-publication claims',()=>{
 const db=generateMainCompletion().db;
 for(const[n,year]of [[73,1970],[78,1973],[74,1974],[84,1975],[79,1972],[76,1972],[80,1973],[81,1974]]){const id='wrk:'+String(n).padStart(6,'0'),row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.Jaar,year);assert.equal(row.knownAppearance.publisher,'Cavalier');assert.ok(!row.firstPublication);const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(Math.min(...native.publicationDates.map(d=>Number(d.value.slice(0,4)))),year);run("tab='stories';lang='en'");const html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/Known publication/);assert.match(html,new RegExp(row.knownAppearance.date.value));assert.doesNotMatch(html,/First publication<\/b>/);assert.ok(native.publicationDates.some(p=>p.value==='1978-02'));}
 const unconfirmed=db.stories.find(s=>s.canonicalId==='wrk:000075');assert.equal(unconfirmed.Jaar,1978);assert.ok(!unconfirmed.knownAppearance);
});

test('Three additional Cavalier appearances reach both sites on existing story identities',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,collected]of [[77,'1973-03','1978-02'],[82,'1975-11','1978-02'],[124,'1972-02','1993-10']]){const id='wrk:'+String(n).padStart(6,'0'),events=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date);assert.equal(events.length,1);assert.equal(events[0].date.precision,'month');assert.equal(events[0].publisher,'Cavalier');assert.equal(events[0].eventType,'source-reported-release');assert.ok(!b.publicationEvents.some(p=>p.subject.id===id&&p.eventType==='first-publication'));assert.ok(b.publicationEvents.some(p=>p.subject.id===id&&p.date.value===collected));const row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.Jaar,Number(date.slice(0,4)));run("tab='stories';lang='en'");const html=run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`);assert.match(html,new RegExp(date));assert.match(html,/Cavalier/);const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json');assert.ok(native.sections.publications.items.some(p=>p.id===events[0].id));}
 assert.equal(b.works.length,250);assert.equal(b.editions.length,268);assert.equal(db.stories.length,173);
});

test('Magazine issue and season citations retain honest date precision on both sites',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,precision,issue,collectionDate]of [[116,'1984-06','month','June 1984','1985-06'],[156,'1997','year','October/November 1997','2002-03'],[128,'1992','year','Fall 1992','1993-10']]){const id='wrk:'+String(n).padStart(6,'0'),events=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date);assert.equal(events.length,1);const p=events[0];assert.equal(p.date.precision,precision);assert.ok(p.reportedTitle.includes(issue));assert.equal(p.eventType,'source-reported-release');assert.ok(b.publicationEvents.some(p=>p.subject.id===id&&p.date.value===collectionDate));assert.ok(!b.publicationEvents.some(p=>p.subject.id===id&&p.eventType==='first-publication'));const row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.Jaar,Number(date.slice(0,4)));run("tab='stories';lang='en'");assert.ok(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`).includes(issue));const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json');assert.ok(native.sections.publications.items.some(r=>r.id===p.id&&r.reportedTitle.includes(issue)&&r.date.precision===precision));}
 assert.equal(b.works.length,250);assert.equal(b.editions.length,268);assert.equal(db.stories.length,173);
});

test('Afterlife and The Bone Church show documented publication history despite conflicting official headers',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,precision,eventType,label]of [[206,'2013','year','source-reported-release','Summer 2013'],[204,'2009-11','month','first-publication','November 2009']]){const id='wrk:'+String(n).padStart(6,'0'),p=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date);assert.equal(p.length,1);assert.equal(p[0].date.precision,precision);assert.equal(p[0].eventType,eventType);assert.ok(p[0].reportedTitle.includes(label));assert.ok(p[0].verification.open.length);const row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.Jaar,Number(date.slice(0,4)));run("tab='stories';lang='en'");assert.ok(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`).includes(label));assert.ok(require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json').sections.publications.items.some(r=>r.id===p[0].id));}
 assert.ok(!db.stories.find(s=>s.canonicalId==='wrk:000206').firstPublication);assert.equal(db.stories.find(s=>s.canonicalId==='wrk:000204').firstPublication.date,'2009-11');assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000204'&&p.date.value==='2015-11'));assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Mile 81 has its verified English ebook without replacing its collection cover or claiming earliest access',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,e=b.editions.filter(e=>e.isbn13==='9781451665604');assert.equal(e.length,1);assert.equal(e[0].id,'edn:000268');assert.equal(e[0].publicationOf.id,'wrk:000198');assert.equal(e[0].language,'en');assert.equal(e[0].format,'eBook');assert.equal(e[0].publisher,'Scribner');assert.equal(e[0].publicationDate.value,'2011-09-01');assert.equal(e[0].publicationDate.meaning,'edition-publication');assert.ok(!b.artworks.some(a=>a.editionId===e[0].id));assert.ok(!b.publicationEvents.some(p=>p.subject.id==='wrk:000198'&&p.eventType==='first-publication'));assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000198'&&p.date.value==='2015-11'));const row=db.stories.find(s=>s.canonicalId==='wrk:000198');assert.equal(row.Jaar,2011);run("tab='stories';lang='en'");const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000198'))");assert.match(html,/9781451665604/);assert.match(html,/2011-09-01/);const native=require('../explorer/pilot/data/edn-000268/index.json');assert.equal(native.parent.id,'wrk:000198');assert.equal(native.node.data.isbn13,'9781451665604');assert.equal(require('../explorer/pilot/data/wrk-000198/index.json').media.collectionId,'col:000012');assert.equal(b.editions.length,268);assert.equal(b.works.length,250);
});

test('UR versions and the earlier Green God anthology appearance remain separate publication facts',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[n,date,type,fragment]of [[207,'2010-02-16','source-reported-release','audiobook'],[207,'2015-11','revision','revised text'],[211,'2011-09','source-reported-release','A Book of Horrors']]){const id='wrk:'+String(n).padStart(6,'0'),p=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date&&p.eventType===type);assert.equal(p.length,1);assert.ok(p[0].reportedTitle.includes(fragment));run("tab='stories';lang='en'");assert.ok(run(`detailContent(S.find(s=>s.canonicalId===${JSON.stringify(id)}))`).includes(fragment));assert.ok(require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json').sections.publications.items.some(r=>r.id===p[0].id&&r.eventType===type));}
 assert.ok(b.publicationEvents.some(p=>p.subject.id==='wrk:000207'&&p.date.value==='2009-02-12'));assert.equal(db.stories.find(s=>s.canonicalId==='wrk:000207').Jaar,2009);assert.equal(db.stories.find(s=>s.canonicalId==='wrk:000211').Jaar,2011);assert.ok(!b.publicationEvents.some(p=>p.subject.id==='wrk:000211'&&p.eventType==='first-publication'));assert.equal(b.works.length,250);assert.equal(b.collections.length,18);assert.equal(b.editions.length,268);
});

test('Bad Little Kid distinguishes its 2014 translated release from its English collection appearance',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,w=b.works.find(w=>w.id==='wrk:000202'),p=b.publicationEvents.filter(p=>p.subject.id===w.id&&p.date.value==='2014-03-14');assert.equal(p.length,1);assert.equal(p[0].eventType,'source-reported-release');assert.equal(p[0].publisher,'Albin Michel');assert.match(p[0].reportedTitle,/French eBook/);assert.ok(b.publicationEvents.some(p=>p.subject.id===w.id&&p.date.value==='2015-11'));assert.equal(b.works.filter(w=>w.originalTitle==='Bad Little Kid').length,1);assert.match(w.summary.en,/French and German in 2014/);assert.match(w.summary.en,/English appearance.*2015/);const row=db.stories.find(s=>s.canonicalId===w.id);assert.equal(row.Jaar,2014);run("tab='stories';lang='en'");assert.match(run("detailContent(S.find(s=>s.canonicalId==='wrk:000202'))"),/French and German in 2014/);const native=require('../explorer/pilot/data/wrk-000202/index.json');assert.equal(native.node.description,w.summary.en);assert.ok(require('../explorer/pilot/data/wrk-000202/details.json').sections.publications.items.some(r=>r.id===p[0].id));assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('The Blue Air Compressor preserves original revision and later anthology chronology on one work',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,id='wrk:000218';for(const[date,type,label]of [['1971','first-publication','Onan Magazine'],['1981','revision','Heavy Metal']]){const events=b.publicationEvents.filter(p=>p.subject.id===id&&p.date.value===date&&p.eventType===type);assert.equal(events.length,1);assert.equal(events[0].date.precision,'year');assert.ok(events[0].reportedTitle.includes(label));assert.ok(require('../explorer/pilot/data/wrk-000218/details.json').sections.publications.items.some(p=>p.id===events[0].id));}assert.ok(b.publicationEvents.some(p=>p.subject.id===id&&p.date.value==='2018-03'));const row=db.stories.find(s=>s.canonicalId===id);assert.equal(row.Jaar,1971);assert.equal(row.firstPublication.date,'1971');run("tab='stories';lang='en'");const html=run("detailContent(S.find(s=>s.canonicalId==='wrk:000218'))");assert.match(html,/Onan Magazine/);assert.match(html,/Heavy Metal/);assert.equal(b.works.filter(w=>w.originalTitle==='The Blue Air Compressor').length,1);assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Mid-Life Confidential contributors gain linked reader profiles without becoming coauthors',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,row=db.books.find(r=>r.canonicalId==='col:000015');run("tab='books';lang='en'");const html=run("detailContent(B.find(r=>r.canonicalId==='col:000015'))");
 for(const[id,label]of [['per:000009','Swamp Story'],['per:000010','The Joy Luck Club']]){const person=b.people.find(p=>p.id===id);assert.ok(person.summary.en.includes(label));assert.ok(row.authors.some(a=>a.personId===id&&a.role==='contributor'&&a.profile.en===person.summary.en));assert.ok(html.includes(label));assert.ok(html.includes('entity='+encodeURIComponent(id)));const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(native.node.description,person.summary.en);assert.ok(native.sections.creators.items.some(c=>c.target.id==='col:000015'&&c.role==='contributor'));assert.ok(!b.credits.some(c=>c.personId===id&&c.subject.id==='col:000015'&&c.role==='coauthor'));}
 assert.equal(b.people.length,60);assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Illustrator profiles remain visible on both sites with cover and interior roles intact',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[id,owner,text]of [['per:000005','wrk:000067','comics artist'],['per:000050','wrk:000250','cover artist'],['per:000051','wrk:000250','interior illustrations']]){const p=b.people.find(p=>p.id===id);assert.ok(p.summary.en.includes(text));const row=db.books.find(r=>r.canonicalId===owner);assert.ok(row.authors.some(a=>a.personId===id&&a.role==='illustrator'&&a.profile.en===p.summary.en));run("tab='books';lang='en'");const html=run(`detailContent(B.find(r=>r.canonicalId===${JSON.stringify(owner)}))`);assert.ok(html.includes(text));assert.ok(html.includes('entity='+encodeURIComponent(id)));const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(native.node.description,p.summary.en);assert.ok(native.sections.creators.items.some(c=>c.role==='illustrator'&&c.target.id===owner));assert.ok(!b.credits.some(c=>c.personId===id&&['author','coauthor'].includes(c.role)));}
 const feather=db.books.find(r=>r.canonicalId==='wrk:000250');assert.equal(feather.Auteur,'Richard Chizmar');assert.equal(b.people.length,60);assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Ned Dameron links two documented illustration contributions without changing text authorship',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,id='per:000029',credits=b.credits.filter(c=>c.personId===id&&c.subject.id==='wrk:000025');assert.equal(credits.length,1);assert.equal(credits[0].role,'illustrator');assert.match(credits[0].scope,/1991 Donald M. Grant edition/);assert.ok(!b.credits.some(c=>c.personId===id&&['author','coauthor'].includes(c.role)));
 for(const work of ['wrk:000025','wrk:000245']){const row=db.books.find(r=>r.canonicalId===work);assert.ok(row.authors.some(a=>a.personId===id&&a.role==='illustrator'));assert.equal(row.authors.filter(a=>a.personId===id).length,1);run("tab='books';lang='en'");const html=run(`detailContent(B.find(r=>r.canonicalId===${JSON.stringify(work)}))`);assert.match(html,/1991 Donald M. Grant edition/);assert.ok(html.includes('entity='+encodeURIComponent(id)));}
 const artist=require('../explorer/pilot/data/per-000029/index.json');assert.equal(artist.sections.creators.total,2);assert.ok(artist.sections.creators.items.some(c=>c.target.id==='wrk:000025'&&c.role==='illustrator'));assert.equal(db.books.find(r=>r.canonicalId==='wrk:000025').Auteur,'Stephen King');assert.equal(b.people.length,60);assert.equal(b.works.length,250);assert.equal(b.editions.length,268);
});

test('Mike Flanagan director credits and profile connect the two existing films on both sites',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const id of ['adp:000015','adp:000021']){const credits=b.credits.filter(c=>c.subject.id===id&&c.personId==='per:000022'&&c.role==='director');assert.equal(credits.length,1);const row=db.films.find(f=>f.canonicalId===id);assert.ok(row.screenMakers.some(m=>m.personId==='per:000022'&&m.role==='director'));run("tab='films';lang='en'");const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/Filmmakers/);assert.match(html,/Mike Flanagan/);assert.match(html,/entity=per%3A000022/);assert.equal(html.split('Profile &amp; contributions').length<=2,true);assert.ok(require('../explorer/pilot/data/'+id.replace(':','-')+'/details.json').sections.creators.items.some(c=>c.personId==='per:000022'&&c.role==='director'));}
 const person=require('../explorer/pilot/data/per-000022/index.json');assert.match(person.node.description,/Gerald’s Game.*Doctor Sleep/);assert.ok(person.sections.creators.items.some(c=>c.target.id==='adp:000021'));assert.ok(person.sections.creators.items.some(c=>c.target.id==='adp:000015'));assert.equal(b.adaptations.length,114);assert.equal(b.people.length,60);assert.equal(db.films.length,114);
});

test('Mary Lambert links the original and sequel without taking the 2019 remake credit',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const id of ['adp:000038','adp:000104']){assert.equal(b.credits.filter(c=>c.personId==='per:000016'&&c.subject.id===id&&c.role==='director').length,1);run("tab='films';lang='en'");const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`);assert.match(html,/entity=per%3A000016/);assert.match(html,/Mary Lambert directed/);}
 assert.ok(!b.credits.some(c=>c.personId==='per:000016'&&c.subject.id==='adp:000039'));assert.ok(!db.films.find(f=>f.canonicalId==='adp:000039').screenMakers?.some(m=>m.personId==='per:000016'));const p=require('../explorer/pilot/data/per-000016/index.json');assert.equal(p.sections.creators.total,2);assert.ok(p.sections.creators.items.some(c=>c.target.id==='adp:000104'));assert.equal(b.adaptations.length,114);assert.equal(b.people.length,60);
});

test('The Life of Chuck joins the same Flanagan profile without changing release history',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,credits=b.credits.filter(c=>c.personId==='per:000022'&&c.subject.id==='adp:000028');assert.equal(credits.length,1);assert.equal(credits[0].role,'director');const f=b.adaptations.find(a=>a.id==='adp:000028');assert.equal(f.releaseYear,2024);assert.ok(f.releaseEvents.length);run("tab='films';lang='en'");assert.match(run("detailContent(F.find(f=>f.canonicalId==='adp:000028'))"),/entity=per%3A000022/);const profile=require('../explorer/pilot/data/per-000022/index.json');assert.match(profile.node.description,/The Life of Chuck/);assert.ok(profile.sections.creators.items.some(c=>c.target.id===f.id));assert.equal(b.people.length,60);assert.equal(db.films.length,114);
});

test('Firestarter filmmaker profiles stay attached to their separate original and remake',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[id,person,other,year]of [['adp:000019','per:000014','per:000015',1984],['adp:000020','per:000015','per:000014',2022]]){const row=db.films.find(f=>f.canonicalId===id);assert.equal(row.Jaar,year);assert.ok(row.screenMakers.some(m=>m.personId===person&&m.role==='director'));assert.ok(!row.screenMakers.some(m=>m.personId===other));run("tab='films';lang='en'");assert.ok(run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`).includes('entity='+encodeURIComponent(person)));const native=require('../explorer/pilot/data/'+person.replace(':','-')+'/index.json');assert.equal(native.sections.creators.total,1);assert.equal(native.sections.creators.items[0].target.id,id);}
 assert.equal(b.adaptations.length,114);assert.equal(b.people.length,60);
});

test('Carrie and A Good Marriage maker profiles preserve direction screenplay and production scope',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[id,person,role]of [['adp:000083','per:000019','director'],['adp:000083','per:000020','screenwriter'],['adp:000083','per:000021','screenwriter'],['adp:000001','per:000013','director']]){const row=db.films.find(f=>f.canonicalId===id);assert.ok(row.screenMakers.some(m=>m.personId===person&&m.role===role));run("tab='films';lang='en'");assert.ok(run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(id)}))`).includes('entity='+encodeURIComponent(person)));const native=require('../explorer/pilot/data/'+person.replace(':','-')+'/index.json');assert.ok(native.sections.creators.items.some(c=>c.target.id===id&&c.role===role));}
 const old=db.films.find(f=>f.canonicalId==='adp:000004');assert.ok(!old.screenMakers?.some(m=>m.personId==='per:000019'));assert.ok(db.films.find(f=>f.canonicalId==='adp:000001').screenMakers.some(m=>m.personId==='per:000001'&&m.role==='screenwriter'));assert.equal(b.people.length,60);assert.equal(b.adaptations.length,114);
});

test('Additional film profiles keep remakes and individual screenwriting roles distinct',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db;
 for(const[person,film]of [['per:000017','adp:000039'],['per:000018','adp:000039'],['per:000027','adp:000089'],['per:000028','adp:000095']]){const p=b.people.find(p=>p.id===person);assert.ok(p.summary.en);const row=db.films.find(f=>f.canonicalId===film);assert.ok(row.screenMakers.some(m=>m.personId===person&&m.role==='director'));run("tab='films';lang='en'");const html=run(`detailContent(F.find(f=>f.canonicalId===${JSON.stringify(film)}))`);assert.ok(html.includes('entity='+encodeURIComponent(person)));assert.equal(require('../explorer/pilot/data/'+person.replace(':','-')+'/index.json').node.description,p.summary.en);}
 const original=db.films.find(f=>f.canonicalId==='adp:000038');assert.ok(!original.screenMakers.some(m=>['per:000017','per:000018'].includes(m.personId)));const beer=b.credits.filter(c=>c.personId==='per:000028'&&c.subject.id==='adp:000095');assert.deepEqual(beer.map(c=>c.role).sort(),['director','screenwriter']);run("tab='films';lang='en'");const html=run("detailContent(F.find(f=>f.canonicalId==='adp:000095'))");assert.equal(html.split('entity=per%3A000028').length-1,1);assert.match(html,/Screenwriter/);assert.equal(db.films.find(f=>f.canonicalId==='adp:000089').Jaar,2014);assert.equal(b.adaptations.length,114);assert.equal(b.people.length,60);
});

test('Film tiles use the existing verified typed director instead of pending credits',()=>{
 const db=generateMainCompletion().db;assert.equal(db.films.find(f=>f.canonicalId==='adp:000019').director,'Mark L. Lester');run("tab='films';lang='en';$('search').value='Firestarter';render()");assert.match(element('results').innerHTML,/Mark L\. Lester/);assert.match(element('results').innerHTML,/Keith Thomas/);assert.doesNotMatch(element('results').innerHTML,/Credits pending/);run("$('search').value=''");
});

test('Carrie episode-director profiles keep their individual episode scopes',()=>{
 const b=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),db=generateMainCompletion().db,row=db.films.find(f=>f.canonicalId==='adp:000084');run("tab='films';lang='en'");const html=run("detailContent(F.find(f=>f.canonicalId==='adp:000084'))");for(const[n,episode]of [[23,103],[24,104],[25,105],[26,106]]){const id='per:'+String(n).padStart(6,'0'),p=b.people.find(p=>p.id===id),credit=b.credits.filter(c=>c.personId===id&&c.subject.id==='adp:000084');assert.equal(credit.length,1);assert.equal(credit[0].scope,'season-1 episode '+episode);assert.match(p.summary.en,/episode/);assert.ok(row.screenMakers.some(m=>m.personId===id&&m.scope===credit[0].scope));assert.equal(html.split('entity='+encodeURIComponent(id)).length-1,1);const native=require('../explorer/pilot/data/'+id.replace(':','-')+'/index.json');assert.equal(native.node.description,p.summary.en);assert.equal(native.sections.creators.items[0].scope,credit[0].scope);}
 assert.equal(b.people.length,60);assert.equal(b.adaptations.length,114);
});
