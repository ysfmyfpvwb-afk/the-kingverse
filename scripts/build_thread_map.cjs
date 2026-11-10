'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const IDS=['loc:000007','wrk:000092','adp:000045'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
function generateThreadMap(files,root){
 const records=[...files.entries()].filter(([name])=>/^explorer\/pilot\/data\/[^/]+\/index\.json$/.test(name)).map(([,text])=>JSON.parse(text)).filter(r=>r.scope==='default'&&['none','premise'].includes(r.node.spoiler.level));
 const safeIds=new Set(records.map(r=>r.node.id)),sources=new Map(),edges=new Map();
 for(const record of records)for(const edge of record.connections)if(safeIds.has(edge.from.id)&&safeIds.has(edge.to.id)&&edge.certainty==='explicit'&&['none','premise'].includes(edge.spoiler.level))edges.set(edge.id,{id:edge.id,from:edge.from.id,to:edge.to.id,predicate:edge.predicate,...(edge.seriesPosition!==undefined?{seriesPosition:edge.seriesPosition}:{}),explanation:edge.explanation,certainty:edge.certainty,spoiler:edge.spoiler,evidence:edge.evidence});
 const connected=new Set([...edges.values()].flatMap(e=>[e.from,e.to]));
 const selected=records.filter(r=>connected.has(r.node.id));for(const record of selected)for(const source of record.sources)sources.set(source.id,source);
 const starts=['loc:000007','loc:000005','loc:000004','loc:000006','ser:000001','ser:000002'].filter(id=>connected.has(id));
 const graph={startId:IDS[0],starts,nodes:selected.map(r=>({id:r.node.id,label:r.node.label,type:r.node.type,kind:r.node.data.kind,format:r.node.data.format,releaseYear:r.node.data.releaseYear,description:r.node.description,media:r.media,evidence:r.node.evidence})),edges:[...edges.values()],sources:[...sources.values()]};
 for(const id of IDS)if(!connected.has(id))throw Error('Missing original Shawshank stop');
 const data=JSON.stringify(graph)+'\n',dataName='map.'+hash(data)+'.json';
 const code=fs.readFileSync(path.join(root,'scripts/thread/core.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'scripts/thread/map.js'),'utf8').replaceAll('__DATA__',dataName),jsName='thread.'+hash(code)+'.js';
 const css=fs.readFileSync(path.join(root,'scripts/thread/map.css'),'utf8'),cssName='thread.'+hash(css)+'.css';
 const html=fs.readFileSync(path.join(root,'scripts/thread/index.html.template'),'utf8').replaceAll('__JS__',jsName).replaceAll('__CSS__',cssName);
 return {graph,files:new Map([['index.html',html],[dataName,data],[jsName,code],[cssName,css]].map(([p,v])=>['explorer/pilot/thread/'+p,v]))};
}
module.exports={generateThreadMap,IDS};
