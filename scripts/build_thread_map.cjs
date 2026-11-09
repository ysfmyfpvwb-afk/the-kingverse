'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const IDS=['loc:000007','wrk:000092','adp:000045'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
function generateThreadMap(files,root){
 const records=IDS.map(id=>JSON.parse(files.get('explorer/pilot/data/'+id.replace(':','-')+'/index.json')));
 const sources=new Map(),edges=new Map();
 for(const record of records){if(record.scope!=='default'||!['none','premise'].includes(record.node.spoiler.level))throw Error('Unsafe thread-map record');for(const s of record.sources)sources.set(s.id,s);for(const edge of record.connections)if(IDS.includes(edge.from.id)&&IDS.includes(edge.to.id)&&['none','premise'].includes(edge.spoiler.level)){if(edge.certainty!=='explicit')throw Error('Uncertain example connection');edges.set(edge.id,{id:edge.id,from:edge.from.id,to:edge.to.id,predicate:edge.predicate,explanation:edge.explanation,certainty:edge.certainty,spoiler:edge.spoiler,evidence:edge.evidence});}}
 const graph={startId:IDS[0],nodes:records.map(r=>({id:r.node.id,label:r.node.label,type:r.node.type,kind:r.node.data.kind,releaseYear:r.node.data.releaseYear,description:r.node.description,media:r.media,evidence:r.node.evidence})),edges:[...edges.values()],sources:[...sources.values()]};
 if(graph.edges.length!==2)throw Error('The first Shawshank route must have exactly two existing connections');
 const data=JSON.stringify(graph)+'\n',dataName='map.'+hash(data)+'.json';
 const code=fs.readFileSync(path.join(root,'scripts/thread/core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'scripts/thread/map.js'),'utf8').replaceAll('__DATA__',dataName),jsName='thread.'+hash(code)+'.js';
 const css=fs.readFileSync(path.join(root,'scripts/thread/map.css'),'utf8'),cssName='thread.'+hash(css)+'.css';
 const html=fs.readFileSync(path.join(root,'scripts/thread/index.html.template'),'utf8').replaceAll('__JS__',jsName).replaceAll('__CSS__',cssName);
 return {graph,files:new Map([['index.html',html],[dataName,data],[jsName,code],[cssName,css]].map(([p,v])=>['explorer/pilot/thread/'+p,v]))};
}
module.exports={generateThreadMap,IDS};
