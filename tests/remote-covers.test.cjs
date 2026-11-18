'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {remoteCovers}=require('../scripts/release_media.cjs');
const bundle=require('../scripts/completion_b.cjs').extendCompletionB(require('../scripts/build_completion.cjs').loadCompletion());
test('Remote service covers match existing edition, language, ISBN and work identities',()=>{
 const covers=remoteCovers(bundle);assert.equal(covers.length,8);
 for(const c of covers){const e=bundle.editions.find(e=>e.id===c.editionId);assert.equal(c.ownerId,e.id);assert.equal(c.language,e.language);assert.equal(c.isbn13,e.isbn13);assert.equal(c.workId,e.publicationOf.id);assert.match(c.src,/^https:\/\/covers\.openlibrary\.org\/b\/id\/\d+-M\.jpg\?default=false$/);}
 const wrong=structuredClone(bundle);wrong.editions.find(e=>e.id==='edn:000155').isbn13='9781439170984';assert.throws(()=>remoteCovers(wrong),/Unverified remote edition/);
});
test('Main library and Explorer use the same reviewed covers with working fallback metadata',()=>{
 const main=require('../scripts/build_main_completion.cjs').generateMainCompletion(),p=require('../scripts/completion_pilot.cjs').completionPilot().defaultProjection;
 for(const c of remoteCovers(bundle)){assert.equal(main.mediaPatch.books[c.title][c.language].image,c.src);for(const id of [c.workId,c.editionId]){const m=p.mediaChoices[id];assert.equal(m.src,c.src);assert.equal(m.ownerId,c.editionId);assert.equal(m.credit.url,c.source);assert.ok(m.fallbackPath);}}
});

test('Secret Windows paperback cover never overwrites the original hardcover identity',()=>{
 const editions=bundle.editions.filter(e=>e.publicationOf.id==='col:000016');
 assert.equal(editions.find(e=>e.id==='edn:000254').isbn13,'9780965006439');
 const paperback=editions.find(e=>e.id==='edn:000269');assert.equal(paperback.isbn13,'9780965018517');assert.equal(paperback.format,'Paperback');assert.equal(paperback.publicationDate.precision,'year');
 assert.equal(new Set(editions.map(e=>e.id)).size,editions.length);assert.equal(remoteCovers(bundle).find(c=>c.workId==='col:000016').ownerId,paperback.id);
});
