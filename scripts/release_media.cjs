'use strict';
// Release-only permission overlay: immutable migration snapshots are never edited.
// This module has no network or file-copy API; non-commercial use does not infer a licence.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT}=require('./validate_foundation.cjs');
const {permittedLocal}=require('./build_media_library.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const SITE='https://ysfmyfpvwb-afk.github.io/the-kingverse/';
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
function imageInfo(bytes){
 if(bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))&&bytes.toString('ascii',12,16)==='IHDR')return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),mime:'image/png'};
 if(bytes.length>12&&bytes[0]===255&&bytes[1]===216){let i=2;while(i+4<=bytes.length){if(bytes[i++]!==255)throw Error('Invalid JPEG marker');while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const size=bytes.readUInt16BE(i);if(size<2||i+size>bytes.length)throw Error('Invalid JPEG segment');if([0xc0,0xc1,0xc2].includes(marker)&&size>=8)return {width:bytes.readUInt16BE(i+5),height:bytes.readUInt16BE(i+3),mime:'image/jpeg'};i+=size;}}
 if(bytes.length>=30&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'){
  const kind=bytes.toString('ascii',12,16);if(kind==='VP8X')return {width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3),mime:'image/webp'};
  if(kind==='VP8 '&&bytes.subarray(23,26).equals(Buffer.from([0x9d,0x01,0x2a])))return {width:bytes.readUInt16LE(26)&0x3fff,height:bytes.readUInt16LE(28)&0x3fff,mime:'image/webp'};
  if(kind==='VP8L'&&bytes[20]===0x2f){const bits=bytes.readUInt32LE(21);return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1,mime:'image/webp'};}
 }
 throw Error('Unsupported or invalid local image; use visually reviewed PNG/JPEG/WebP');
}
function releaseMedia(bundle,{root=ROOT,approvals,asOf=new Date().toISOString().slice(0,10)}={}){
 const out=structuredClone(read(root,'data/media/library.json'));
 const decisions=approvals??read(root,'data/media-release/approvals.json').decisions,seen=new Set(),credits=new Map(),terms=new Map();
 for(const d of decisions){
  if(seen.has(d.artworkId))throw Error('Duplicate release approval '+d.artworkId);seen.add(d.artworkId);
  const r=out.records.find(r=>r.artworkId===d.artworkId),edition=bundle.editions.find(e=>e.id===d.ownerId),production=bundle.adaptations.find(a=>a.id===d.ownerId);
  if(!r||d.ownerId!==r.owner.id||d.originalUrl!==r.originalUrl||d.language!==r.language)throw Error('Wrong artwork/owner binding');
  if(r.kind==='cover'&&(!edition||d.language!==edition.language||d.workId!==edition.publicationOf.id||d.isbn13!==edition.isbn13||d.editionReviewed!==true||!d.editionEvidence||!edition.isbn13&&!d.editionIdentifier))throw Error('Edition has not been verified');
  if(r.kind==='poster'&&(!production||d.productionReviewed!==true))throw Error('Production has not been verified');
  if(d.imageReviewed!==true||d.imageReviewedSha256!==d.integrity?.sha256)throw Error('Exact image has not been visually reviewed');
  if(d.localHostingAllowed!==true||!d.credit?.text||d.credit.url!==null&&!/^https:\/\//.test(d.credit.url||''))throw Error('Local display permission and credit required');
  if(d.validUntil&&d.validUntil<asOf)throw Error('Cover permission has expired');
  const candidate={...r,rightsHolder:d.rightsHolder,rights:d.rights,technical:d.technical,localPath:d.localPath,variants:d.variants,integrity:d.integrity,displayAllowed:true,decision:'approved-local'};
  if(!permittedLocal(candidate))throw Error('No documented permission/local delivery for '+d.artworkId);
  const dir='assets/explorer-media/'+(r.kind==='cover'?'covers/':'posters/')+d.ownerId.replace(':','-')+'/';
  for(const v of [{...d.integrity,path:d.localPath},...d.variants]){
   if(typeof v.path!=='string'||!v.path.startsWith(dir)||!/^assets\/explorer-media\/(covers|posters)\/(edn|adp)-\d{6}\/[a-zA-Z0-9/_.-]+$/.test(v.path)||v.path.split('/').some(p=>p==='..'||p==='.'))throw Error('Unsafe local cover path');
   const file=path.join(root,v.path),real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(path.join(root,'assets/explorer-media'))+path.sep))throw Error('Cover escapes local root');
   const bytes=fs.readFileSync(file),info=imageInfo(bytes);if(digest(bytes)!==v.sha256||bytes.length!==v.bytes||info.width!==v.width||info.height!==v.height||info.mime!==v.mime||info.width<1||info.height<1)throw Error('Image integrity/actual dimensions mismatch '+d.artworkId);
   if(v.width*d.integrity.height!==v.height*d.integrity.width)throw Error('Cover proportions changed '+d.artworkId);
  }
  Object.assign(r,candidate);credits.set(d.artworkId,structuredClone(d.credit));terms.set(d.artworkId,{validUntil:d.validUntil||null});
 }
 return {registry:out,credits,terms};
}
module.exports={releaseMedia,imageInfo,SITE,digest};
