'use strict';
// Batch 03 is an offline projection of preserved evidence, never an image importer.
const fs=require('node:fs'),path=require('node:path');
const {readGenerated}=require('./foundation_compat.cjs');
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const precision=v=>({4:'year',7:'month',10:'day'})[v.length];
function plan(root,bundle,db){
 const media=readGenerated('media.js','MEDIA',root),dutch=read(root,'data/reference/dutch.json'),official=read(root,'data/reference/official.json');
 const aliases=new Map(bundle.registry.aliases.map(a=>[a.alias,a.target]));
 const specs=[],editions=[],events=new Map(),conflicts=[];
 function event(subject,eventType,value,publisher,url,locator,reportedTitle){
  const key=[subject.id,eventType,value,reportedTitle||''].join('|');let spec=events.get(key);
  if(!spec){const old=bundle.publicationEvents.find(p=>p.subject.id===subject.id&&p.eventType===eventType&&p.date.value===value&&!reportedTitle);spec={table:'publicationEvents',slot:'publications',key,existingId:old?.id,urls:[],locators:[],fields:{subject,eventType,date:{value,precision:precision(value),meaning:eventType,territory:null},editionId:null,part:null,publisher:publisher||null,...(reportedTitle?{reportedTitle}:{})}};events.set(key,spec);specs.push(spec);}
  if(!spec.urls.includes(url))spec.urls.push(url);spec.locators.push(locator);return spec;
 }
 for(const[g,rows]of [['books',db.books],['stories',db.stories]])for(const[rIndex,r]of rows.entries()){
  const subject=aliases.get(r.workId);if(!subject)throw Error('Missing work alias '+r.workId);
  if(r.reportedDate){const spec=event(subject,'source-reported-release',r.reportedDate,r.publisher,r.Bron,`catalog.js#/${g}/${rIndex}`);(spec.pointers??=[]).push({pointer:`/${g}/${rIndex}/reportedDate`,field:'/date/value'});
   if(r.publisher)(spec.pointers??=[]).push({pointer:`/${g}/${rIndex}/publisher`,field:'/publisher'});
   if(r.Jaar&&String(r.Jaar)===r.reportedDate.slice(0,4))spec.pointers.push({pointer:`/${g}/${rIndex}/Jaar`,field:'/date/value',transform:'extract-year'});
   else if(r.Jaar){const year=event(subject,'legacy-bibliographic-year',String(r.Jaar),null,r.Bron,`catalog.js#/${g}/${rIndex}/Jaar`);(year.pointers??=[]).push({pointer:`/${g}/${rIndex}/Jaar`,field:'/date/value',transform:'year-to-string'});conflicts.push({legacyId:r.id,subject,legacyYear:r.Jaar,reportedDate:r.reportedDate,source:r.Bron,resolution:'Unresolved; separate observations, neither asserted as first publication.'});}
  }
  if(g==='books')for(const[j,p]of r.publications.entries()){
   const detail=official.details.find(x=>x.url===p.source);const spec=event(subject,p.kind==='serial-part'?'serial-part':'edition-variant-reported-release',p.reportedDate,detail?.fields?.Publisher,p.source,`catalog.js#/books/${rIndex}/publications/${j}; data/publications.json`,p.title);
   (spec.pointers??=[]).push(...[['work','/subject'],['title','/reportedTitle'],['reportedDate','/date/value'],['source','@source'],['kind','/eventType']].map(([f,field])=>({pointer:`/books/${rIndex}/publications/${j}/${f}`,field,transform:f==='kind'?'reported-manifestation-kind':'identity'})));
  }
 }
 for(const[i,e]of db.editions.entries()){
  const owner=aliases.get(e.workId);if(!owner)throw Error('Missing edition owner '+e.id);
  const publisher=dutch.records.find(r=>r.kind==='publisher'&&r.url===e.source);
  const supported=!!publisher&&publisher.title===e.title&&publisher.isbn===e.isbn&&publisher.language==='nl-NL';
  const spec={table:'editions',slot:'editions',key:e.id,existingId:aliases.get(e.id)?.id,urls:[e.source],locators:[`catalog.js#/editions/${i}${supported?'; data/reference/dutch.json exact publisher title / ISBN / nl-NL match':''}`],fields:{publicationOf:owner,language:e.language,title:e.title,isbn13:e.isbn,publisher:null,publicationDate:null,format:null,translationCredits:[],identityStatus:'incomplete-example'},supportedFields:supported?['language','title','isbn13']:[]};specs.push(spec);
  const cover=media.covers[e.coverId];if(e.coverId&&!cover)throw Error('Broken legacy cover '+e.coverId);if(cover&&(cover.editionId!==e.id||cover.language!==e.language))throw Error('Cross-edition cover '+e.id);
  const art=cover?{table:'artworks',slot:'artworks',key:cover.id,existingId:aliases.get(cover.id)?.id,urls:[cover.source],locators:[`media.js#/covers/${cover.id}; historical visual approval, not a rights grant`],fields:{kind:'cover',editionId:null,adaptationId:null,url:cover.image,language:cover.language,review:cover.status==='verified'?'legacy-visually-reviewed':'pending',sourceId:null,rightsNote:'Existing visual evidence only. Copyright remains with rights holders; no permission or reliable delivery is established.'}}:null;if(art)specs.push(art);
  editions.push({i,legacy:e,edition:spec,artwork:art,cover,publisherEvidence:supported?{snapshot:'data/reference/dutch.json',checked:dutch.checked,url:publisher.url,sha256:publisher.sha256,fields:['title','language','isbn13']}:null});
 }
 return {specs,editions,conflicts,events:[...events.values()]};
}
function migratePublications(ctx){
 const {root,db,bundle,register,claim,alias,point,assigned,source}=ctx;
 const p=plan(root,bundle,db),probes=read(root,'data/migration/source-audit.json');
 for(const s of p.specs)s.id=s.existingId||assigned(s.slot,s.key);
 for(const e of p.editions)if(e.artwork)e.artwork.fields.editionId=e.edition.id;
 for(const s of p.specs){
  if(s.existingId)continue;
  const type={editions:'edition',artworks:'artwork',publicationEvents:'publication'}[s.table];
  if(s.table==='artworks')s.fields.sourceId=source(s.urls[0]);
  const r=register(s.table,{id:s.id,entityType:type,verification:{claimIds:[],open:type==='edition'?['printing','editionPublicationDate','publisher','format',...(s.fields.language==='nl'?['translator']:[]),...(s.supportedFields.length?[]:['editionIdentityNotIndependentlyConfirmed'])]:type==='artwork'?['reusePermission','currentDelivery']:['firstPublicationHistory']},...s.fields});
  const fields=type==='edition'?['publicationOf','language','title','isbn13']:type==='artwork'?['kind','editionId','url','language','sourceId','review','rightsNote']:['subject','eventType','date','publisher',...(r.reportedTitle?['reportedTitle']:[])];
  for(const f of fields)claim(r,f,r[f],s.urls,s.locators.join('; '),{status:s.supportedFields?.includes(f)?'verified':'provisional',decisionNote:s.supportedFields?.includes(f)?'Exact publisher snapshot agreement for this field only; edition date, printing, publisher and translator remain unresolved.':'Preserved source observation / migration interpretation only; not first-publication certification or permission to display images.'});
 }
 const views=[],policies=[];
 for(const e of p.editions){
  const {legacy,edition,artwork,i}=e;alias(legacy.id,{type:'edition',id:edition.id});if(artwork)alias(e.cover.id,{type:'artwork',id:artwork.id});
  for(const[f,field,transform]of [['id','id','legacy-alias'],['workId','/publicationOf','legacy-alias'],['language','/language'],['title','/title'],['isbn','/isbn13'],['source','@source'],['coverId','@coverProvenance/artworkId','legacy-cover-alias'],['coverStatus','@coverProvenance/legacyStatus']])point(`/editions/${i}/${f}`,edition.id,field,transform);
  for(const[g,rows]of [['books',db.books],['stories',db.stories]])for(const[j,r]of rows.entries())for(const[k,id]of r.editionIds.entries())if(id===legacy.id)point(`/${g}/${j}/editionIds/${k}`,edition.id,'id','legacy-alias');
  views.push({legacyEditionId:legacy.id,editionId:edition.id,subject:edition.fields.publicationOf,language:legacy.language,identityStatus:'incomplete-example',sourceSupportedIdentityFields:e.publisherEvidence?.fields||[],evidence:e.publisherEvidence,open:['editionPublicationDate','printing','publisher','format',...(legacy.language==='nl'?['translator']:[])]});
  const probe=probes.covers.find(c=>c.artworkId===artwork?.id);
  policies.push({editionId:edition.id,artworkId:artwork?.id||null,originalUrl:e.cover?.image||null,sourceUrl:e.cover?.source||legacy.source,bibliographicStatus:artwork?'known-cover':'no-registered-cover',legacyStatus:legacy.coverStatus,rights:{status:'not-established',evidence:[],note:'No explicit reuse permission established in preserved evidence.'},availability:{status:probe?'referrer-dependent-refusal':'not-currently-assessed',evidence:probe?'data/migration/source-audit.json#'+probe.artworkId:null,observedAt:probe?probes.checked:null},delivery:{status:artwork?'blocked-pending-rights':'no-registered-cover',reliable:false},approvedLocalAsset:null,fallback:'placeholder',displayAllowed:false});
 }
 for(const s of p.events)for(const f of s.pointers||[])point(f.pointer,s.id,f.field,f.transform);
 const review={batch:'03-publications-editions-cover-provenance',baseCommit:'82edfb3f865256e591c530e25ed2d774b752f45c',definitions:{editionExample:'An inherited edition identity, often a cover example; not necessarily a uniquely identified printing or first edition.',publicationRecord:'One subject + event kind + source date + optional manifestation title; source-reported dates are not first publication.',sourceSupportedEditionFields:'Exact publisher snapshot title, ISBN and nl-NL agreement; no whole-record certification.',coverReady:'Edition binding, documented reuse permission and reliable permitted delivery must all pass; no legacy visual status grants permission.'},editionExamples:{total:views.length,newlyMigrated:views.filter(v=>!bundle.editions.slice(0,4).some(x=>x.id===v.editionId)).length,inherited:4,byLanguage:{en:views.filter(v=>v.language==='en').length,nl:views.filter(v=>v.language==='nl').length},sourceSupportedIdentity:views.filter(v=>v.evidence).length,completeEditionHistories:0},publications:{records:p.events.map(s=>({id:s.id,subject:s.fields.subject,eventType:s.fields.eventType,date:s.fields.date,publisher:s.fields.publisher,reportedTitle:s.fields.reportedTitle||null,sourceUrls:s.urls,sourceLocators:s.locators,inherited:!!s.existingId})),total:p.events.length,newlyMigrated:p.events.filter(s=>!s.existingId).length,byKind:Object.fromEntries([...new Set(p.events.map(s=>s.fields.eventType))].map(k=>[k,p.events.filter(s=>s.fields.eventType===k).length])),missingReportedDate:db.stories.filter(s=>!s.reportedDate).map(s=>({legacyId:s.id,workId:s.workId})),missingEventPublisher:p.events.filter(s=>!s.fields.publisher).map(s=>s.id),coalescedObservations:p.events.filter(s=>s.locators.length>1).map(s=>({id:s.id,locators:s.locators,reason:'Exact registered subject, event kind, date and manifestation title agree; no title-based merge.'}))},dateConflicts:p.conflicts,covers:{known:policies.filter(p=>p.artworkId).length,withoutRegistered:policies.filter(p=>!p.artworkId).length,rightsEstablished:0,readyForDisplay:0,approvedLocalAssets:0,referrerRefusals:policies.filter(p=>p.availability.status==='referrer-dependent-refusal').length},remaining:['Edition dates, formats, publishers and printing/translation histories remain unknown where not independently recorded.','Two NL examples lack the exact publisher snapshot comparison (Carrie, Christine); retained provisionally, not invented translations.','No order/edition scope for collection memberships inferred; no new own-story cover.','96 adaptations and 17 legacy Tower rows are outside Batch 03.','No worldwide bibliography completeness claim; no runtime or Explorer switch.']};
 const sourceFields=[];
 const sha=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
 function walk(value,file,pointer,resolve){
  if(value!==null&&typeof value==='object'&&Object.keys(value).length){for(const[k,v]of Object.entries(value))walk(v,file,pointer+'/'+k.replaceAll('~','~0').replaceAll('/','~1'),resolve);return;}
  const target=resolve(pointer);sourceFields.push({source:file,pointer,sourceValueSha256:sha(value),disposition:target?'mapped':'retained-in-source-not-migrated',...(target?{target}:{}),reason:target?'Batch 03 exact preserved evidence mapping; transform and scope explicit.':'Evidence retained at frozen input hash; not canonically certified or imported.'});
 }
 const media=readGenerated('media.js','MEDIA',root);
 walk(media.covers,'media.js','/covers',pointer=>{const parts=pointer.split('/'),id=parts[2],entry=p.editions.find(e=>e.cover?.id===id);if(!entry)return null;const fields={id:'id',editionId:'/editionId',image:'/url',language:'/language',status:'/review',source:'/sourceId'};return fields[parts[3]]?{id:entry.artwork.id,field:fields[parts[3]],transform:['id','editionId'].includes(parts[3])?'legacy-alias':parts[3]==='status'?'visual-review-only':parts[3]==='source'?'source-url-to-id':'identity'}:null;});
 const variants=read(root,'data/publications.json');
 walk(variants,'data/publications.json','',pointer=>{const[,index,f]=pointer.split('/'),record=variants[index],event=record&&p.events.find(s=>s.urls.includes(record.source)&&s.fields.reportedTitle===record.title);const fields={work:'/subject',title:'/reportedTitle',kind:'/eventType',reportedDate:'/date/value',source:'@source'};return event&&fields[f]?{id:event.id,field:fields[f],transform:f==='work'?'registered-parent-subject':f==='kind'?'reported-manifestation-kind':'identity'}:null;});
 const dutch=read(root,'data/reference/dutch.json');
 walk(dutch,'data/reference/dutch.json','',pointer=>{const parts=pointer.split('/');if(parts[1]!=='records')return null;const record=dutch.records[parts[2]],entry=p.editions.find(e=>e.publisherEvidence?.url===record?.url);const fields={title:'/title',isbn:'/isbn13',language:'/language'};return entry&&fields[parts[3]]?{id:entry.edition.id,field:fields[parts[3]],transform:parts[3]==='language'?'nl-NL-to-nl':'identity'}:null;});
 for(const file of ['data/image-review.json','data/image-fetch-results.json'])walk(read(root,file),file,'',()=>null);
 const supplementary={batch:'03',scope:'Cover metadata, publication variants, Dutch publisher snapshots and historical image evidence only; image review remains evidence, not permission.',fields:sourceFields};
 review.sourceFields={catalog:'See differences.json: one row per DB leaf.',supplementary:Object.fromEntries([...new Set(sourceFields.map(f=>f.source))].map(file=>{const rows=sourceFields.filter(f=>f.source===file);return[file,{mapped:rows.filter(f=>f.disposition==='mapped').length,retainedNotMigrated:rows.filter(f=>f.disposition!=='mapped').length,total:rows.length}];}))};
 return {supplementary,views:{batch:'03',views},provenance:{batch:'03',policy:'Default deny: bibliographic metadata is not display permission.',covers:policies},review};
}
module.exports={plan,migratePublications};
