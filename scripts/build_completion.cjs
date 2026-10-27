#!/usr/bin/env node
'use strict';
// Package A is an offline overlay. Historical migrations and release projections
// remain reproducible; no site generator imports this module.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadBundle,ROOT}=require('./validate_foundation.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const json=v=>JSON.stringify(v,null,2)+'\n';
const DATE='2026-10-27',DIR='data/completion/';
const prefixes={work:'wrk',collection:'col',edition:'edn',person:'per',credit:'crd',source:'src',claim:'clm',publication:'pub',membership:'mem'};
const tables={work:'works',collection:'collections',edition:'editions',person:'people',credit:'credits',source:'sources',claim:'claims',publication:'publicationEvents',membership:'collectionMemberships'};
function date(value,meaning='source-reported-release'){return {value,precision:['year','month','day'][value.split('-').length-1],meaning,territory:null};}
function reportedDate(s){
 if(!s)return null;if(/^\d{4}$/.test(s))return s;
 const m=s.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{1,2})(?:st|nd|rd|th)?,?)?\s+(\d{4})$/);
 if(!m)return null;const month=['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(m[1])+1;
 return `${m[3]}-${String(month).padStart(2,'0')}`+(m[2]?`-${m[2].padStart(2,'0')}`:'');
}
function generate({allocate=false}={}){
 const base=loadBundle(path.join(ROOT,'data/v2-shadow')),b=structuredClone(base),review=read(DIR+'review.json'),acq=read(DIR+'acquisition.json');
 const register=fs.existsSync(path.join(ROOT,DIR+'register.json'))?read(DIR+'register.json'):{version:1,allocations:{}};
 const usedText=fs.readdirSync(path.join(ROOT,'data/migration')).filter(f=>f.includes('register')).map(f=>fs.readFileSync(path.join(ROOT,'data/migration',f),'utf8')).join('')+JSON.stringify(base.registry)+JSON.stringify(register);
 const next=Object.fromEntries(Object.entries(prefixes).map(([t,p])=>[t,Math.max(0,...[...usedText.matchAll(new RegExp(p+':(\\d{6})','g'))].map(m=>Number(m[1])))]));
 function id(type,key){const k=type+'/'+key;if(!register.allocations[k]){if(!allocate)throw Error('Unregistered allocation: '+k);register.allocations[k]=prefixes[type]+':'+String(++next[type]).padStart(6,'0');}return register.allocations[k];}
 const map=new Map(Object.values(b).filter(Array.isArray).flat().map(x=>[x.id,x]));
 const byUrl=new Map(b.sources.map(s=>[s.url,s.id]));
 function source(url){if(byUrl.has(url))return byUrl.get(url);const hit=acq.records.find(r=>r.url===url);const s={id:id('source',url),entityType:'source',url,publisher:new URL(url).hostname,sourceType:url.includes('stephenking.com')?'official-bibliography':url.includes('worldcat')?'reference':'official-publisher',publishedAt:null,observedAt:DATE,access:'available',snapshotRef:DIR+(hit?'acquisition.json':'review.json'),notes:'Package A metadata only; exact field locator on each claim; no copied synopsis or artwork.'};b.sources.push(s);b.registry.entries.push({id:s.id,type:'source'});byUrl.set(url,s.id);map.set(s.id,s);return s.id;}
 function claim(r,key,value,urls,note,status='verified'){
  const cid=id('claim',r.id+'/'+key),old=b.claims.filter(c=>c.subject.id===r.id&&c.fieldPath==='/'+key&&c.selected);
  for(const c of old)c.selected=false;
  const c={id:cid,entityType:'claim',subject:{type:r.entityType,id:r.id},fieldPath:'/'+key,value:structuredClone(value),sourceIds:[...new Set([].concat(urls).map(source))],locator:note,status,observedAt:DATE,independentlyConfirmed:false,selected:true,decisionNote:'Field-scoped Package A review. Earlier observations retained, not blanket record certification.'};
  b.claims.push(c);b.registry.entries.push({id:cid,type:'claim'});map.set(cid,c);r.verification.claimIds.push(cid);r[key]=structuredClone(value);
 }
 function add(type,key,fields,urls,note,open=[]){const r={id:id(type,key),entityType:type,verification:{claimIds:[],open}};b[tables[type]].push(r);map.set(r.id,r);b.registry.entries.push({id:r.id,type});for(const[k,v]of Object.entries(fields)){r[k]=v;if(v!==null&&(!Array.isArray(v)||v.length))claim(r,k,v,urls,note);}return r;}
 function person(name,url){const found=b.people.find(p=>p.name===name);if(found)return found;return add('person','person-'+name,{name,aliases:[],pseudonyms:[],externalIds:{}},url,'Explicit named credit; exact identity reviewed, no fuzzy merge.');}
 function credit(subject,name,role,scope,url,creditedAs=null){const p=person(name,url);return add('credit',subject.id+'/'+role+'/'+p.id,{personId:p.id,subject:{type:subject.entityType,id:subject.id},role,scope,creditedAs,characterId:null},url,'Explicit role: '+scope);}
 const dossierRows=[];
 for(const d of review.dossiers){
  if(b.works.concat(b.collections).some(w=>w.originalTitle===d.title))throw Error('Dossier duplicates existing identity '+d.title);
  const hit=acq.records.find(r=>r.url===d.url);if(hit?.status!==200||hit.facts.title!==d.title)throw Error('Unverified dossier header '+d.key);
  const r=d.kind==='anthology'?add('collection',d.key,{originalTitle:d.title,collectionKind:'anthology',aliases:[]},d.url,d.note,['contentsIncomplete','firstPublicationHistory']):add('work',d.key,{kind:d.kind,originalTitle:d.title,originalLanguage:'en',aliases:[]},d.url,d.note,['firstPublicationHistory',...(d.key==='dossier-07'?['unfinishedWork']:[])]);
  if(r.entityType==='work')claim(r,'summary',{en:d.summaryEn},d.url,'Original spoiler-free editorial introduction based on the official description and bibliographic context; no source prose copied.');
  const ref={type:r.entityType,id:r.id};
  add('publication',d.key,{subject:ref,eventType:d.kind==='dramatic-work'?'performance-premiere':'source-reported-release',date:date(d.reportedDate,d.kind==='dramatic-work'?'performance-premiere':'source-reported-release'),editionId:null,part:null,publisher:hit.facts.publisher||null},d.url,d.note,['editionIdentityUnknown']);
  if(d.key==='dossier-09'){
   const url=review.evidence.find(e=>e.key==='ghost-roles').url;
   credit(r,'Stephen King','author','book/libretto; not the songs',url);credit(r,'John Mellencamp','contributor','music and lyrics; not coauthor of the book/libretto',url);
  }else credit(r,'Stephen King','author',d.key==='dossier-06'?'retelling':d.key==='dossier-04'?'collected writing; full contents not yet represented':'text',d.key==='dossier-05'?review.evidence.find(e=>e.key==='beryl').url:d.url,d.key==='dossier-05'?'Beryl Evans':null);
  if(d.key==='dossier-04'){
   credit(r,'Peter Straub','foreword','introduction',d.url);
   for(const workId of review.secretWindowsMemberships){if(!map.has(workId))throw Error('Missing story '+workId);add('membership','secret/'+workId,{collectionId:r.id,workId,order:null,editionIds:[]},d.url,'Explicit named contents in official description; order and edition scope unknown.');}
  }
  if(d.key==='dossier-05'){
   credit(r,'Ned Dameron','illustrator','illustrations',d.url);
   const king=map.get('per:000001');claim(king,'pseudonyms',[...new Set([...king.pseudonyms,'Beryl Evans'])],review.evidence.find(e=>e.key==='beryl').url,'Hachette author biography explicitly identifies Beryl Evans as Stephen King.');
  }
  if(d.key==='dossier-06'){credit(r,'Maurice Sendak','illustrator','illustrations',review.evidence.find(e=>e.key==='hansel-roles').url);credit(r,'Stephen King','foreword','personal introduction',d.url);}
  dossierRows.push({...d,target:ref,status:'identity-registered-history-open'});
 }
 const movieEvidence=review.evidence.find(e=>e.key==='movies-memberships');
 for(const mid of review.membershipReview.promoteIds){const m=map.get(mid);if(!movieEvidence.facts.workIds.includes(m.workId)||m.collectionId!==movieEvidence.facts.collectionId)throw Error('Membership identity mismatch '+mid);for(const k of ['collectionId','workId'])claim(m,k,m[k],movieEvidence.url,review.membershipReview.editionScope);m.verification.open=m.verification.open.filter(x=>!['membershipNotIndependentlyConfirmed','collectionMembership'].includes(x));}
 const publicationReview=[];
 for(const a of acq.records.filter(a=>a.purpose==='reported-date-gap')){
  const alias=b.registry.aliases.find(x=>x.alias===a.legacyStoryId);if(!alias)throw Error('Missing legacy story binding '+a.legacyStoryId);
  const d=reportedDate(a.facts?.released);let event=null;
  if(d){event=add('publication','gap/'+alias.target.id,{subject:alias.target,eventType:'source-reported-release',date:date(d),editionId:null,part:null,publisher:a.facts.publisher||null},a.url,'Released header only; often collection publication, not first publication.');}
  publicationReview.push({legacyId:a.legacyStoryId,workId:alias.target.id,sourceUrl:a.url,reported:a.facts?.released||null,publicationId:event?.id||null,status:d?'reported-date-recorded-first-publication-open':'first-publication-research-required',note:'Unreleased header is not evidence of non-publication.'});
 }
 for(const e of review.evidence.filter(e=>['glass-first','cycle-first'].includes(e.key))){const f=e.facts;add('publication',e.key,{subject:{type:'work',id:f.workId},eventType:'first-publication',date:date(f.date,'first-publication'),editionId:null,part:null,publisher:f.publisher||null},e.url,e.locator,['issueOrPrintingNotIndependentlyExamined']);const gap=publicationReview.find(x=>x.workId===f.workId);if(gap)gap.status='first-publication-year-source-supported';}
 const editionRows=[];
 for(const e of b.editions){
  const a=acq.records.find(a=>a.editionId===e.id),f=a?.facts;
  const row={editionId:e.id,language:e.language,title:e.title,isbn13:e.isbn13,control:[...review.editionPolicy.controlEnIds,...review.editionPolicy.controlNlIds].includes(e.id),status:'blocked-specific-edition-evidence',reviewedFields:[],open:['printing','firstEditionStatus'],sourceUrl:a?.url||null};
  if(e.language==='en'){row.reason='Existing English example lacks ISBN/printing binding. A work page and its list of formats cannot identify the pictured edition.';row.open.push('isbn13','publisher','publicationDate','format');}
  else if(!f||f.isbn13!==e.isbn13||f.language!=='Nederlands'){
   row.status=f?'conflicting-isbn-retained':'blocked-missing-edition-page';row.observedFacts=f||null;row.reason='No enrichment without exact ISBN and actual edition language agreement.';row.open.push('publisher','publicationDate','format','translator');
  }else{
   row.status='field-enriched-printing-open';const fields={publisher:'Luitingh-Sijthoff',format:f.format,title:f.title,language:'nl',isbn13:e.isbn13};
   if(f.publicationDate&&/^\d{2}-\d{2}-\d{4}$/.test(f.publicationDate)){const [day,month,year]=f.publicationDate.split('-');fields.publicationDate=date(`${year}-${month}-${day}`,'edition-publication');}
   for(const[k,v]of Object.entries(fields))if(v!==null){claim(e,k,v,a.url,'Product specifications / exact ISBN '+e.isbn13+' / Taal: Nederlands. Date is publisher-reported edition date, not first publication; site datePublished excluded.');row.reviewedFields.push(k);}
   if(f.translator){const ids=f.translator.split(/,\s*/).map(name=>credit(e,name,'translator','translation of this ISBN edition',a.url).id);claim(e,'translationCredits',ids,a.url,'Explicit Vertaler product specification for exact ISBN '+e.isbn13);row.reviewedFields.push('translationCredits');}
   const closed=['publisher','format','editionIdentityNotIndependentlyConfirmed',...(fields.publicationDate?['editionPublicationDate']:[]),...(f.translator?['translator']:[])];e.verification.open=e.verification.open.filter(k=>!closed.includes(k));if(!e.verification.open.includes('printing'))e.verification.open.push('printing');
   if(!fields.publicationDate)row.open.push('publicationDate');if(!f.translator)row.open.push('translator');row.reason='Exact ISBN/language match; no assertion of first printing or complete edition history.';
  }
  editionRows.push(row);
 }
 // Explicit source URL concordance: sources attached to a registered work,
 // collection or publication are evidence; spelling similarity never is.
 const urlTargets=new Map();function bind(url,ref){if(!urlTargets.has(url))urlTargets.set(url,new Map());urlTargets.get(url).set(ref.id,ref);}
 for(const c of b.claims){let ref=c.subject;if(ref.type==='publication')ref=map.get(ref.id)?.subject;else if(ref.type==='edition')ref=map.get(ref.id)?.publicationOf;if(!ref||!['work','collection'].includes(ref.type))continue;for(const sid of c.sourceIds)bind(map.get(sid).url,ref);}
 bind('https://stephenking.com/works/short/n.html',{type:'work',id:'wrk:000171'});bind('https://stephenking.com/works/uncollected/glass-floor.html',{type:'work',id:'wrk:000224'});
 const comparison=read('data/migration/bibliography-comparison.json');
 const officialRows=read('data/reference/official.json').index;
 function classify(r){let classification,target=null;
  const candidates=urlTargets.get(r.url);if(candidates?.size===1)target=[...candidates.values()][0];
  const type=r.type.replace(/[\[\]]/g,'');
  let aliasEvidence=null;
  if(!target&&r.url){
   const candidate=r.url.replace('/short_story/','/short/').replace('/story_collection/','/collection/').replace('/bachman_novel/','/novel/');
   const explicit=['https://stephenking.com/works/short/n.html','https://stephenking.com/works/short/quitters-inc.html'];
   const row=officialRows.find(x=>x.url===candidate&&(x.title===r.title||explicit.includes(candidate)));
   const targets=urlTargets.get(candidate);
   if(row&&targets?.size===1){target=[...targets.values()][0];aliasEvidence={legacyUrl:r.url,officialUrl:candidate,officialTitle:row.title,reference:'data/reference/official.json#index'};}
  }
  if(target)classification=['Audiobook','Limited Edition'].includes(type)?'manifestation-of-registered-identity':'registered-identity-concordance';
  else if(['Audiobook','Limited Edition'].includes(type))classification='manifestation-candidate-no-new-work';
  else if(type==='Anthology')classification='contribution-container-review-required';
  else if(['Movie','Television','Miniseries','Episodic Online Videos','Podcast'].includes(type))classification='screen-or-audio-project-deferred-package-B';
  else if(type==='Unpublished')classification='unpublished-project-not-published-work';
  else if(type==='Comic')classification='comic-issue-and-creator-review-required';
  else if(['Essay','Interview','Speech','Poem','Magazine Article','Newspaper Article','Introduction'].includes(type))classification='individual-contribution-review-required';
  else if(['Short Story','Novella','Novel','Collection'].includes(type))classification='literary-concordance-review-required';
  else classification='bibliographic-project-review-required';
  return {row:r.row,title:r.title,type:r.type,url:r.url,classification,target,aliasEvidence,evidence:target?'Existing field claims/publication evidence, or explicit reviewed N./Glass Floor concordance.':'Index classification only; no canonical identity or authorship inferred.'};
 }
 const concordance=Object.fromEntries(Object.entries(comparison.comparisons).map(([k,v])=>[k,v.rows.filter(r=>!r.shadowIdentityMatch).map(classify)]));
 const conflicts=read('data/audit.json').conflicts.map((c,i)=>({...c,reviewId:'conflict-'+String(i+1).padStart(2,'0'),status:c.category==='films'?'retained-deferred-package-B':c.title==='Cycle of the Werewolf'?'resolved-date-semantics-first-1983-reprint-1985':c.title.startsWith('The Green Mile')?'resolved-date-semantics-serial-1996-collected-2000':c.title==='Dolores Claiborne'?'unresolved-library-1992-official-1993':c.title==='Rush Call'?'unresolved-index-1999-secret-windows-2000':'retained-detail-preferred-first-publication-open',reviewedAt:DATE}));
 const screenCollisions=read('data/migration/batch-04-decisions.json').sharedSourceUrlCollisions.map(c=>({...c,status:'retained-isolated-screen-identities-deferred-package-B',note:'No merge or media/credit reassignment; historical screen decisions unchanged.'}));
 const grouped=new Map();for(const row of read('data/migration/source-audit.json').sources.index.rows){if(!grouped.has(row.url))grouped.set(row.url,[]);grouped.get(row.url).push(row);}
 const collisions=[...grouped].filter(([,rows])=>rows.length>1).map(([url,rows])=>({url,rows:rows.map(r=>({title:r.title,type:r.type,displayDate:r.displayDate})),status:'repeated-source-url-retained-no-new-identity',note:'Repeated index rows are not additional unique works or proven edition identities.'}));
 const dossierDateConflicts=dossierRows.flatMap(d=>officialRows.filter(r=>r.url===d.url&&r.date?.slice(0,4)!==d.reportedDate.slice(0,4)).map(r=>({target:d.target,indexDisplayDate:r.displayDate,indexNormalizedDate:r.date,detailReportedDate:d.reportedDate,sourceUrl:d.url,status:'detail-preferred-first-publication-open',note:'Retain index observation; do not promote a normalized month start or prior December to exact first publication.'})));
 b.manifest={...b.manifest,scope:'bibliographic-completion-A',baselineCommit:read(DIR+'baseline.json').baseCommit,notes:[...b.manifest.notes,'Package A offline enrichment overlay; frozen release projections remain unchanged. Not a public integration.']};
 const changes={version:1,base:DIR+'baseline.json',scope:'bibliographic-completion-A',tables:{},registry:b.registry,manifest:b.manifest};
 for(const table of Object.keys(base).filter(t=>Array.isArray(base[t]))){const old=new Map(base[table].map(r=>[r.id,r]));const added=b[table].filter(r=>!old.has(r.id));const updated=b[table].filter(r=>old.has(r.id)&&sha(r)!==sha(old.get(r.id))).map(record=>({beforeSha256:sha(old.get(record.id)),record}));if(added.length||updated.length)changes.tables[table]={added,updated};}
 const countBy=(rs,key)=>Object.fromEntries([...new Set(rs.map(r=>r[key]))].sort().map(k=>[k,rs.filter(r=>r[key]===k).length]));
 const ledger={version:1,checked:DATE,scope:'Package A only; classifications are not completeness claims',dossiers:dossierRows,editions:editionRows,publicationGaps:publicationReview,sourceConflicts:conflicts,newDossierDateConflicts:dossierDateConflicts,sourceUrlCollisions:collisions,screenUrlCollisions:screenCollisions,blockers:review.blockers,counts:{baseWorks:base.works.length,works:b.works.length,collections:b.collections.length,dossiers:9,newWorks:8,newCollections:1,memberships:b.collectionMemberships.length,promotedMemberships:5,editionExamples:154,editionStatuses:countBy(editionRows,'status'),editionFieldsReviewed:editionRows.reduce((n,r)=>n+r.reviewedFields.length,0),controlEn:6,controlNl:6,publicationGapStatuses:countBy(publicationReview,'status'),newPublicationEvents:b.publicationEvents.length-base.publicationEvents.length,newClaims:b.claims.length-base.claims.length,openIndexRows:concordance.index.length,indexClassifications:countBy(concordance.index,'classification'),openLinkedBibliographyRows:concordance.bibliography.length,linkedClassifications:countBy(concordance.bibliography,'classification'),sourceConflicts:conflicts.length,newDossierDateConflicts:dossierDateConflicts.length,sourceUrlCollisions:collisions.length,externalMediaPermissionEstablished:0}};
 const media=read('data/media/library.json').records;
 const rights=media.map(a=>{
  const e=b.editions.find(e=>e.id===a.owner.id),ad=b.adaptations.find(d=>d.id===a.owner.id),subject=e&&map.get(e.publicationOf.id);
  const pub=e&&b.publicationEvents.find(p=>p.subject.id===e.publicationOf.id&&p.publisher);
  const candidate=e?(e.language==='nl'?'Luitingh-Sijthoff':pub?.publisher||null):ad?.distribution||null;
  return {artworkId:a.artworkId,owner:a.owner,kind:a.kind,language:a.language,title:e?.title||ad?.title||null,isbn13:e?.isbn13||null,workId:subject?.id||null,originalUrl:a.originalUrl,sourceUrl:a.sourceUrl,contactCandidate:candidate,candidateBasis:e?.language==='nl'?'Official publisher portal; authority over individual artwork must be confirmed.':e?'Publisher observation for the work, not identification of the pictured edition or proof of artwork ownership.':'Retained production/distribution observation; not proof of artwork ownership.',candidateEvidence:e?(pub?{publicationId:pub.id,claimIds:pub.verification.claimIds}:null):ad?{adaptationId:ad.id,claimIds:ad.verification.claimIds}:null,rightsHolder:null,permissionStatus:'not-requested',displayAllowed:false,blockers:e?.language==='nl'?['Written authority and permitted uses not established',...(editionRows.find(r=>r.editionId===e.id)?.status==='conflicting-isbn-retained'?['Source now identifies a different ISBN; request clarification before selecting an asset']:[])]:['Exact artwork authority not established',...(e?['Pictured edition ISBN not established']:['Territory and poster version need confirmation']),'Existing referrer refusal; request approved delivery, do not circumvent']};
 });
 return {register,bundle:b,changes,ledger,concordance,rights};
}
function outputs(options){const g=generate(options);const nl=g.rights.filter(r=>r.language==='nl');const table='| Referentie | Titel | ISBN | Editie-ID | Bron |\n| --- | --- | --- | --- | --- |\n'+nl.map(r=>`| ${r.artworkId} | ${r.title} | ${r.isbn13} | ${r.owner.id} | [Uitgever](${r.sourceUrl}) |`).join('\n');const draft=fs.readFileSync(path.join(ROOT,DIR+'permission-draft.template.md'),'utf8').replace('__NL_TABLE__',table);return new Map([['MEDIA-PERMISSION-DRAFTS.md',draft],[DIR+'changes.json',json(g.changes)],[DIR+'ledger.json',json(g.ledger)],[DIR+'concordance.json',json(g.concordance)],[DIR+'rights-dossiers.json',json({checked:DATE,status:'draft-not-sent',nlCovers:g.rights.filter(r=>r.language==='nl'),englishCovers:g.rights.filter(r=>r.kind==='cover'&&r.language==='en'),posters:g.rights.filter(r=>r.kind==='poster')})],[DIR+'register.json',json(g.register)]]);}
function loadCompletion(){const b=loadBundle(path.join(ROOT,'data/v2-shadow')),changes=read(DIR+'changes.json');for(const[t,delta]of Object.entries(changes.tables)){for(const u of delta.updated){const i=b[t].findIndex(r=>r.id===u.record.id);if(i<0||sha(b[t][i])!==u.beforeSha256)throw Error('Completion baseline record changed '+u.record.id);b[t][i]=structuredClone(u.record);}b[t].push(...structuredClone(delta.added));}b.registry=changes.registry;b.manifest=changes.manifest;return b;}
if(require.main===module){const allocate=process.argv.includes('--allocate');for(const[p,s]of outputs({allocate}))fs.writeFileSync(path.join(ROOT,p),s);console.log(JSON.stringify(generate().ledger.counts,null,2));}
module.exports={generate,outputs,loadCompletion,reportedDate,sha};
