'use strict';
// Project the shared canonical additions into the existing DB format. Historical
// catalog.js, legacy IDs, media.js and original imports remain untouched.
const fs=require('node:fs'),path=require('node:path');
const {ROOT,readGenerated}=require('./foundation_compat.cjs');
function generateMainCompletion(){
 const base=readGenerated('catalog.js','DB'),db=structuredClone(base);
 const bundle=require('./completion_b.cjs').extendCompletionB(require('./build_completion.cjs').loadCompletion());
 const canonical=new Map(Object.values(bundle).filter(Array.isArray).flat().filter(x=>x.id).map(x=>[x.id,x]));
 const aliases=new Map(bundle.registry.aliases.map(a=>[a.alias,a.target]));
 const legacy=new Map(),credits=bundle.credits,people=new Map(bundle.people.map(p=>[p.id,p]));
 const sources=new Map(bundle.sources.map(s=>[s.id,s.url]));
 const sourceUrls=r=>[...new Set((r.verification?.claimIds||[]).flatMap(id=>{const c=canonical.get(id);return c?.selected?c.sourceIds.map(id=>sources.get(id)):[]}).filter(Boolean))];
 const dossier=new Map(JSON.parse(fs.readFileSync(path.join(ROOT,'data/completion/review.json'))).dossiers.map(d=>[d.title,d]));
 const type={novel:'Roman',novella:'Novelle','short-story':'Verhaal',nonfiction:'Non-fictie',essay:'Essay',screenplay:'Scenario','children-book':'Kinderboek','dramatic-work':'Musical',comic:'Strip'};
 for(const group of ['books','stories','films'])for(const r of db[group]){const target=aliases.get(r.id)||aliases.get(r.workId);if(target){r.canonicalId=target.id;const k=target.type+'/'+target.id;if(!legacy.has(k)||group==='books')legacy.set(k,{kind:group,id:r.id,title:r['Engelse titel']||r['Engelse verhaalnaam']||r['Verfilming (EN)']});}}
 function makers(r){return credits.filter(c=>c.subject.id===r.id).map(c=>({name:people.get(c.personId).name,role:c.scope.startsWith('music and lyrics')?'composer':c.scope.startsWith('book/libretto')?'librettist':c.role,scope:c.scope,...(c.creditedAs?{creditedAs:c.creditedAs}:{})}));}
 const bookNodes=bundle.works.filter(w=>dossier.has(w.originalTitle)).concat(bundle.collections.filter(c=>dossier.has(c.originalTitle)));
 for(const r of bookNodes){if(legacy.has(r.entityType+'/'+r.id))continue;const dates=bundle.publicationEvents.filter(p=>p.subject.id===r.id).map(p=>p.date.value).sort(),authors=makers(r);
  const row={id:'books:'+r.id.replace(':','-'),workId:r.id,canonicalId:r.id,'Engelse titel':r.originalTitle,'Nederlandse titel (indicatief)':null,Type:r.entityType==='collection'?'Bundel / verzameling':type[r.kind]||'Bijdrage',Jaar:dates[0]?Number(dates[0].slice(0,4)):null,Auteur:authors.filter(a=>['author','coauthor','librettist'].includes(a.role)).map(a=>a.creditedAs||a.name).join(' / '),authors,editionIds:[],Bron:sourceUrls(r)[0],sources:sourceUrls(r),summary:r.summary||{en:dossier.get(r.originalTitle).summaryEn},reportedDate:dates[0]||null,status:'published',audit:{uncertain:[]}};
  if(authors.some(a=>a.role!=='author'&&a.role!=='translator'))row.collaboration={kind:'distinct-contributions'};
  db.books.push(row);db.works.push({id:r.id,title:r.originalTitle,kind:r.entityType==='collection'?'collection':'literary-work',authors});legacy.set(r.entityType+'/'+r.id,{kind:'books',id:row.id,title:r.originalTitle});
 }
 for(const group of ['books','stories'])for(const row of db[group]){const r=canonical.get(row.canonicalId);if(!r)continue;if(r.summary)row.summary=r.summary;row.editionIds??=[];
  const first=bundle.publicationEvents.find(p=>p.subject.id===r.id&&p.eventType==='first-publication');if(first&&!row.firstPublication)row.firstPublication={date:first.date.value,precision:first.date.precision,kind:'first-publication',source:sourceUrls(first)[0]};}
 for(const e of db.editions){const id=aliases.get(e.id)?.id,r=canonical.get(id);if(!r)continue;Object.assign(e,{canonicalId:id,publisher:r.publisher,format:r.format,publicationDate:r.publicationDate,translators:r.translationCredits.map(id=>people.get(canonical.get(id).personId).name)});if(r.verification.claimIds.some(id=>{const c=canonical.get(id);return c.selected&&c.fieldPath==='/title'&&c.status==='verified'&&c.observedAt==='2026-10-27';}))e.title=r.title;}
 for(const m of bundle.collectionMemberships){const work=legacy.get('work/'+m.workId),collection=legacy.get('collection/'+m.collectionId);if(!work||!collection)continue;const story=db.stories.find(s=>s.canonicalId===m.workId);if(!story)continue;story.collectionIds??=[];story.collections??=[];if(!story.collectionIds.includes(collection.id))story.collectionIds.push(collection.id);if(!story.collections.includes(collection.title))story.collections.push(collection.title);if(!story.defaultCollectionId){story.defaultCollectionId=collection.id;story['Engelse bundel']=collection.title;}}
 for(const r of bundle.adaptations){if(legacy.has('adaptation/'+r.id))continue;const row={id:'films:'+r.id.replace(':','-'),canonicalId:r.id,'Verfilming (EN)':r.title,Jaar:r.releaseYear,Medium:({film:'Film','tv-series':'Televisieserie',miniseries:'Miniserie','tv-movie':'Televisiefilm'})[r.format]||'Televisie',summary:r.summary,status:r.statusHistory.at(-1)?.status||'unconfirmed',release:r.releaseEvents[0]?.value||null,dateMeaning:r.releaseEvents[0]?.meaning,Bron:sourceUrls(r)[0],sources:sourceUrls(r),sourceWorks:[],'Bronwerk (EN)':'',Relatie:'',audit:{uncertain:[]}};
  for(const m of r.makerObservations||[]){const key={director:'director',showrunner:'showrunner',screenwriter:'screenwriters'}[m.role];if(key)row[key]=key==='screenwriters'?[m.creditText]:m.creditText;}
  db.films.push(row);legacy.set('adaptation/'+r.id,{kind:'films',id:row.id,title:r.title});}
 // Connect only the public, spoiler-safe subset. Names/aliases marked plot or
 // ending never enter the main-site addition payload.
 const safe=r=>!['plot','ending'].includes(r.spoiler?.level);
 function target(ref){const r=canonical.get(ref.id);if(!r||!safe(r))return null;return legacy.get(ref.type+'/'+ref.id)||{kind:'explorer',id:r.id,title:r.name||r.originalTitle||r.title};}
 const links=new Map();
 for(const c of bundle.connections.filter(safe)){const a=target(c.from),b=target(c.to);if(!a||!b)continue;for(const [from,to,reverse]of [[c.from,b,false],[c.to,a,true]]){if(!links.has(from.id))links.set(from.id,[]);links.get(from.id).push({target:to,predicate:c.predicate,reverse,certainty:c.certainty,explanation:c.explanation.en,sourceUrls:sourceUrls(c),...(c.seriesPosition?{position:c.seriesPosition}:{})});}}
 for(const group of ['books','stories','films'])for(const r of db[group]){if(!r.canonicalId)continue;r.connected=links.get(r.canonicalId)||[];r.series=[];if(group==='films'&&r.id.startsWith('films:adp-')){const screen=r.connected.find(c=>c.target.kind==='films'&&!c.reverse&&['sequel_to','inspired_by'].includes(c.predicate));if(screen){const target=db.films.find(f=>f.id===screen.target.id);r.sourceWorkKind='screen';r['Bronwerk (EN)']=screen.target.title+' ('+target.Jaar+')';r.Relatie=screen.predicate==='sequel_to'?'Vervolgfilm':'Geïnspireerd door film';}}
  for(const c of bundle.connections.filter(c=>c.predicate==='part_of_series'&&c.from.id===r.canonicalId&&safe(c))){const series=canonical.get(c.to.id);r.series.push({id:series.id,name:series.name,position:c.seriesPosition||null,members:bundle.connections.filter(m=>m.predicate==='part_of_series'&&m.to.id===series.id&&safe(m)).sort((a,b)=>(a.seriesPosition||999)-(b.seriesPosition||999)).map(m=>({target:target(m.from),position:m.seriesPosition||null})).filter(m=>m.target)});}
 }
 for(const r of db.tower){const book=db.books.find(b=>b['Engelse titel']===r['Werk / verwijzing']);if(book){r.canonicalId=book.canonicalId;r.connected=(book.connected||[]).filter(c=>['character','location'].includes(canonical.get(c.target.id)?.entityType));}}
 const patch={};for(const group of ['books','stories','films','tower','editions','works']){const old=new Map(base[group].map((r,i)=>[r.id||'row-'+i,r]));patch[group]={add:[],update:[]};for(const [i,r]of db[group].entries()){const key=r.id||'row-'+i,prior=old.get(key);if(!prior)patch[group].add.push(r);else{const fields=Object.fromEntries(Object.entries(r).filter(([k,v])=>JSON.stringify(v)!==JSON.stringify(prior[k])));if(Object.keys(fields).length)patch[group].update.push({id:r.id,index:i,fields});}}}
 return {db,patch};
}
function build(){const out=generateMainCompletion();fs.writeFileSync(path.join(ROOT,'catalog-completion.js'),'// Generated from the shared canonical completion records; no separate editorial source.\nconst CATALOG_UPDATES = '+JSON.stringify(out.patch)+';\n');console.log(JSON.stringify({books:out.db.books.length,stories:out.db.stories.length,films:out.db.films.length,editions:out.db.editions.length}));return out;}
if(require.main===module)build();module.exports={generateMainCompletion,build};
