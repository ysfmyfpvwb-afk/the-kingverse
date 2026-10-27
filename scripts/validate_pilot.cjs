'use strict';
const fs=require('node:fs'),path=require('node:path');
const {ROOT}=require('./validate_foundation.cjs');
function validatePilotOutput(out,root=ROOT){
 const errors=[],fail=(code,message)=>errors.push({code,message});
 const map=new Map(out.full.nodes.map(n=>[n.id,n])),safe=new Set(out.base.nodes.map(n=>n.id));
 const native=new Map(out.full.connections.map(e=>[e.id,e]));
 const seen=new Map();
 const sensitiveLabels=out.plot.nodes.map(n=>n.label);
 for(const[name,p]of out.payloads){
  if(name.includes('search.')){if(p.records.length!==safe.size||new Set(p.records.map(r=>r.id)).size!==safe.size||p.records.some(r=>!safe.has(r.id)))fail('pilot-search-scope',name);for(const label of sensitiveLabels)if(JSON.stringify(p).includes(label))fail('pilot-search-spoiler',label);continue;}
  const id=p.node?.id||p.entityId;
  if(!map.has(id))fail('pilot-entity',name);
  if(Buffer.byteLength(out.files.get('explorer/pilot/'+name))>48*1024)fail('pilot-budget',name);
  if(name.endsWith('/index.json')){
   if(safe.has(id)){if(p.node?.id!==id||p.scope!=='default')fail('pilot-default-node',name);seen.set(id,true);}else if(p.scope!=='gated'||Object.keys(p).some(k=>!['version','scope','entityId','hasPlot','publicJsonIsNotSecret'].includes(k)))fail('pilot-gate',name);
   for(const label of sensitiveLabels)if(JSON.stringify(p).includes(label))fail('pilot-default-spoiler',name+': '+label);
  }
  const sources=new Map((p.sources||[]).map(s=>[s.id,s]));for(const s of sources.values()){const original=out.full.sources.find(x=>x.id===s.id);if(!original||JSON.stringify(original)!==JSON.stringify(s))fail('pilot-source-metadata',name+' '+s.id);}
  function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)walk(x);return;}if(v.sourceIds)for(const sid of v.sourceIds)if(!sources.has(sid))fail('pilot-source',name+' '+sid);if(v.target){if(!map.has(v.target.id))fail('pilot-link',name);if(p.scope==='default'&&!safe.has(v.target.id))fail('pilot-target-spoiler',name);}for(const[k,x]of Object.entries(v))if(k!=='sources')walk(x);}
  walk(p);
  if(p.hasDetails&&!out.payloads.has(name.replace('/index.json','/details.json')))fail('pilot-details',name);
  if(p.scope==='default')for(const label of sensitiveLabels)if(JSON.stringify(p).includes(label))fail('pilot-payload-spoiler',name);
  if(p.parent&&!safe.has(p.parent.id))fail('pilot-parent',name);
  for(const e of p.connections||[]){const old=native.get(e.id);if(!old||JSON.stringify(old.from)!==JSON.stringify(e.from)||JSON.stringify(old.to)!==JSON.stringify(e.to)||e.target.id!==(e.from.id===id?e.to.id:e.from.id)||JSON.stringify(old.certainty)!==JSON.stringify(e.certainty)||JSON.stringify(old.evidence)!==JSON.stringify(e.evidence)||JSON.stringify(old.spoiler)!==JSON.stringify(e.spoiler)||old.verification!==e.verification)fail('pilot-relation-loss',name+' '+e.id);if(p.scope==='default'&&!out.base.connections.some(c=>c.id===e.id))fail('pilot-edge-spoiler',name);}
  for(const section of Object.values(p.sections||{}))if(section.next&&!out.payloads.has(section.next))fail('pilot-next',section.next);
  if(p.next&&!out.payloads.has(p.next))fail('pilot-next',p.next);
  for(const s of p.series||[]){if(id!==s.series.id&&!out.base.connections.some(e=>e.from.id===id&&e.to.id===s.series.id&&e.predicate==='part_of_series'))fail('pilot-series-owner',name);for(const m of s.members){if(!safe.has(m.target.id)||!out.base.connections.some(e=>e.id===m.connectionId&&e.from.id===m.target.id&&e.to.id===s.series.id&&e.predicate==='part_of_series'))fail('pilot-series-navigation',name);}}
  if(p.media?.src){if(!p.media.src.startsWith('assets/media/')||p.media.src.split('/').includes('..')||!fs.existsSync(path.join(root,p.media.src)))fail('pilot-media',name);if(p.media.officialArtwork&&p.media.reason!=='approved-local')fail('pilot-media-permission',name);}
 }
 if(seen.size!==safe.size)fail('pilot-coverage','Every standard node needs a detail payload');
 const expectedBundle=require('./build_completion.cjs').loadCompletion(),expectedCount=require('./explorer_ready_model.cjs').NAV_TABLES.reduce((n,t)=>n+expectedBundle[t].length,0);
 if(out.report.counts.allEntities!==expectedCount||out.full.nodes.length!==expectedCount||out.report.counts.nativeConnections!==94)fail('pilot-boundary','Pilot must not invent canonical records');
 const html=out.files.get('explorer/pilot/index.html');for(const[,url]of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(url.startsWith('#'))continue;const target=new URL(url,'https://example.test/the-kingverse/explorer/pilot/');if(!target.pathname.startsWith('/the-kingverse/'))fail('pilot-subpath',url);const local=decodeURIComponent(target.pathname.slice('/the-kingverse/'.length))+(target.pathname.endsWith('/')?'index.html':'');if(!out.files.has(local)&&!fs.existsSync(path.join(root,local)))fail('pilot-shell-link',url);}
 return errors;
}
function validatePilot(root=ROOT){const errors=[];try{const out=require('./build_pilot.cjs').generatePilot(root);errors.push(...validatePilotOutput(out,root));for(const[p,v]of out.files)if(fs.readFileSync(path.join(root,p),'utf8')!==v)errors.push({code:'pilot-stale',message:p});const list=JSON.parse(fs.readFileSync(path.join(root,'data/pilot/generated-files.json'),'utf8')).files;const actual=[];function scan(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())scan(p);else actual.push(p);}}scan('explorer/pilot');for(const p of actual)if(!out.files.has(p))errors.push({code:'pilot-unexpected-file',message:p});if(JSON.stringify(list)!==JSON.stringify([...out.files.keys()].filter(p=>p.startsWith('explorer/pilot/'))))errors.push({code:'pilot-file-list',message:'Unexpected generated manifest'});}catch(e){errors.push({code:'pilot-build',message:e.message});}return {valid:!errors.length,errors};}
if(require.main===module){const r=validatePilot();console.log(JSON.stringify(r,null,2));process.exitCode=r.valid?0:1;}
module.exports={validatePilot,validatePilotOutput};
