'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
test('Carrie reading credit belongs to the exact audiobook edition, preserving authorship',()=>{
 const bundle=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion()),main=require('../scripts/build_main_completion.cjs').generateMainCompletion().db;
 const person=bundle.people.find(p=>p.name==='Willemijn de Vries');assert.ok(person);
 const credits=bundle.credits.filter(c=>c.personId===person.id);assert.equal(credits.length,1);assert.deepEqual(credits[0].subject,{type:'edition',id:'edn:000005'});assert.equal(credits[0].role,'contributor');assert.match(credits[0].scope,/^narration/);
 const edition=main.editions.find(e=>e.canonicalId==='edn:000005');assert.equal(edition.isbn,'9789024591350');assert.deepEqual(edition.narrators,['Willemijn de Vries']);assert.ok(!main.books.find(w=>w.canonicalId==='wrk:000003').authors.some(a=>a.name===person.name));
 const projected=require('../explorer/pilot/data/edn-000005/index.json');assert.equal(projected.creators.find(c=>c.person.id===person.id).scope,credits[0].scope);assert.ok(!bundle.credits.some(c=>c.personId===person.id&&['author','coauthor','translator'].includes(c.role)));
});
