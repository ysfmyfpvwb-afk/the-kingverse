'use strict';
// Batch 02 uses existing work IDs, never title similarity, to resolve identities.
const fs=require('node:fs'),path=require('node:path');
const TYPES={'Verhaal':'short-story','Novelle':'novella','Gedicht':'poem','Scenario':'screenplay','Essay':'essay'};
function migrateStories({root,db,bundle,existing,register,claim,alias,point,assigned,people,overlay}){
 const official=JSON.parse(fs.readFileSync(path.join(root,'data/reference/official.json'),'utf8'));
 const review=JSON.parse(fs.readFileSync(path.join(root,'data/migration/batch-02-review.json'),'utf8'));
 const details=new Map(official.details.map((d,i)=>[d.url,{...d,pointer:'/details/'+i}]));
 const byBook=new Map(db.books.map(b=>[b.id,b]));
 const allocation=JSON.parse(fs.readFileSync(path.join(root,'data/migration/id-register.json'),'utf8'));
 const targets={...allocation.entities,...overlay.entities};
 const rows=[],relations=[],reused=[],variants=[],fields=[];
 const targetFor=key=>{const t=targets[key];if(!t)throw Error('Unallocated identity '+key);return t;};
 const indexes=new Map();
 for(const [i,s]of db.stories.entries()){
  const base='/stories/'+i,ref=targetFor(s.workId);if(ref.type!=='work')throw Error('A story cannot be a collection '+s.id);
  let w=existing.get(ref.id);const isShared=!!w;
  const englishTitle=s['Engelse verhaalnaam'];
  if(isShared){
   if(w.originalTitle!==englishTitle||w.kind!==TYPES[s.Type])throw Error('Conflicting shared identity '+s.id);
   reused.push({legacyStoryId:s.id,legacyWorkId:s.workId,target:ref,reason:'Exact shared legacy workId already maps the book and story views to one work. No title merge.'});
  }else{
   w=register('works',{id:ref.id,entityType:'work',verification:{claimIds:[],open:[...new Set([...(s.audit?.uncertain||[]),'remainingLegacyFieldsNotMigrated'])]},kind:TYPES[s.Type],originalTitle:englishTitle,originalLanguage:'en',aliases:[]});
   if(!w.kind)throw Error('Unreviewed literary type '+s.Type);
   for(const f of ['kind','originalTitle','originalLanguage'])claim(w,f,w[f],s.audit?.fields?.title?.source||s.Bron,`catalog.js#${base}; technical carry-forward, not publication/edition verification`);
   if(overlay.titleVariants[s.workId]){
    const variant=overlay.titleVariants[s.workId];if(variant!==s.referenceTitle)throw Error('Title variant changed '+s.id);
    w.aliases.push({language:'en',value:variant,spoiler:{level:'none',workIds:[]}});
    claim(w,'aliases',w.aliases,s.Bron,`catalog.js#${base}/referenceTitle; case/punctuation variant attached to the same registered identity`);
    point(base+'/referenceTitle',w.id,'/aliases','reviewed-title-variant');variants.push({legacyStoryId:s.id,canonicalTitle:englishTitle,sourceTitle:variant,decision:'Keep original canonical title; retain source spelling as alias; no additional identity.'});
   }
  }
  alias(s.workId,ref);alias(s.id,ref);alias('#stories?item='+encodeURIComponent(s.id),ref);
  point(base+'/id',w.id,'id','legacy-alias');point(base+'/workId',w.id,'id','legacy-alias');point(base+'/Engelse verhaalnaam',w.id,'/originalTitle');point(base+'/Type',w.id,'/kind','registered-type-map');
  for(const [j,a]of s.authors.entries()){
   let person=people.get(a.name);
   if(!person){person=register('people',{id:assigned('people',a.name),entityType:'person',verification:{claimIds:[],open:['identityCarriedForward']},name:a.name,aliases:[],pseudonyms:[],externalIds:{}});claim(person,'name',a.name,s.Bron,`catalog.js#${base}/authors/${j}/name; explicitly registered exact identity`);people.set(a.name,person);}
   let c=bundle.credits.find(c=>c.subject.id===w.id&&c.personId===person.id);
   if(c){if(c.role!==a.role||c.creditedAs!==(a.creditedAs||null))throw Error('Credit conflict '+s.id);}
   else{
    c=register('credits',{id:assigned('credits',s.workId+'#authors/'+j),entityType:'credit',verification:{claimIds:[],open:['roleCarriedForward']},personId:person.id,subject:ref,role:a.role,creditedAs:a.creditedAs||null,scope:'whole-text',characterId:null});
    for(const f of ['personId','subject','role','scope',...(c.creditedAs?['creditedAs']:[])])claim(c,f,c[f],s.audit?.fields?.authors?.source||s.collaboration?.source||s.Bron,`catalog.js#${base}/authors/${j}; existing named role retained, not newly independently verified`);
   }
   point(`${base}/authors/${j}/name`,person.id,'/name');point(`${base}/authors/${j}/role`,c.id,'/role');if(a.creditedAs)point(`${base}/authors/${j}/creditedAs`,c.id,'/creditedAs');
  }
  indexes.set(s.id,{sourcePointer:base,legacyStoryId:s.id,legacyWorkId:s.workId,workId:w.id,membershipIds:[],defaultMembershipId:null,registeredCollectionState:s.collectionIds.length?'has-registered-memberships':'no-registered-collection-not-proof-of-uncollected',sourceUncertainties:[...(s.audit?.uncertain||[])],standaloneEvidencePointer:s.standaloneBookId||s.standalonePublications?.length?`catalog.js#${base}`:null,scope:'identity, scoped credits and membership/view projection only; edition/publication fields retained in source'});
  rows.push({sourcePointer:base,legacyId:s.id,legacyWorkId:s.workId,target:ref,status:'story-identity-credits-memberships-only',identityDecision:isShared?'reuse-book-identity':'new-registered-work',remaining:'publication history, edition/translation facts and other unmapped fields stay in unchanged source'});
 }
 function membership(s,b,base,sourcePointer,bookContents=false){
  const from=targetFor(s.workId),to=targetFor(b.workId);if(to.type!=='collection'||from.type!=='work')throw Error('Wrong membership endpoints');
  const key=b.workId+'|'+s.workId;if(relations.some(r=>r.key===key))throw Error('Duplicate membership '+key);
  const snapshot=details.get(s.Bron);const linked=!!snapshot?.workLinks.some(link=>link.url===b.Bron);
  const historicallyVerified=(s.verifiedCollections||[]).includes(b['Engelse titel']);
  const explicitReview=review.sources.findIndex(r=>r.confirmedMembershipPairs?.includes(key));
  const editionSpecific=explicitReview>=0&&review.sources[explicitReview].editionSpecificPairs?.includes(key);
  const supported=bookContents||(historicallyVerified&&linked)||explicitReview>=0;
  const source=bookContents?b.Bron:explicitReview>=0?review.sources[explicitReview].url:supported?s.audit.fields.collection.source:s.Bron;
  const locator=bookContents?'data/migration/batch-02-review.json#/sources/2':explicitReview>=0?`data/migration/batch-02-review.json#/sources/${explicitReview}/confirmedMembershipPairs`:supported?`data/reference/official.json#${snapshot.pointer}/workLinks; catalog.js#${base}/verifiedCollections`:`catalog.js#${sourcePointer}; inherited relation not established by stored official detail links`;
  const row=register('collectionMemberships',{id:assigned('memberships',key),entityType:'membership',verification:{claimIds:[],open:['collectionOrderNotVerified','editionScopeNotMigrated',...(editionSpecific?['editionSpecificMembership']:[]),...(supported?[]:['membershipNeedsVerification'])]},collectionId:to.id,workId:from.id,order:null,editionIds:[]});
  for(const f of ['collectionId','workId'])claim(row,f,row[f],source,locator,{status:supported?'verified':'provisional',observedAt:bookContents||explicitReview>=0?'2026-10-26':'2026-10-25',decisionNote:supported?'Explicit existing official evidence supports this work/collection pair only; no independent confirmation, complete contents or order claim.':'Preserved uncertain relation; do not treat it as verified universal edition content.'});
  relations.push({key,id:row.id,workId:from.id,collectionId:to.id,sourcePointer,category:bookContents?'collected-novel':'story-view',verification:supported?'source-supported':'provisional',source,locator,orderVerified:false,editionScope:editionSpecific?'mass-market edition; exact edition identity not migrated':'unspecified',notes:editionSpecific?'Evidence supports at least one mass-market edition only; not all editions or translations.':supported?'No claim about every translation or edition.':'Requires collection/edition evidence; absence from a detail page does not prove absence from a collection.'});
  return row;
 }
 for(const [i,s]of db.stories.entries()){
  const view=indexes.get(s.id),base='/stories/'+i;
  for(const [j,cid]of s.collectionIds.entries()){
   const book=byBook.get(cid);if(!book)throw Error('Missing collection '+cid);
   if(s.collections[j]!==book['Engelse titel'])throw Error('Collection label/ID mismatch '+s.id);
   const row=membership(s,book,base,base+'/collectionIds/'+j);
   view.membershipIds.push(row.id);if(cid===s.defaultCollectionId)view.defaultMembershipId=row.id;
   point(base+'/collectionIds/'+j,row.id,'/collectionId','registered-collection-alias');point(base+'/collections/'+j,row.id,'/collectionId','label-checked-against-existing-collection-id');
  }
  if(s.defaultCollectionId&&!view.defaultMembershipId)throw Error('Default collection is not a membership '+s.id);
  const viewIndex=[...indexes.keys()].indexOf(s.id);
  fields.push({pointer:base+'/defaultCollectionId',target:{id:view.workId,artifact:'data/migration/story-views.json',pointer:`/views/${viewIndex}/defaultMembershipId`,transform:'existing-view-choice-not-first-publication'}});
 }
 for(const [i,b]of db.books.entries())for(const [j,entry]of(b.containsWorks||[]).entries()){
  const novel=byBook.get(entry.id);if(!novel||novel['Engelse titel']!==entry.title)throw Error('Unresolved collected novel');
  const row=membership(novel,b,'/books/'+db.books.indexOf(novel),`/books/${i}/containsWorks/${j}`,true);
  point(`/books/${i}/containsWorks/${j}/id`,row.id,'/workId','registered-book-alias');point(`/books/${i}/containsWorks/${j}/title`,targetFor(novel.workId).id,'/originalTitle');
 }
 const trilogyIds=['work:the-talisman','work:black-house','work:other-worlds-than-these'].map(key=>targetFor(key).id);
 const sequel=register('connections',{id:assigned('connections','work:other-worlds-than-these|sequel_to|work:black-house'),entityType:'connection',verification:{claimIds:[],open:[]},from:{type:'work',id:trilogyIds[2]},predicate:'sequel_to',to:{type:'work',id:trilogyIds[1]},certainty:'explicit',explanation:{en:'Other Worlds Than These is the third book in the Talisman trilogy, following Black House.'},spoiler:{level:'none',workIds:[]}});
 const seriesSources=review.sources.slice(-2).map(s=>s.url);
 for(const f of ['from','predicate','to','certainty','explanation'])claim(sequel,f,sequel[f],seriesSources,'data/migration/batch-02-review.json#/sources; official author page and publisher Book 3 metadata only',{status:'verified',observedAt:'2026-10-26',decisionNote:'Explicit human-authorized series relationship. Existing work ID reused; no plot, edition or publication claim.'});
 return {rows,fields,views:{batch:'02-stories-and-memberships',views:[...indexes.values()]},review:{batch:'02-stories-and-memberships',newWorkCount:overlay.entities?Object.keys(overlay.entities).length:0,storyViewCount:rows.length,reusedIdentities:reused,titleVariants:variants,trilogy:{orderedWorkIds:trilogyIds,relationIds:['rel:000001',sequel.id],newWorkIdentities:0,certainty:'explicit',spoiler:'none',sourceUrls:seriesSources},memberships:relations,uncertainStoryRecords:db.stories.map(s=>({legacyStoryId:s.id,workId:targetFor(s.workId).id,open:s.audit?.uncertain||[]})),definitions:{identity:'One frozen legacy workId maps to one canonical work regardless of collection count.',membership:'One distinct collectionId/workId pair, not one edition or one publication.',order:'All null: array/display order is not certified contents order.',sourceSupported:'Direct preserved official detail link plus existing checked collection field, or targeted official collection review, including edition-specific restrictions. Not independent confirmation.',noCollection:'28 views have no registered collection; no assertion that they were never collected.'}}};
}
module.exports={migrateStories};
