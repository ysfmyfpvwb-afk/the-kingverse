'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
function generateThreadMap(files,root,projection,plotProjection){
 const entries=[...files.entries()].filter(([name])=>/^explorer\/pilot\/data\/[^/]+\/index\.json$/.test(name)).map(([,text])=>JSON.parse(text));
 const records=entries.filter(r=>r.scope==='default'&&!['edition','adaptation','person'].includes(r.node.type)&&!(r.node.type==='series'&&r.node.data.seriesKind!=='literary-series')),safeIds=new Set(records.map(r=>r.node.id));
 const edges=new Map(),sourcePool=new Map([...(projection?.sources||[]),...records.flatMap(r=>r.sources)].map(s=>[s.id,s]));
 const sourceList=(nodes,edges)=>{const used=new Set([...nodes.flatMap(n=>n.evidence||[]),...edges.flatMap(e=>e.evidence||[])].flatMap(c=>c.sourceIds));return [...used].map(id=>{const source=sourcePool.get(id);if(!source)throw Error('Missing map evidence '+id);return source;});};
 const connection=edge=>({id:edge.id,kind:'connection',from:edge.from.id,to:edge.to.id,predicate:edge.predicate,...(edge.seriesPosition!==undefined?{seriesPosition:edge.seriesPosition}:{}),explanation:typeof edge.explanation==='string'?edge.explanation:edge.explanation.en,certainty:edge.certainty,verification:edge.verification,spoiler:edge.spoiler,evidence:edge.evidence});
 for(const record of records)for(const edge of record.connections)if(safeIds.has(edge.from.id)&&safeIds.has(edge.to.id))edges.set(edge.id,connection(edge));
 const searchFile=[...files.keys()].find(p=>/^explorer\/pilot\/search\..*\.json$/.test(p));const aliases=new Map(searchFile?JSON.parse(files.get(searchFile)).records.map(r=>[r.id,r.alternatives]):[]);
 const toNode=r=>({id:r.node.id,label:r.node.label,type:r.node.type,kind:r.node.data.kind,format:r.node.data.format,language:r.node.data.language,publisher:r.node.data.publisher,isbn13:r.node.data.isbn13,publicationDate:r.node.data.publicationDate,releaseYear:r.node.data.releaseYear,description:r.node.description||'Explore the recorded connections for this entry.',media:r.media||null,evidence:r.node.evidence,alternatives:aliases.get(r.node.id)||[]});
 const nodes=records.map(toNode),byId=new Map(nodes.map(n=>[n.id,n]));
 const add=(edge)=>{if(safeIds.has(edge.from)&&safeIds.has(edge.to))edges.set(edge.id,edge);};
 for(const m of projection?.memberships||[]){const work=byId.get(m.workId),collection=byId.get(m.collectionId);if(!work||!collection)continue;add({id:m.id,kind:'membership',sourceRecordId:m.id,from:m.workId,to:m.collectionId,predicate:'collected_in',editionIds:m.editionIds,explanation:(m.verification==='provisional'?'Reported appearance: ':'')+work.label+' appears in '+(m.editionIds.length?'selected editions of ':'')+collection.label+'.',certainty:'explicit',verification:m.verification,spoiler:m.spoiler,evidence:m.evidence});}
 const shortcuts=['loc:000007','loc:000005','loc:000004','loc:000006','ser:000001','ser:000002'].filter(id=>safeIds.has(id));
 const graph={startId:shortcuts[0]||nodes[0]?.id,starts:shortcuts,nodes,edges:[...edges.values()],sources:sourceList(nodes,[...edges.values()])};
 if(!graph.startId)throw Error('No public Explorer entities available');
 const data=JSON.stringify(graph)+'\n',dataName='map.'+hash(data)+'.json';
 const code=fs.readFileSync(path.join(root,'scripts/thread/core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'scripts/thread/map.js'),'utf8').replaceAll('__DATA__',dataName),jsName='thread.'+hash(code)+'.js';
 const css=fs.readFileSync(path.join(root,'scripts/thread/map.css'),'utf8'),cssName='thread.'+hash(css)+'.css';
 const html=fs.readFileSync(path.join(root,'scripts/thread/index.html.template'),'utf8').replaceAll('__JS__',jsName).replaceAll('__CSS__',cssName);
 return {graph,files:new Map([['index.html',html],[dataName,data],[jsName,code],[cssName,css]].map(([p,v])=>['explorer/pilot/thread/'+p,v]))};
}
module.exports={generateThreadMap};
