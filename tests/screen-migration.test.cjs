'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {ROOT,loadBundle,validate}=require('../scripts/validate_foundation.cjs'),{generateShadow,hash,outputFiles}=require('../scripts/migrate_shadow.cjs'),{readGenerated,resolveAlias}=require('../scripts/foundation_compat.cjs'),{validateScreens}=require('../scripts/validate_screens.cjs');
const read=f=>JSON.parse(fs.readFileSync(ROOT+'/'+f,'utf8')),fresh=()=>loadBundle(ROOT+'/data/v2-shadow'),views=()=>read('data/migration/screen-views.json'),policy=()=>read('data/migration/poster-provenance.json'),db=readGenerated('catalog.js','DB');
const id=(b,legacy)=>b.registry.aliases.find(a=>a.alias===legacy)?.target.id;
test('96 exact legacy screen identities and URLs resolve to opaque registered productions, preserving English titles',()=>{
 const b=fresh();assert.equal(b.adaptations.length,96);assert.equal(Object.keys(read('data/migration/batch-04-register.json').adaptations).length,96);
 for(const f of db.films){const a=b.adaptations.find(a=>a.id===id(b,f.id));assert.ok(a);assert.match(a.id,/^adp:\d{6}$/);assert.equal(a.title,f['Verfilming (EN)']);const r=resolveAlias(b,'https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=nl#films?item='+encodeURIComponent(f.id)+'&q=King&filter=Film');assert.equal(r.target.id,a.id);assert.equal(r.target.type,'adaptation');assert.equal(r.state.language,'nl');assert.equal(r.state.q,'King');}
 assert.equal(resolveAlias(b,'#books?item=films:carrie-1976'),null);assert.equal(resolveAlias(b,'#films?item=books:carrie'),null);
});
test('Remakes, alternative labels, sequels and common source URLs do not merge distinct productions',()=>{
 const b=fresh();for(const group of [['films:carrie-1976','films:carrie-2002','films:carrie-2013','films:carrie-2026','films:the-rage-carrie-2-1999'],['films:it-1990','films:it-2017','films:it-chapter-two-2019'],['films:firestarter-1984','films:firestarter-2022'],['films:the-stand-1994','films:the-stand-2020']])assert.equal(new Set(group.map(legacy=>id(b,legacy))).size,group.length);
 assert.equal(views().comparisonGroups.length,11);assert.ok(views().comparisonGroups.every(g=>g.meaning.includes('not an inferred sequel')));assert.equal(b.adaptations.find(a=>a.id===id(b,'films:it-2017')).aliases[0].value,"IT - Part 1: The Losers' Club");
});
test('Explicit literary relations support many films per work and multiple works per film, without collection inflation',()=>{
 const b=fresh(),r=read('data/migration/batch-04-decisions.json');assert.equal(r.sourceSupportedLiteraryRelations,14);assert.equal(r.provisionalNativeLiteraryRelations,2);assert.equal(r.screenRelations,1);assert.equal(r.sourceSupportedScreenRelations,0);assert.equal(r.provisionalScreenRelations,1);
 const cat=id(b,'films:cat-s-eye-1985');const edges=b.connections.filter(c=>c.from.id===cat);assert.equal(edges.length,2);assert.ok(edges.every(c=>c.to.type==='work'&&c.predicate==='adaptation_of'));
 const fireWork=id(b,'work:firestarter');assert.equal(b.connections.filter(c=>c.to.id===fireWork&&c.from.type==='adaptation').length,2);
 const context=views().views.flatMap(v=>v.sourceCandidates).filter(c=>c.category==='collection-context');assert.equal(context.length,18);assert.ok(context.every(c=>c.connectionId===null));
 assert.equal(b.connections.filter(c=>c.from.id===id(b,'films:creepshow-1982')).length,0);assert.equal(b.adaptations.find(a=>a.id===id(b,'films:creepshow-1982')).originalScreenplay,true);
 const haven=b.connections.find(c=>c.from.id===id(b,'films:haven-2010'));assert.equal(haven.predicate,'inspired_by');assert.equal(haven.certainty,'explicit');
});
test('Unconfirmed source references remain candidates; false endpoints, evidence upgrades and collection-as-source links fail',()=>{
 const b=fresh(),v=views(),p=policy();assert.deepEqual(validateScreens(b,v,p),[]);const c=v.views.flatMap(v=>v.sourceCandidates).find(c=>c.category==='unconfirmed-literary-source');c.verification='source-supported';assert.ok(validateScreens(b,v,p).some(e=>e.code==='screen-source-evidence'));
 const v2=views();v2.views[0].sourceCandidates[0].target.id='wrk:999999';assert.ok(validateScreens(b,v2,p).some(e=>e.code==='screen-source-reference'));
 const v3=views();const row=v3.views.find(v=>v.sourceCandidates.some(c=>c.category==='collection-context'));row.sourceCandidates.find(c=>c.category==='collection-context').connectionId=row.verifiedRelationIds[0];assert.ok(validateScreens(b,v3,p).some(e=>e.code==='screen-context-not-adaptation'));
});
test('Mercy announcement and Trucks conflicting years remain explicit; no invented release day',()=>{
 const b=fresh(),a=b.adaptations.find(a=>a.id===id(b,'films:mercy-2012')),v=views().views.find(v=>v.legacyId==='films:mercy-2012');assert.equal(a.releaseYear,2014);assert.deepEqual(a.releaseEvents,[{value:'2014',precision:'year',meaning:'source-reported-release',territory:null}]);assert.equal(v.legacyReportedDate,'2012-12-14');assert.equal(v.legacyYear,2012);
 const trucks=b.adaptations.find(a=>a.id===id(b,'films:trucks-1997'));assert.equal(trucks.releaseYear,null);assert.equal(trucks.releaseEvents[0].value,'2000-12-26');assert.equal(read('data/migration/batch-04-decisions.json').yearConflicts.length,2);
});
test('Four TBD productions and My Pretty Pony are unknown; announced Carrie season is not released',()=>{
 const b=fresh();assert.equal(b.adaptations.filter(a=>a.statusHistory.at(-1).status==='unknown').length,5);assert.ok(b.adaptations.filter(a=>a.statusHistory.at(-1).status==='unknown').every(a=>!a.releaseEvents.length));
 const c=b.adaptations.find(a=>a.id===id(b,'films:carrie-2026'));assert.equal(c.format,'tv-series');assert.equal(c.productionUnits.length,2);assert.equal(c.productionUnits[0].episodeCount,8);assert.equal(c.productionUnits[0].status,'released');assert.equal(c.productionUnits[1].status,'announced');assert.equal(c.productionUnits[1].releaseDate,null);
 c.productionUnits[1].releaseDate='2027-01-01';assert.ok(validateScreens(b,views(),policy()).some(e=>e.code==='unreleased-unit-date'));
});
test('82 posters retain exact legacy owner and URL; no 2022 Firestarter poster or director is applied to 1984',()=>{
 const b=fresh(),m=readGenerated('media.js','MEDIA'),p=policy();assert.equal(b.artworks.filter(a=>a.kind==='poster').length,82);assert.equal(p.posters.length,96);assert.equal(p.posters.filter(p=>!p.artworkId).length,14);
 for(const f of db.films){const old=m.films[f['Verfilming (EN)']+'|'+(f.Jaar??'None')],entry=p.posters.find(p=>p.legacyId===f.id);assert.equal(entry.adaptationId,id(b,f.id));if(old){const art=b.artworks.find(a=>a.id===entry.artworkId);assert.equal(art.url,old.image);assert.equal(art.adaptationId,id(b,f.id));assert.equal(art.language,'en');}else assert.equal(entry.artworkId,null);}
 assert.equal(p.posters.find(p=>p.legacyId==='films:firestarter-1984').artworkId,null);const person=new Map(b.people.map(p=>[p.id,p.name]));assert.deepEqual(b.credits.filter(c=>c.subject.id===id(b,'films:firestarter-1984')).map(c=>person.get(c.personId)),['Mark L. Lester']);
});
test('Poster permissions reject visual-only approval, invented local assets, missing decisions and crossed ownership',()=>{
 const b=fresh();for(const mutate of [p=>p.posters[0].displayAllowed=true,p=>p.posters[0].approvedLocalAsset='/unlicensed.jpg',p=>p.posters.pop(),p=>{p.posters[0].adaptationId=p.posters[1].adaptationId;}]){const p=policy();mutate(p);assert.ok(validateScreens(b,views(),p).length);}
 assert.ok(policy().posters.every(p=>!p.displayAllowed&&p.rights.status==='not-established'&&p.availability.status==='not-currently-assessed'));
});
test('No numeric ratings or legacy descriptions imported; metadata descriptions are original and spoiler neutral',()=>{
 const b=fresh(),r=read('data/migration/screen-rights-dispositions.json');assert.equal(r.records.length,4);assert.equal(r.records.filter(r=>r.ratingDisposition==='retained-in-legacy-needs-review').length,3);assert.equal(r.records.filter(r=>r.descriptionDisposition==='retained-in-legacy-needs-review').length,2);
 for(const a of b.adaptations){assert.deepEqual(a.ratingObservations,[]);assert.ok(a.summary.en.endsWith('Source relationships and production uncertainties are recorded separately.'));}
 for(const f of db.films.filter(f=>f.imdb))assert.ok(!b.adaptations.some(a=>a.summary.en===f.imdb.summary.en));
});
test('Reviewed maker credits retain explicit episode scopes and reuse Stephen King; damaged legacy names do not mint people',()=>{
 const b=fresh(),review=read('data/migration/batch-04-decisions.json');assert.equal(review.newPeople,16);assert.equal(review.newScopedCredits,19);assert.equal(review.makerEncodingConflicts.length,4);assert.ok(b.people.every(p=>!p.name.includes('\ufffd')));assert.equal(b.people.filter(p=>p.name==='Stephen King').length,1);
 const king=b.people.find(p=>p.name==='Stephen King');assert.ok(b.credits.some(c=>c.personId===king.id&&c.role==='producer'&&c.subject.id===id(b,'films:carrie-2026')));assert.ok(b.credits.some(c=>c.scope==='season-1 episode 103'));
 assert.ok(b.adaptations.find(a=>a.id===id(b,'films:cell-2016')).makerObservations.some(m=>m.creditText.includes('\ufffd')));
});
test('Every Batch 03 record is frozen; no edition, literary, membership, character or Tower migration',()=>{
 const b=fresh(),register=read('data/migration/batch-04-register.json'),all=new Map(Object.values(b).filter(Array.isArray).flat().filter(x=>x.id).map(x=>[x.id,x]));for(const[id,snapshot]of Object.entries(register.preservedEntities))assert.equal(hash(JSON.stringify(all.get(id))),snapshot.sha256,id);
 const old=generateShadow(ROOT,{batch:'03'}).bundle;for(const table of ['works','collections','editions','publicationEvents','collectionMemberships','characters','locations','externalReferences'])assert.deepEqual(b[table],old[table]);for(const c of b.connections.filter(c=>!c.from.type.startsWith('adaptation')))assert.ok(old.connections.some(r=>r.id===c.id));
 assert.equal(b.works.length,241);assert.equal(b.editions.length,154);assert.equal(b.publicationEvents.length,239);
});
test('Full offline projection and supplementary evidence are reproducible, including deferred restricted fields',()=>{
 const fields=read('data/migration/batch-04-source-fields.json').fields;assert.equal(new Set(fields.map(f=>f.source+'#'+f.pointer)).size,fields.length);assert.deepEqual(generateShadow().screens.supplementary.fields,fields);for(const[name,value]of outputFiles())assert.equal(fs.readFileSync(ROOT+'/'+name,'utf8'),value,name);
 assert.ok(fields.some(f=>f.pointer.includes('/imdb/rating')&&f.disposition==='retained-in-source-not-migrated'));const ledger=read('data/migration/differences.json');assert.equal(ledger.fields.filter(f=>f.disposition==='mapped').length,5657);assert.equal(ledger.completeMigration,false);assert.equal(ledger.screenRecords.length,96);
 assert.equal(validate(badStatusBundle(),{checkCompatibility:false}).valid,false);
 function badStatusBundle(){const b=fresh();b.adaptations[0].statusHistory[0].claimIds=[b.works[0].verification.claimIds[0]];return b;}
});
