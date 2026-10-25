const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const elements = new Map();
function element(id) {
 if(!elements.has(id)) elements.set(id,{value:'',dataset:{},options:[{},{}],innerHTML:'',textContent:'',classList:{add(){},remove(){},contains(){return false},toggle(){}},setAttribute(){},focus(){},querySelectorAll(){return []}});
 return elements.get(id);
}
const routeLocation={hash:''};const routeHistory={pushState(_a,_b,hash){routeLocation.hash=hash},replaceState(_a,_b,hash){routeLocation.hash=hash}};
const context = vm.createContext({console,Set,URLSearchParams,location:routeLocation,history:routeHistory,localStorage:{getItem(){throw Error('Disabled storage')},setItem(){}},document:{getElementById:element,querySelector(){return element('shell')},querySelectorAll(){return []},documentElement:{},body:{style:{}}}});
for(const file of ['catalog.js','media.js','app.js'])vm.runInContext(fs.readFileSync(file,'utf8').replace(/init\(\);\s*$/,''),context);
const run=code=>vm.runInContext(code,context);
const initialLanguage=run('lang');
const plain=code=>JSON.parse(run(`JSON.stringify(${code})`));
const audit=JSON.parse(fs.readFileSync('data/audit.json','utf8'));
const legacy=JSON.parse(fs.readFileSync('data/legacy-v1.4.json','utf8'));
const ref=JSON.parse(fs.readFileSync('data/reference/official.json','utf8'));
test('All original works survive consolidation and corrected aliases',()=>{
 assert.equal(legacy.books.length,81);assert.equal(legacy.stories.length,155);assert.equal(legacy.films.length,84);
 const titles=plain('B.flatMap(b=>[bn(b),...(b.aliases||[])])');
 for(const b of legacy.books)assert.ok(titles.includes(b['Engelse titel']),b['Engelse titel']);
 const storyNames=plain('S.map(sn)');for(const name of ['Rage','The Long Walk','Roadwork','The Running Man'])assert.ok(!storyNames.includes(name));
 assert.equal(run("B.find(b=>bn(b)==='The Bachman Books').containsWorks.length"),4);
});
test('Unique works, views, editions and covers have distinct stable identities',()=>{
 for(const group of ['B','S','F'])assert.equal(run(`${group}.length`),run(`new Set(${group}.map(r=>r.id)).size`));
 assert.equal(run('DB.works.length'),run('new Set(DB.works.map(w=>w.id)).size'));
 assert.equal(run("S.find(s=>sn(s)==='Blockade Billy').workId"),run("B.find(b=>bn(b)==='Blockade Billy').workId"));
 assert.notEqual(run("S.find(s=>sn(s)==='Hearts in Atlantis').workId"),run("B.find(b=>bn(b)==='Hearts in Atlantis').workId"));
 assert.equal(run('DB.editions.every(e=>DB.works.some(w=>w.id===e.workId)&&(!e.coverId||MEDIA.covers[e.coverId]?.editionId===e.id))'),true);
});
test('Index comparison is complete only for the declared source scope',()=>{
 assert.ok(ref.index.length>600);assert.equal(ref.errors.length,0);
 for(const group of ['books','stories','films'])assert.equal(audit.referenceCoverage[group].missing.length,0);
 assert.ok(audit.supplementaryScreenQueue.length>0);
 assert.ok(audit.conflicts.length>0);
});
test('Serial publications and revised editions do not duplicate literary works',()=>{
 assert.equal(run("B.filter(b=>bn(b).startsWith('The Green Mile')).length"),1);
 assert.equal(run("B.find(b=>bn(b)==='The Green Mile').publications.filter(p=>p.kind==='serial-part').length"),6);
 assert.equal(run("B.find(b=>bn(b)==='The Green Mile').Jaar"),1996);
 assert.ok(!run("B.some(b=>bn(b).includes('(Revised)'))"));
});
test('Stories are unique despite multiple collection memberships',()=>{
 assert.equal(run("S.filter(s=>sn(s)==='1408').length"),1);
 assert.ok(run("S.find(s=>sn(s)==='1408').collectionIds.length")>=2);
 assert.equal(run("B.find(b=>b.id===S.find(s=>sn(s)==='1408').defaultCollectionId)['Engelse titel']"),"Everything's Eventual");
 assert.equal(run('S.every(s=>s.collectionIds.every(id=>B.some(b=>b.id===id)))'),true);
});
test('Collected stories use the proper collection edition in each language',()=>{
 run("tab='stories';lang='nl'");const nl=plain("media(S.find(s=>sn(s)==='Jerusalem\\'s Lot'))");
 assert.equal(nl.title,'Satanskinderen');assert.equal(nl.language,'nl');
 run("lang='en'");assert.equal(run("media(S.find(s=>sn(s)==='Jerusalem\\'s Lot')).title"),'Night Shift');
 assert.match(run("collectionLabel(S.find(s=>sn(s)==='Jerusalem\\'s Lot'))"),/Collected in Night Shift/);
 assert.match(run("detailContent(S.find(s=>sn(s)==='1408'))"),/Stephen King Goes to the Movies/);
});
test('A story without a collection does not invent a required own cover',()=>{
 run("tab='stories';lang='en'");const r=plain("S.find(s=>sn(s)==='The Glass Floor')");assert.equal(r.defaultCollectionId,null);
 assert.equal(run("imageMarkup(S.find(s=>sn(s)==='The Glass Floor'))"),'');
 assert.match(run("detailContent(S.find(s=>sn(s)==='The Glass Floor'))"),/separate book cover is not required/);
});
test('NL and EN titles/covers switch together; permitted EN fallbacks are visibly labelled',()=>{
 run("tab='books';lang='nl'");assert.equal(run("title(B.find(b=>bn(b)===\"'Salem's Lot\"))"),'Bezeten stad');assert.equal(run("media(B.find(b=>bn(b)===\"'Salem's Lot\")).language"),'nl');
 assert.match(run("imageMarkup(B.find(b=>bn(b)==='Holly'))"),/EN · FALLBACK/);
 run("lang='en'");assert.equal(run("title(B.find(b=>bn(b)===\"'Salem's Lot\"))"),"'Salem's Lot");assert.equal(run("media(B.find(b=>bn(b)==='Holly')).language"),'en');
});
test('Only independently fetched and visually approved art is published',()=>{
 assert.equal(run("Object.values(MEDIA.books).flatMap(Object.values).every(m=>m.review.status==='verified'&&m.review.sha256&&m.editionId&&m.coverId)"),true);
 assert.equal(run("Object.values(MEDIA.films).every(m=>m.language==='en'&&m.review.status==='verified')"),true);
 assert.equal(run("MEDIA.books['The Dark Tower: The Waste Lands'].nl"),undefined);
 assert.equal(run("MEDIA.books[\"Lisey's Story\"].nl"),undefined);
});
test('Correct co-authors are recorded; pseudonyms and photographers are not false co-authors',()=>{
 for(const [title,name] of [['The Talisman','Peter Straub'],['Black House','Peter Straub'],['Sleeping Beauties','Owen King'],["Gwendy's Button Box",'Richard Chizmar'],['Other Worlds Than These','Peter Straub']])assert.equal(run(`B.find(b=>bn(b)===${JSON.stringify(title)}).authors.some(a=>a.name===${JSON.stringify(name)}&&a.role==='coauthor')`),true);
 assert.equal(run("B.find(b=>bn(b)==='Rage').authors.length"),1);
 assert.equal(run("B.find(b=>bn(b)==='Nightmares in the Sky').authors.find(a=>a.name==='f-stop Fitzgerald').role"),'photographer');
 assert.equal(run("S.find(s=>sn(s)==='In the Tall Grass').authors.some(a=>a.name==='Joe Hill')"),true);
});
test('Collaborations filter shares search/render behavior in both languages',()=>{
 run("tab='books';lang='en';$('search').value='';$('filter').dataset.tab='books';$('filter').value='__collaborations';render()");assert.ok(!element('results').innerHTML.includes('1974'));assert.match(element('results').innerHTML,/Sleeping Beauties/);
 run("setLang('nl')");assert.match(element('results').innerHTML,/De talisman/);assert.equal(element('filter').value,'__collaborations');
});
test('Carrie keeps four direct adaptations and separately identifies its sequel',()=>{
 assert.equal(run("F.filter(f=>fn(f)==='Carrie').length"),4);
 run("tab='books';lang='en'");assert.match(run("detailContent(B.find(b=>bn(b)==='Carrie'))"),/The Rage: Carrie 2/);
 run("tab='films'");const text=run("detailContent(F.find(f=>fn(f)==='Carrie'&&f.Jaar===2026))");for(const s of ['2026-10-07','2026-10-22','Prime Video','Mike Flanagan','Summer H. Howell','Season 2 release date','Unconfirmed'])assert.ok(text.includes(s),s);
});
test('Remake-specific source collisions never copy the wrong credits or poster',()=>{
 const a=plain("F.find(f=>fn(f)==='Firestarter'&&f.Jaar===1984)");assert.ok(a.audit.uncertain.includes('sharedSourceUrlCollision'));assert.notEqual(a.director,'Keith Thomas');
 run("tab='films';lang='nl'");assert.equal(run("media(F.find(f=>fn(f)==='Firestarter'&&f.Jaar===1984))"),null);
 assert.equal(run("media(F.find(f=>fn(f)==='Firestarter'&&f.Jaar===2022)).language"),'en');
});
test('Source dates preserve precision and are not labelled universal first-publication dates',()=>{
 assert.equal(run("B.find(b=>bn(b)==='The Long Walk').reportedDate"),'1979');
 assert.equal(run("F.find(f=>fn(f)==='11.22.63').release"),'2016-02-15');
 assert.equal(run("S.find(s=>sn(s)==='In the Tall Grass').status"),'published');
});
test('Searching accepts the other language, aliases, filters and empty states',()=>{
 run("lang='en';tab='books';$('filter').value='';$('search').value='bezeten';render()");assert.match(element('results').innerHTML,/Salem/);
 run("$('search').value='vel over been';render()");assert.match(element('results').innerHTML,/Bag of Bones/);
 run("$('search').value='zzzz-no-match';render()");assert.match(element('results').innerHTML,/No results/);
});
test('Search click/Enter/live input share one action and preserve a shareable query',()=>{
 const app=fs.readFileSync('app.js','utf8');assert.match(app,/\$\('search'\)\.oninput=performSearch/);assert.match(app,/\$\('searchForm'\)\.onsubmit=performSearch/);
 const html=fs.readFileSync('index.html','utf8');assert.match(html,/id="searchButton" type="submit"/);assert.match(html,/role="search"/);
 let prevented=false;context.searchEvent={preventDefault(){prevented=true}};run("tab='books';$('filter').value='';$('search').value='bezeten';performSearch(searchEvent)");assert.ok(prevented);assert.match(routeLocation.hash,/q=bezeten/);assert.match(element('results').innerHTML,/Salem/);
});
test('Edition-backed standalone story covers remain separate from collection defaults',()=>{
 assert.equal(run("MEDIA.stories['In the Tall Grass'].nl.title"),'Het hoge gras');
 run("tab='stories';lang='nl'");assert.equal(run("media(S.find(s=>sn(s)==='The Mist')).title"),'Duistere krachten');
 assert.equal(run("media(S.find(s=>sn(s)==='In the Tall Grass')).title"),'Het hoge gras');
 assert.equal(run("storyArtworkBook(S.find(s=>sn(s)==='Blockade Billy'))['Engelse titel']"),'The Bazaar of Bad Dreams');
});
test('The published quality figures are derived from the catalog and verified edition mappings',()=>{
 const report=JSON.parse(fs.readFileSync('data/quality-summary.json','utf8'));
 assert.equal(report.catalog.books,run('B.length'));assert.equal(report.catalog.stories,run('S.length'));
 assert.equal(report.images.nl,run("Object.values(MEDIA.books).filter(v=>v.nl).length"));assert.equal(report.images.en,run("Object.values(MEDIA.books).filter(v=>v.en).length"));
 assert.equal(report.missingImages.posters,run('F.length-Object.keys(MEDIA.films).length'));
 assert.equal(report.storyCovers.collectedStories,run('S.filter(s=>s.defaultCollectionId).length'));
});
test('Image failures reveal a placeholder without losing layout or exposing unsafe markup',()=>{
 let handler,removed=false,unhidden=false;
 const img={src:'https://example.invalid/missing.jpg',complete:false,parentElement:{querySelector(){return {removeAttribute(){unhidden=true}}}},addEventListener(type,fn){if(type==='error')handler=fn},remove(){removed=true}};
 context.imageRoot={querySelectorAll(){return [img]}};run('bindImages(imageRoot)');handler();assert.ok(removed&&unhidden);assert.equal(run('safe(\'<img src=x onerror="bad">\')'),'&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
test('Tower connections contain sourced certainty, precise concepts and resolvable works',()=>{
 assert.ok(run('T.length')>10);assert.equal(run("T.every(t=>['explicit','strongly-implied','interpretive'].includes(t.certainty)&&t.Bron&&t.concepts.length&&t.description.en&&t.description.nl)"),true);
 assert.equal(run("T.every(t=>t.works.every(w=>(w.kind==='books'?B:S).some(r=>(w.kind==='books'?bn(r):sn(r))===w.title)))"),true);
});

test('English is the default when storage is unavailable, with an English static shell',()=>{
 assert.equal(initialLanguage,'en');const shell=fs.readFileSync('index.html','utf8');assert.match(shell,/<html lang="en">/);assert.match(shell,/Loading the archive/);
 assert.match(fs.readFileSync('about.html','utf8'),/<html lang="en">/);
});
test('Collection search and filtering include secondary memberships in either language',()=>{
 run("tab='stories';lang='en';$('search').value='';$('filter').dataset.tab='stories';$('filter').value='Stephen King Goes to the Movies';render()");assert.match(element('results').innerHTML,/1408/);
 run("$('filter').value='';$('search').value='Satanskinderen';render()");assert.match(element('results').innerHTML,/Jerusalem/);
});

test('Exact story titles are not drowned out by an edition marketing subtitle',()=>{
 run("tab='stories';lang='en';$('filter').value='';$('search').value='1408';render()");assert.match(element('count').textContent,/1 results/);
});

test('Every entry in the official collaboration index resolves to a recorded project',()=>{
 const ledger=JSON.parse(fs.readFileSync('data/audit.json','utf8'));assert.equal(ledger.collaborations.referenceEntries,11);assert.deepEqual(ledger.collaborations.missingReferenceEntries,[]);
});

test('Supplementary adaptations retain exact remake identity and field evidence',()=>{
 const extras=JSON.parse(fs.readFileSync('data/reference/screen-1.5.1.json','utf8'));
 for(const e of extras.records){
  const f=plain(`F.find(f=>fn(f)+'|'+f.Jaar===${JSON.stringify(e.key)})`);
  assert.ok(f.sourceWorks.length);assert.ok(f.audit.fields.sourceWorks.source);
  for(const key of ['referenceMatch','sourceRelationship','tvFormat','cast','directorOrShowrunner'])assert.ok(!f.audit.uncertain.includes(key));
  assert.ok(f.imdb.url.endsWith(f.imdb.id+'/'));assert.equal(f.imdb.checked,'2026-10-25');
 }
 assert.equal(run("F.find(f=>fn(f)==='Carrie'&&f.Jaar===2002).director"),'David Carson');
 assert.equal(run("F.find(f=>fn(f)==='Carrie'&&f.Jaar===2013).director"),'Kimberly Peirce');
 assert.equal(run("F.find(f=>fn(f)==='Haven').showrunner"),'Scott Shepherd (season 1)');
 assert.equal(run("F.find(f=>fn(f)==='The Dead Zone'&&f.Jaar===2002).showrunner"),'Michael Piller');
});

test('IMDb observations disclose unavailable scores, provenance and cached dates',()=>{
 run("tab='films';lang='en'");
 const old=run("detailContent(F.find(f=>fn(f)==='Carrie'&&f.Jaar===2002))");
 assert.match(old,/Rating not yet verified/);assert.match(old,/exact premiere date/);assert.match(old,/not a live rating/);
 const current=run("detailContent(F.find(f=>fn(f)==='Haven'))");
 assert.match(current,/7.5\/10/);assert.match(current,/Short description/);assert.match(current,/Loosely inspired by/);assert.match(current,/2010-07-09/);
});
