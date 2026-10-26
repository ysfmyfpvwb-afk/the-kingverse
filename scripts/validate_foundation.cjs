#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {isDeepStrictEqual: equal} = require('node:util');
const Ajv2020 = require('ajv/dist/2020').default;
const {ROOT, readGenerated, resolveAlias, projectLegacyRecord} = require('./foundation_compat.cjs');
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas/foundation.schema.json'), 'utf8'));
const schemaValidator = new Ajv2020({allErrors: true, strict: true}).compile(schema);
const TABLES = Object.entries(schema.properties).filter(([,v]) => v.type === 'array').map(([key]) => key);
const TYPES = Object.fromEntries(TABLES.map(k => [k, schema.properties[k].items.$ref.split('/').at(-1)]));
const PREFIXES = {work:'wrk', collection:'col', edition:'edn', person:'per', adaptation:'adp', character:'chr', location:'loc', connection:'rel', source:'src', claim:'clm', credit:'crd', membership:'mem', publication:'pub', artwork:'art', externalReference:'xref'};
function loadBundle(directory = path.join(ROOT, 'data/v2')) {
  return Object.fromEntries(['manifest','registry',...TABLES].map(k => [k, JSON.parse(fs.readFileSync(path.join(directory, `${k}.json`), 'utf8'))]));
}
function pointer(record, pointer) {
  if (/~(?![01])/u.test(pointer)) return {exists:false};
  let value = record;
  for (const key of pointer.slice(1).split('/').map(k => k.replaceAll('~1','/').replaceAll('~0','~'))) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value,key)) return {exists:false};
    value = value[key];
  }
  return {exists:true, value};
}
function validate(bundle, {root = ROOT, checkRuntime = true, checkCompatibility = true} = {}) {
  const errors = [];
  const add = (code, where, message) => errors.push({code, path:where, message});
  if (!schemaValidator(bundle)) {
    for (const e of schemaValidator.errors) add('schema', e.instancePath, e.message);
    return {valid:false, errors, counts:{}};
  }
  if(checkCompatibility && bundle.manifest.scope!=='two-work-foundation-poc')return {valid:false,errors:[{code:'shadow-validator-required',path:'manifest',message:'Use scripts/validate_shadow.cjs for reviewed shadow batch compatibility.'}],counts:{}};
  const records = TABLES.flatMap(k => bundle[k]);
  const map = new Map();
  for (const table of TABLES) for (const r of bundle[table]) {
    if (r.entityType !== TYPES[table]) add('entity-type', r.id, `Expected ${TYPES[table]}`);
    if (!r.id.startsWith(PREFIXES[r.entityType]+':')) add('id-prefix', r.id, 'ID prefix must match type, not title');
    if (map.has(r.id)) add('duplicate-id', r.id, 'Duplicate/conflicting canonical ID');
    map.set(r.id, r);
  }
  const need = (id, allowed, where) => {
    const r = map.get(id);
    if (!r) add('missing-reference', where, `Missing ${id}`);
    else if (allowed && !allowed.includes(r.entityType)) add('reference-type', where, `${id} must be ${allowed.join('/')}`);
    return r;
  };
  const checkRef = (ref, where, allowed) => {
    const r = need(ref.id, allowed || [ref.type], where);
    if (r && r.entityType !== ref.type) add('reference-type', where, `Declared ${ref.type} differs from ${r.entityType}`);
    return r;
  };
  const registry = new Map();
  for (const e of bundle.registry.entries) {
    if (registry.has(e.id)) add('registry-duplicate',e.id,'ID registered twice');
    registry.set(e.id,e.type); need(e.id,[e.type],'registry');
  }
  for (const r of records) if (registry.get(r.id) !== r.entityType) add('unregistered-id',r.id,'Canonical ID missing or rebound in registry');
  const aliases = new Set();
  for (const a of bundle.registry.aliases) {
    if (aliases.has(a.alias) || map.has(a.alias)) add('alias-conflict',a.alias,'Alias must be unique and cannot shadow a canonical ID');
    aliases.add(a.alias); checkRef(a.target,a.alias);
    if (a.kind === 'legacy-route') {
      let url; try { url = new URL(a.alias, 'https://ysfmyfpvwb-afk.github.io/the-kingverse/'); } catch { add('legacy-route',a.alias,'Malformed URL'); continue; }
      const [view, query=''] = url.hash.slice(1).split('?');
      const item = new URLSearchParams(query).get('item');
      const binding = bundle.registry.aliases.find(x => x.alias === item && x.kind === 'legacy-id');
      if (!(['shadow-stories-batch-02','shadow-publications-batch-03'].includes(bundle.manifest.scope)?['books','stories']:['books']).includes(view) || !item?.startsWith(view+':') || !binding || !equal(binding.target,a.target) || (view==='stories'&&a.target.type!=='work')) add('legacy-route',a.alias,'Route and legacy ID must resolve to the same work');
    }
  }
  const dates = (node, where) => {
    if (!node || typeof node !== 'object') return;
    if ('precision' in node && 'value' in node) {
      const patterns = {year:/^\d{4}$/, month:/^\d{4}-(0[1-9]|1[0-2])$/, day:/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/};
      const validDay = node.precision !== 'day' || (() => {const date = new Date(`${node.value}T00:00:00Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10) === node.value;})();
      if (!patterns[node.precision]?.test(node.value) || !validDay) add('date-precision',where,'Date must be real and match its recorded precision');
    }
    for (const [key,value] of Object.entries(node)) dates(value,`${where}/${key}`);
  };
  dates(bundle,'');
  for (const r of records) {
    for (const id of r.verification?.claimIds || []) {
      const claim = need(id,['claim'],r.id);
      if (claim && claim.subject.id !== r.id) add('claim-owner',r.id,'Verification cannot borrow another entity’s claim');
    }
    for (const alias of r.aliases || []) for (const id of alias.spoiler.workIds) need(id,['work'],r.id);
  }
  for (const c of bundle.claims) {
    const subject = checkRef(c.subject,c.id);
    const found = subject && pointer(subject,c.fieldPath);
    if (!found?.exists || /^\/(id|entityType|verification)(\/|$)/.test(c.fieldPath)) add('claim-field',c.id,'Claim must name an existing substantive field');
    if (found?.exists && c.selected && !equal(found.value,c.value)) add('claim-value',c.id,'Selected claim differs from the stored field');
    if (!subject?.verification?.claimIds.includes(c.id)) add('claim-attachment',c.id,'Subject must refer back to the claim');
    for (const id of c.sourceIds) need(id,['source'],c.id);
    if (c.status === 'verified' && c.sourceIds.every(id => ['blocked','unavailable','indexed-only'].includes(map.get(id)?.access))) add('claim-evidence',c.id,'Inaccessible/indexed-only evidence cannot certify a new verified claim');
  }
  // An URL elsewhere in the record is not evidence for an unclaimed content field.
  const substantive = {work:['kind','originalTitle','originalLanguage','aliases','summary'], collection:['originalTitle','collectionKind'], edition:['publicationOf','language','title','isbn13','publisher','publicationDate','format'], person:['name','aliases','pseudonyms'], credit:['personId','subject','role','scope'], character:['name','aliases','continuity'], location:['name','locationKind','aliases','continuity'], connection:['from','predicate','to','certainty','explanation'], membership:['collectionId','workId'], publication:['subject','eventType','date','publisher','reportedTitle'], artwork:['kind','editionId','adaptationId','url','language'], adaptation:['title','format','summary','externalIds','releaseEvents'], externalReference:['legacyId']};
  for (const r of records) for (const field of substantive[r.entityType] || []) {
    if (r[field] === null || r[field] === undefined || (Array.isArray(r[field]) && !r[field].length) || (typeof r[field]==='object' && !Object.keys(r[field]).length)) continue;
    if (!bundle.claims.some(c => c.subject.id === r.id && c.fieldPath === '/'+field && c.selected && c.sourceIds.length)) add('unclaimed-field',`${r.id}/${field}`,'Content field requires a selected source claim');
  }
  for (const e of bundle.editions) {
    checkRef(e.publicationOf,e.id,['work','collection']);
    if (e.isbn13) {
      const sum = [...e.isbn13.slice(0,12)].reduce((n,v,i)=>n+Number(v)*(i%2?3:1),0);
      if ((10-sum%10)%10 !== Number(e.isbn13[12])) add('isbn-checksum',e.id,'Invalid ISBN-13 checksum');
    }
    for (const id of e.translationCredits) { const c=need(id,['credit'],e.id); if(c && (c.role!=='translator'||c.subject.id!==e.id)) add('translation-credit',e.id,'Translator credit must belong to this edition'); }
  }
  const isbnOwners = new Map();
  for (const e of bundle.editions.filter(e=>e.isbn13)) {
    if (isbnOwners.has(e.isbn13)) add('isbn-conflict',e.id,'One ISBN assigned to multiple edition identities; resolve before merging');
    isbnOwners.set(e.isbn13,e.id);
  }
  const credits = new Set();
  for (const c of bundle.credits) {
    need(c.personId,['person'],c.id); checkRef(c.subject,c.id);
    const allowed = ['actor','director','showrunner','creator','screenwriter','producer'].includes(c.role) ? ['adaptation'] : c.role==='translator' ? ['edition'] : c.role==='coauthor' ? ['work'] : ['work','collection','edition'];
    need(c.subject.id,allowed,c.id);
    if (c.characterId) {need(c.characterId,['character'],c.id);if(c.role!=='actor')add('cast-role',c.id,'Only an actor credit can portray a character');}
    const key=JSON.stringify([c.personId,c.subject,c.role,c.scope]);
    if(credits.has(key))add('duplicate-credit',c.id,'Duplicate scoped role'); credits.add(key);
  }
  for (const w of bundle.works) if (!bundle.credits.some(c=>c.subject.id===w.id&&['author','coauthor','contributor'].includes(c.role))) add('missing-author',w.id,'Work needs an author/contributor role');
  const memberships = new Set();
  for (const m of bundle.collectionMemberships) {
    need(m.collectionId,['collection'],m.id);need(m.workId,['work'],m.id);
    for(const id of m.editionIds){const e=need(id,['edition'],m.id);if(e&&e.publicationOf.id!==m.collectionId)add('membership-edition',m.id,'Content edition must belong to its collection');}
    const key=JSON.stringify([m.collectionId,m.workId,[...m.editionIds].sort()]);if(memberships.has(key))add('duplicate-membership',m.id,'Duplicate membership');memberships.add(key);
  }
  const pairs={sequel_to:[['work','work'],['adaptation','adaptation']], prequel_to:[['work','work'],['adaptation','adaptation']], adaptation_of:[['adaptation','work'],['adaptation','collection']], inspired_by:[['adaptation','work'],['adaptation','collection']], appears_in:[['character','work'],['character','adaptation']], mentioned_in:[['character','work'],['location','work']], set_in:[['work','location'],['adaptation','location']], shared_reference:[['work','work'],['work','externalReference']], shared_cosmology:[['work','work'],['work','externalReference']], thematic_parallel:[['work','work'],['work','externalReference']], same_as:[['character','character'],['location','location']]};
  const connections=new Set();
  for(const c of bundle.connections){
    checkRef(c.from,c.id);checkRef(c.to,c.id);
    if(!pairs[c.predicate].some(([a,b])=>a===c.from.type&&b===c.to.type))add('relation-endpoints',c.id,'Predicate does not support these endpoint types');
    if(c.from.id===c.to.id)add('self-connection',c.id,'Self-connection is not supported');
    if(c.predicate==='same_as'&&c.certainty!=='explicit')add('identity-evidence',c.id,'Identity requires explicit evidence');
    for(const id of c.spoiler.workIds)need(id,['work'],c.id);
    if(c.spoiler.level!=='none'&&!c.spoiler.workIds.length)add('spoiler-scope',c.id,'Sensitive connection needs affected works');
    const key=JSON.stringify([c.from,c.predicate,c.to]);if(connections.has(key))add('duplicate-connection',c.id,'Duplicate directed connection');connections.add(key);
  }
  for(const a of bundle.artworks){
    need(a.sourceId,['source'],a.id);
    if(a.kind==='cover') {need(a.editionId,['edition'],a.id);if(a.adaptationId!==null)add('cover-owner',a.id,'A cover belongs only to an edition');const e=map.get(a.editionId);if(e&&e.language!==a.language)add('cover-language',a.id,'Cover must match edition language');}
    else {need(a.adaptationId,['adaptation'],a.id);if(a.editionId!==null)add('poster-owner',a.id,'A poster belongs only to an adaptation');}
  }
  for(const p of bundle.publicationEvents){checkRef(p.subject,p.id,['work','collection']);if(p.date.meaning!==p.eventType)add('publication-meaning',p.id,'Event and date meaning differ');if(p.editionId){const e=need(p.editionId,['edition'],p.id);if(e&&!equal(e.publicationOf,p.subject))add('publication-edition',p.id,'Edition belongs to another subject');}}
  for(const a of bundle.adaptations){
    for(const h of a.statusHistory)for(const id of h.claimIds)need(id,['claim'],a.id);
    for(const r of a.ratingObservations){need(r.sourceId,['source'],a.id);if(r.value!==null&&r.reuseStatus!=='allowed')add('rating-rights',a.id,'Do not import numeric ratings without established reuse permission');}
  }
  const legacy=readGenerated('catalog.js','DB',root), media=readGenerated('media.js','MEDIA',root);
  for(const x of bundle.externalReferences)if(!legacy.works.some(w=>w.id===x.legacyId&&(w.kind==='collection'?'collection':'work')===x.targetType))add('external-legacy-reference',x.id,'Reference must resolve in unchanged legacy catalog');
  if(checkCompatibility){
    const actual=bundle.works.map(w=>bundle.registry.aliases.find(a=>a.kind==='legacy-id'&&a.target.id===w.id&&a.alias.startsWith('work:'))?.alias).sort();
    if(!equal(actual,[...bundle.manifest.migratedLegacyWorkIds].sort())||bundle.works.length!==2)add('migration-scope','manifest','Only the two declared works may be migrated');
    for(const id of bundle.manifest.migratedLegacyWorkIds)try{
      const old=legacy.books.find(w=>w.workId===id);if(!old)throw Error('Missing legacy work');
      const v=projectLegacyRecord(bundle,id);
      if(v.title!==old['Engelse titel']||v.kind!=='novel'||v.year!==old.Jaar||v.reportedDate!==old.reportedDate||v.publisher!==old.publisher||!equal(v.authors,[...old.authors].map(a=>a.name)))add('legacy-projection',id,'Shadow work projection differs from original; review migration');
      for(const input of [old.id,`#books?item=${encodeURIComponent(old.id)}`,`https://ysfmyfpvwb-afk.github.io/the-kingverse/?lang=nl#books?item=${encodeURIComponent(old.id)}`])if(resolveAlias(bundle,input)?.target.id!==bundle.registry.aliases.find(a=>a.alias===id)?.target.id)add('legacy-route',input,'Legacy route no longer resolves to same identity');
      for(const e of legacy.editions.filter(e=>e.workId===id)){
        const target=resolveAlias(bundle,e.id)?.target.id;const next=bundle.editions.find(n=>n.id===target);
        if(!next||next.publicationOf.id!==resolveAlias(bundle,id)?.target.id||next.language!==e.language||next.title!==e.title||next.isbn13!==e.isbn)add('legacy-edition',e.id,'Edition identity or facts changed');
        const oldArt=media.covers[e.coverId], art=oldArt&&bundle.artworks.find(a=>a.id===resolveAlias(bundle,oldArt.id)?.target.id);
        if(oldArt&&(!art||art.editionId!==target||art.url!==oldArt.image||art.language!==oldArt.language))add('legacy-cover',e.id,'Edition cover mapping lost or crossed');
      }
    }catch(e){add('legacy-projection',id,e.message);}
  }
  if(checkRuntime)for(const [file,hash]of Object.entries(bundle.manifest.runtimeHashes)){
    if(!['index.html','app.js','catalog.js','media.js','styles.css','about.html','about.js'].includes(file)){add('runtime-path',file,'Unexpected runtime path');continue;}
    if(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')!==hash)add('runtime-changed',file,'Foundation must not change the active site');
  }
  return {valid:errors.length===0,errors,counts:Object.fromEntries(TABLES.map(t=>[t,bundle[t].length]))};
}
if(require.main===module){
  try {const result=validate(loadBundle(process.argv[2]||undefined)); console.log(JSON.stringify(result,null,2));process.exitCode=result.valid?0:1;}
  catch(error){console.error('Foundation validation failed:',error.message);process.exitCode=1;}
}
module.exports={loadBundle,validate,TABLES,ROOT};
