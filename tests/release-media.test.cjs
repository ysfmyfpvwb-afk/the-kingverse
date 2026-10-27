'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ROOT}=require('../scripts/validate_foundation.cjs'),{loadCompletion}=require('../scripts/build_completion.cjs');
const {releaseMedia,imageInfo,digest}=require('../scripts/release_media.cjs'),C=require('../scripts/pilot/shared.js');
const base=loadCompletion();
function fixture(run){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kingverse-media-'));
 try{
  fs.mkdirSync(path.join(root,'data/media'),{recursive:true});fs.copyFileSync(path.join(ROOT,'data/media/library.json'),path.join(root,'data/media/library.json'));
  // Original synthetic test pixel only, never a downloaded or published cover.
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=','base64');
  const file='assets/explorer-media/covers/edn-000001/fixture.png';fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),bytes);
  const integrity={...imageInfo(bytes),sha256:digest(bytes),bytes:bytes.length};
  const original=JSON.parse(fs.readFileSync(path.join(ROOT,'data/media/library.json'))).records[0];
  const grant={artworkId:original.artworkId,ownerId:'edn:000001',workId:'wrk:000001',language:'nl',isbn13:'9789021037400',originalUrl:original.originalUrl,editionReviewed:true,editionEvidence:'Synthetic test metadata, not a real grant',imageReviewed:true,imageReviewedSha256:integrity.sha256,localHostingAllowed:true,rightsHolder:'Synthetic test owner',rights:{status:'allowed',evidence:['Synthetic unpublished test grant'],licence:'Synthetic test licence',conditions:[],reviewedAt:'2026-10-27',note:'Test only'},technical:{status:'available',observedAt:'2026-10-27',evidence:'Synthetic test fixture'},localPath:file,integrity,variants:[{path:file,...integrity}],credit:{text:'Synthetic test credit',url:null},validUntil:'2027-10-27'};
  run({root,grant,file});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
test('With no permission decisions, real covers and posters remain blocked and snapshots stay intact',()=>{
 const original=fs.readFileSync(path.join(ROOT,'data/media/library.json'),'utf8'),r=releaseMedia(base);assert.ok(r.registry.records.every(r=>!r.displayAllowed&&r.localPath===null));assert.equal(r.credits.size,0);assert.equal(fs.readFileSync(path.join(ROOT,'data/media/library.json'),'utf8'),original);
});
test('A specifically approved local file exposes only its edition artwork and credit',()=>fixture(({root,grant})=>{
 const r=releaseMedia(base,{root,approvals:[grant],asOf:'2026-10-27'});assert.equal(r.registry.records.filter(r=>r.displayAllowed).length,1);assert.equal(r.registry.records[0].owner.id,'edn:000001');assert.equal(r.credits.get('art:000001').text,'Synthetic test credit');assert.equal(r.terms.get('art:000001').validUntil,'2027-10-27');
}));
test('Wrong edition, missing permission, expired grant and a different image are rejected',()=>fixture(({root,grant})=>{
 for(const mutate of [g=>g.ownerId='edn:000003',g=>g.rights.status='not-established',g=>g.localHostingAllowed=false,g=>g.imageReviewed=false,g=>g.credit=null,g=>g.validUntil='2020-01-01',g=>g.integrity.width=99,g=>g.localPath='../outside.png']){const g=structuredClone(grant);mutate(g);assert.throws(()=>releaseMedia(base,{root,approvals:[g],asOf:'2026-10-27'}));}
}));
test('HTML is not accepted as an image, and credits expire with the artwork in the reader client',()=>{
 assert.throws(()=>imageInfo(Buffer.from('<html>not an image</html>')));assert.equal(C.artworkInTerm({validUntil:'2026-10-27'},'2026-10-27'),true);assert.equal(C.artworkInTerm({validUntil:'2026-10-27'},'2026-10-28'),false);assert.equal(C.artworkInTerm({validUntil:'unknown'},'2026-10-27'),false);
});
