'use strict';
// Reuse the established typed/spoiler/media projection without rewriting the
// historical migration or readiness fixtures.
const fs=require('node:fs'),path=require('node:path');
const {ROOT}=require('./validate_foundation.cjs');
const {loadCompletion}=require('./build_completion.cjs');
const {createReadyProjection,selectMedia}=require('./explorer_ready_model.cjs');
function completionPilot(root=ROOT){
 if(root!==ROOT)throw Error('Completion inputs belong to the registered project root');
 const bundle=loadCompletion(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const valid=require('./validate_completion.cjs').validateCompletion(bundle);if(!valid.valid)throw Error(JSON.stringify(valid.errors));
 const selected=new Set(bundle.claims.filter(c=>c.selected).map(c=>c.id)),projectionBundle=structuredClone(bundle);for(const table of Object.values(projectionBundle).filter(Array.isArray))for(const r of table)if(r.verification)r.verification.claimIds=r.verification.claimIds.filter(id=>selected.has(id));
 const review=read('data/migration/batch-05-review.json');
 const p=createReadyProjection(projectionBundle,{assessments:review.assessments,screenCandidates:review.screenCandidates,storyViews:read('data/migration/story-views.json').views,media:read('data/media/library.json')});
 p.defaultProjection.mediaChoices=Object.fromEntries(p.defaultProjection.nodes.map(n=>[n.id,selectMedia(p.defaultProjection,n.id)]).filter(([,v])=>v));
 return {...p,bundle};
}
module.exports={completionPilot};
