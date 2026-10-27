'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {completionPilot}=require('../scripts/completion_pilot.cjs'),{readGenerated}=require('../scripts/foundation_compat.cjs');
const p=completionPilot(),m=readGenerated('media.js','MEDIA'),choices=p.defaultProjection.mediaChoices;
test('Explorer uses the exact existing Talisman cover and A Good Marriage poster, with correct owners',()=>{
 assert.equal(choices['wrk:000001'].src,m.books['The Talisman'].en.image);assert.equal(choices['wrk:000001'].editionId,'edn:000002');assert.equal(choices['wrk:000001'].remoteArtwork,true);
 assert.equal(choices['adp:000001'].src,m.films['A Good Marriage|2014'].image);assert.equal(choices['adp:000001'].ownerId,'adp:000001');
});
test('Works absent from the existing image data keep the local placeholder',()=>{assert.match(choices['col:000016'].src,/assets\/media\/fallbacks\/book.svg/);assert.equal(choices['col:000016'].remoteArtwork,undefined);});
