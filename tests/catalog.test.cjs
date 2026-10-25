const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const elements = new Map();
function element(id) {
 if(!elements.has(id)) elements.set(id,{value:'', dataset:{}, options:[{},{}], innerHTML:'', textContent:'', classList:{add(){},remove(){},contains(){return false},toggle(){}},setAttribute(){},focus(){},querySelectorAll(){return []}});
 return elements.get(id);
}
const context = vm.createContext({console, Set, localStorage:{getItem(){throw Error('Disabled storage')}}, document:{getElementById:element,querySelector(){return element('shell')},querySelectorAll(){return []},documentElement:{},body:{style:{}}}});
for(const name of ['catalog.js','media.js','app.js']) vm.runInContext(fs.readFileSync(name,'utf8').replace(/init\(\);\s*$/, ''),context);
const run = code => vm.runInContext(code,context);
test('Imported records retained, documented duplicates consolidated in view',()=>{
 assert.equal(run('DB.books.length'),82);assert.equal(run('DB.films.length'),83);
 assert.equal(run('B.length'),81);assert.equal(run('F.length'),84);
 assert.equal(run('F.filter(f=>fn(f)==="The Dark Tower").length'),1);
 assert.equal(run('B.find(b=>bn(b)==="You Like It Darker").Type'),'Bundel / verzameling');
});
test('Language switches title and cover together; unknown Dutch image never gets English artwork',()=>{
 run("tab='books';lang='nl'");
 assert.equal(run("title(B.find(b=>bn(b)===\"'Salem's Lot\"))"),'Bezeten stad');
 assert.equal(run("media(B.find(b=>bn(b)===\"'Salem's Lot\")).language"),'nl');
 assert.equal(run("media(B.find(b=>bn(b)==='Holly'))"),null);
 run("lang='en'");
 assert.equal(run("title(B.find(b=>bn(b)===\"'Salem's Lot\"))"),"'Salem's Lot");
 assert.equal(run("media(B.find(b=>bn(b)==='Holly')).language"),'en');
});
test('Every mapped edition has an exact language, title, source and checked date',()=>{
 assert.equal(run("Object.values(MEDIA.books).flatMap(Object.values).length"),30);
 assert.equal(run("Object.values(MEDIA.books).every(ed=>Object.entries(ed).every(([lang,m])=>m.language===lang&&m.title&&m.source.startsWith('https://')&&m.checked&&m.image.startsWith('https://')))"),true);
 assert.equal(run("Object.values(MEDIA.books).filter(ed=>ed.nl).every(ed=>/^97[89]\\d{10}$/.test(ed.nl.isbn))"),true);
});
test('Carrie has the four direct adaptations, exact year navigation and confirmed season data',()=>{
 assert.equal(run("JSON.stringify(F.filter(f=>fn(f)==='Carrie').map(f=>f.Jaar).sort())"),'[1976,2002,2013,2026]');
 run("tab='books';lang='en'");
 const content = run("detailContent(B.find(b=>bn(b)==='Carrie'))");
 assert.match(content,/Screen adaptations \(4\)/);assert.match(content,/data-exact=/);
 run("tab='films'");const detail=run("detailContent(F.find(f=>fn(f)==='Carrie'&&f.Jaar===2026))");
 for(const expected of ['2026-10-07','2026-10-22','Prime Video','Mike Flanagan','Summer H. Howell','Season 1 episodes','Season 2 release date','Unconfirmed']) assert.ok(detail.includes(expected),expected);
});
test('Posters stay English in both interface languages and do not collide on remakes',()=>{
 assert.equal(run('Object.keys(MEDIA.films).length'),8);
 for(const language of ['nl','en']) {
 run(`lang='${language}';tab='films'`);
 assert.equal(run("F.filter(f=>media(f)).every(f=>media(f).language==='en')"),true);
 assert.equal(run("media(F.find(f=>fn(f)==='Carrie'&&f.Jaar===2002))"),null);
 assert.equal(run("title(F.find(f=>fn(f)==='The Shining'))"),'The Shining');
 }
});
test('Search, translated filters, sorting and empty results work',()=>{
 run("lang='en';tab='books';$('search').value='bezeten';render()");assert.match(element('results').innerHTML,/Salem/);
 run("$('search').value='';$('filter').dataset.tab='books';$('filter').value='Bundel / verzameling';render()");assert.ok(!element('results').innerHTML.includes('1974'));
 run("$('filter').value='';$('sort').value='title';render()");assert.ok(element('results').innerHTML.indexOf('11/22/63')<element('results').innerHTML.indexOf('Billy Summers'));
 run("$('search').value='zzzz-no-match';render()");assert.match(element('results').innerHTML,/No results/);
});
test('Missing images render stable placeholders; markup escapes imported strings',()=>{
 run("tab='books';lang='nl'");assert.match(run("imageMarkup(B.find(b=>bn(b)==='Rage'))"),/art-placeholder/);
 assert.ok(!run("imageMarkup(B.find(b=>bn(b)==='Rage'))").includes('<img'));
 assert.equal(run('safe(\'<img src=x onerror="bad">\')'),'&lt;img src=x onerror=&quot;bad&quot;&gt;');
});
test('Image errors remove broken image and reveal the fallback',()=>{
 let handler,removed=false,unhidden=false;
 const img={src:'https://example.invalid/missing.jpg',complete:false,parentElement:{querySelector(){return {removeAttribute(){unhidden=true}}}},addEventListener(type,fn){if(type==='error')handler=fn},remove(){removed=true}};
 context.imageRoot={querySelectorAll(){return [img]}};run('bindImages(imageRoot)');handler();assert.ok(removed&&unhidden);
});
test('Story, collection and Tower links remain available',()=>{
 run("tab='books';lang='en'");assert.match(run("detailContent(B.find(b=>bn(b)==='Different Seasons'))"),/Stories in this collection/);
 assert.match(run("detailContent(B.find(b=>bn(b)==='The Stand'))"),/Dark Tower/);
});
