'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {ROOT}=require('./validate_foundation.cjs');
const {combineProjection}=require('./explorer_ready_model.cjs');
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const LIMIT=48*1024, PAGE_SIZE=6;
const slug=id=>{if(!/^(wrk|col|edn|adp|per|chr|loc|ser):\d{6}$/.test(id))throw Error('Invalid pilot ID');return id.replace(':','-');};
const href=id=>'?entity='+encodeURIComponent(id);
function checkPilotBaseline(root=ROOT){const b=read(root,'data/pilot/baseline.json');for(const[p,h]of Object.entries(b.protectedFiles))if(sha(fs.readFileSync(path.join(root,p)))!==h)throw Error('Protected pilot baseline changed: '+p);return b;}
function generatePilot(root=ROOT){
 const baseline=checkPilotBaseline(root),ready=require('./completion_pilot.cjs').completionPilot(root),base=ready.defaultProjection,plot=ready.plotProjection,full=combineProjection(base,plot,{allowPlot:true});
 const native=ready.bundle,premises=read(root,'data/pilot/premise-review.json').claims;
 const newScreenIds=new Set(Object.entries(read(root,'data/completion-b/register.json').allocations).filter(([key])=>key.startsWith('adaptation/')).map(([,id])=>id));
 const map=new Map(full.nodes.map(n=>[n.id,n])),safe=new Map(base.nodes.map(n=>[n.id,n]));
 const summaries=new Map(full.nodes.map(n=>[n.id,{id:n.id,type:n.type,label:n.label,kind:n.data.kind||null,href:href(n.id),...(n.type==='edition'?{language:n.data.language}:{}),verification:n.verification,...(n.type==='edition'?{publisher:n.data.publisher,format:n.data.format,publicationDate:n.data.publicationDate}:{})}]));
 const compact=r=>({...summaries.get(r.id),evidence:r.evidence});
 const files=new Map(),payloads=new Map(),stats=[];
 const version=sha(JSON.stringify([base,plot,read(root,'data/media/library.json'),sha(fs.readFileSync(__filename)),sha(fs.readFileSync(path.join(root,'scripts/pilot/descriptions.cjs'))),read(root,'data/media-release/approvals.json'),premises])).slice(0,16);
 const sources=new Map(full.sources.map(s=>[s.id,s]));
 function emit(name,value){const text=JSON.stringify(value)+'\n',bytes=Buffer.byteLength(text);if(bytes>LIMIT&&!name.includes('search.'))throw Error('Payload exceeds 48 KiB: '+name+' '+bytes);files.set('explorer/pilot/'+name,text);payloads.set(name,value);stats.push({file:name,bytes,gzipBytes:require('node:zlib').gzipSync(text).length});}
 function pack(value){const used=new Set();function walk(o){if(!o||typeof o!=='object')return;if(Array.isArray(o)){for(const v of o)walk(v);return;}if(o.sourceIds)for(const id of o.sourceIds)used.add(id);for(const [k,v]of Object.entries(o))if(k!=='sources')walk(v);}walk(value);return {...value,sources:[...used].map(id=>{const s=sources.get(id);if(!s)throw Error('Unknown source '+id);return s;})};}
 function target(id,mode){if(!map.has(id)||mode==='default'&&!safe.has(id))throw Error('Unsafe pilot target '+id);return summaries.get(id);}
 function sections(p,id){
  const rows={};
  rows.creators=p.credits.filter(c=>c.subject.id===id||c.personId===id).map(c=>({...c,target:target(c.personId===id?c.subject.id:c.personId,p.scope==='default-no-plot'?'default':'plot')}));
  rows.editions=p.nodes.filter(n=>n.type==='edition'&&n.data.publicationOf.id===id).map(compact);
  rows.memberships=p.memberships.filter(m=>m.workId===id||m.collectionId===id).map(m=>({...m,target:target(m.workId===id?m.collectionId:m.workId,'default')}));
  rows.publications=p.publications.filter(r=>r.subject.id===id);
  rows.candidates=[]; // Unconfirmed source hypotheses remain in the internal projection.
  return rows;
 }
 function edges(p,id){return p.connections.filter(e=>e.from.id===id||e.to.id===id).map(e=>({...e,reverse:e.to.id===id,target:target(e.from.id===id?e.to.id:e.from.id,p.scope==='default-no-plot'?'default':'plot')}));}
 function series(p,id){if(map.get(id).type==='series')return [];const ids=p.connections.filter(e=>e.predicate==='part_of_series'&&(e.from.id===id||e.to.id===id)).map(e=>e.to.id);return [...new Set(ids)].map(sid=>({series:target(sid,'default'),members:p.connections.filter(e=>e.predicate==='part_of_series'&&e.to.id===sid).sort((a,b)=>(a.seriesPosition||999)-(b.seriesPosition||999)).map(e=>({target:target(e.from.id,'default'),position:e.seriesPosition||null,evidence:e.evidence,verification:e.verification,connectionId:e.id}))}));}
 for(const node of full.nodes){
  const id=node.id,dir='data/'+slug(id),isSafe=safe.has(id);
  const defaultRows=isSafe?sections(base,id):{};const meta={};
  for(const[k,rows]of Object.entries(defaultRows)){
   meta[k]={total:rows.length,items:rows.slice(0,PAGE_SIZE),next:rows.length>PAGE_SIZE?dir+'/'+k+'-1.json':null};
   for(let i=PAGE_SIZE,page=1;i<rows.length;i+=PAGE_SIZE,page++)emit(dir+'/'+k+'-'+page+'.json',pack({entityId:id,kind:k,items:rows.slice(i,i+PAGE_SIZE),next:i+PAGE_SIZE<rows.length?dir+'/'+k+'-'+(page+1)+'.json':null}));
  }
  const extraSections={};if(isSafe&&['work','collection','adaptation'].includes(node.type)){for(const k of ['creators','editions','publications']){extraSections[k]=meta[k];delete meta[k];}emit(dir+'/details.json',pack({version,scope:'default',entityId:id,sections:extraSections}));}
  const ownEdges=isSafe?edges(base,id):[],plotEdges=edges(full,id).filter(e=>!base.connections.some(c=>c.id===e.id));
  const parent=isSafe&&node.type==='edition'?target(node.data.publicationOf.id,'default'):null;
  const headerCreators=isSafe?base.credits.filter(c=>c.subject.id===id&&['author','coauthor','editor','contributor','illustrator','photographer'].includes(c.role)).map(c=>({person:target(c.personId,'default'),role:c.role,scope:c.scope,creditedAs:c.creditedAs})):[];
  const entry=isSafe?pack({version,scope:'default',node:{...node,evidence:[...node.evidence],href:href(id)},parent,creators:headerCreators,media:base.mediaChoices[id]||null,series:series(base,id),connections:ownEdges,sections:meta,publicationDates:(defaultRows.publications||[]).map(p=>p.date),hasDetails:Object.values(extraSections).some(s=>s.total),hasPlot:plotEdges.length>0,publicJsonIsNotSecret:true}):{version,scope:'gated',entityId:id,hasPlot:true,publicJsonIsNotSecret:true};
  if(isSafe){const own=native.works.concat(native.collections,native.adaptations.filter(r=>newScreenIds.has(r.id))).find(r=>r.id===id);entry.node.description=own?.summary?.en||require('./pilot/descriptions.cjs')(entry,node);if(own?.summary?.en){const c=native.claims.find(c=>c.subject.id===id&&c.fieldPath==='/summary'&&c.selected&&c.status==='verified'&&JSON.stringify(c.value)===JSON.stringify(own.summary));if(!c)throw Error('Unsourced editorial introduction '+id);entry.node.evidence.push(Object.fromEntries(['id','subject','fieldPath','sourceIds','status','observedAt','independentlyConfirmed','selected'].map(k=>[k,c[k]])));}const reviewed=premises.find(r=>r.workId===id);if(reviewed){const claim=native.claims.find(c=>c.id===reviewed.claimId);if(!claim||claim.subject.id!==id||claim.fieldPath!=='/summary'||claim.status!=='verified'||!claim.selected||sha(JSON.stringify(claim.value))!==reviewed.sha256)throw Error('Unreviewed premise change '+id);entry.node.description=claim.value.en;if(!entry.node.evidence.some(c=>c.id===claim.id))entry.node.evidence.push(Object.fromEntries(['id','subject','fieldPath','sourceIds','status','observedAt','independentlyConfirmed','selected'].map(k=>[k,claim[k]])));}}
  emit(dir+'/index.json',isSafe?pack(entry):entry);
  // No sensitive label, source, alias or target is included in the default entry for plot-only entities.
  const sensitivePayload=pack({version,scope:'plot',entityId:id,node:isSafe?null:{...node,href:href(id)},connections:plotEdges,publicJsonIsNotSecret:true});emit(dir+'/plot.json',sensitivePayload);
 }

 const raw=new Map(['works','collections','editions','adaptations','people','characters','locations','series'].flatMap(t=>native[t]).map(n=>[n.id,n]));
 const search=base.nodes.map(n=>{
  const r=raw.get(n.id),alternatives=[...(r.aliases||[]).filter(a=>['none','premise'].includes(a.spoiler?.level)).map(a=>a.value),...(r.pseudonyms||[]),...base.nodes.filter(e=>e.type==='edition'&&e.data.publicationOf.id===n.id).map(e=>e.data.title)];
  return {...summaries.get(n.id),alternatives:[...new Set(alternatives.filter(x=>x!==n.label))]};
 });
 const searchText=JSON.stringify({scope:'default',records:search})+'\n';const searchName='search.'+sha(searchText).slice(0,12)+'.json';files.set('explorer/pilot/'+searchName,searchText);payloads.set(searchName,JSON.parse(searchText));
 const shared=fs.readFileSync(path.join(root,'scripts/pilot/shared.js'),'utf8');
 const detailCode=fs.readFileSync(path.join(root,'scripts/pilot/details.js'),'utf8'),detailsName='details.'+sha(detailCode).slice(0,12)+'.js';files.set('explorer/pilot/'+detailsName,detailCode);
 const client=shared+'\n'+fs.readFileSync(path.join(root,'scripts/pilot/pilot.js'),'utf8').replaceAll('__VERSION__',version).replaceAll('__SEARCH__',searchName).replaceAll('__DETAILS__',detailsName);
 const css=fs.readFileSync(path.join(root,'scripts/pilot/pilot.css'),'utf8');const jsName='pilot.'+sha(client).slice(0,12)+'.js',cssName='pilot.'+sha(css).slice(0,12)+'.css';
 files.set('explorer/pilot/'+jsName,client);files.set('explorer/pilot/'+cssName,css);
 files.set('explorer/pilot/index.html',fs.readFileSync(path.join(root,'scripts/pilot/index.html.template'),'utf8').replaceAll('__JS__',jsName).replaceAll('__CSS__',cssName));
 const indexStats=stats.filter(s=>s.file.endsWith('/index.json')),chunkStats=stats.filter(s=>!s.file.endsWith('/index.json')&&!s.file.endsWith('/plot.json')&&!s.file.endsWith('/details.json'));
 const initial=['index.html',jsName,cssName,'data/wrk-000001/index.json'].map(p=>files.get('explorer/pilot/'+p));
 const report={version:'1.9.2',baseCommit:baseline.baseCommit,dataVersion:version,publicRoute:'explorer/pilot/',protectedFileCount:Object.keys(baseline.protectedFiles).length,scope:'Bibliographic Explorer; archive and two-work preview unchanged',counts:{allEntities:full.nodes.length,defaultEntities:base.nodes.length,plotOnlyEntities:plot.nodes.length,nativeConnections:full.connections.length,defaultConnections:base.connections.length,plotConnections:plot.connections.length,legacyAliases:base.aliases.length},payload:{initialShellAndEntityBytes:initial.reduce((n,s)=>n+Buffer.byteLength(s),0),initialShellAndEntityGzipBytes:initial.reduce((n,s)=>n+require('node:zlib').gzipSync(s).length,0),limitBytes:LIMIT,pageSize:PAGE_SIZE,maxEntityBytes:Math.max(...indexStats.map(x=>x.bytes)),medianEntityBytes:indexStats.map(x=>x.bytes).sort((a,b)=>a-b)[Math.floor(indexStats.length/2)],maxChunkBytes:Math.max(0,...chunkStats.map(x=>x.bytes)),searchBytes:Buffer.byteLength(searchText),searchGzipBytes:require('node:zlib').gzipSync(searchText).length,shellBytes:Buffer.byteLength(files.get('explorer/pilot/index.html')),jsBytes:Buffer.byteLength(client),detailsJsBytes:Buffer.byteLength(detailCode),detailsJsGzipBytes:require('node:zlib').gzipSync(detailCode).length,jsGzipBytes:require('node:zlib').gzipSync(client).length,cssBytes:Buffer.byteLength(css),cssGzipBytes:require('node:zlib').gzipSync(css).length,initialAggregateProjectBytesLoaded:0},assets:{js:jsName,css:cssName,search:searchName,details:detailsName},limitations:['English pilot, incomplete bibliographic and edition histories.','54 source candidates remain explicitly unconfirmed; not extra canonical adaptation links.','Seven native relationships remain provisional; derived/interpretive links keep their labels.','Zero real covers/posters cleared; approved original local SVG placeholders only.','Search includes all safe projected entities; plot-only entities stay absent, including after reveal.','Public JSON is readable directly; spoiler controls are a reading preference, not access control.','No standard website or previous Explorer replacement; broader rollout requires separate review.'],files:stats};
 files.set('data/completion/pilot-report.json',JSON.stringify(report,null,2)+'\n');return {files,payloads,report,base,plot,full};
}
function build(root=ROOT){const out=generatePilot(root);const errors=require('./validate_pilot.cjs').validatePilotOutput(out,root);if(errors.length)throw Error(JSON.stringify(errors));
 const dir=path.join(root,'explorer/pilot');if(fs.existsSync(dir)){const baseline=read(root,'data/pilot/generated-files.json');for(const p of baseline.files){if(!p.startsWith('explorer/pilot/')||!path.resolve(root,p).startsWith(path.resolve(root,'explorer/pilot')+path.sep))throw Error('Unsafe generated path');if(!out.files.has(p)&&fs.existsSync(path.join(root,p)))fs.unlinkSync(path.join(root,p));}}
 for(const[p,v]of out.files){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});if(!fs.existsSync(path.join(root,p))||fs.readFileSync(path.join(root,p),'utf8')!==v)fs.writeFileSync(path.join(root,p),v);}fs.writeFileSync(path.join(root,'data/pilot/generated-files.json'),JSON.stringify({files:[...out.files.keys()].filter(p=>p.startsWith('explorer/pilot/'))},null,2)+'\n');console.log(JSON.stringify({...out.report.counts,payload:out.report.payload}));return out;}
if(require.main===module)build();module.exports={generatePilot,build,checkPilotBaseline,slug,href,LIMIT,PAGE_SIZE};
