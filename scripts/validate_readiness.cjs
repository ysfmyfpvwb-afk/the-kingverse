'use strict';
const fs=require('node:fs'),path=require('node:path');
const {ROOT,loadBundle}=require('./validate_foundation.cjs');
const {generateReadyFiles,checkBaseline}=require('./build_explorer_ready.cjs');
const {validateReady}=require('./validate_explorer_ready.cjs');
const {validateMedia}=require('./build_media_library.cjs');
function validateReadiness(root=ROOT){const errors=[];try{checkBaseline(root);const bundle=loadBundle(path.join(root,'data/v2-shadow')),read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));errors.push(...validateReady(read('data/readiness/default.json'),read('data/readiness/plot.json'),bundle),...validateMedia(read('data/media/library.json'),bundle,root));for(const[p,v]of generateReadyFiles(root).files)if(fs.readFileSync(path.join(root,p),'utf8')!==v)errors.push({code:'readiness-stale',message:p});}catch(e){errors.push({code:'readiness-build',message:e.message});}return {valid:!errors.length,errors};}
if(require.main===module){const result=validateReadiness();console.log(JSON.stringify(result,null,2));process.exitCode=result.valid?0:1;}
module.exports={validateReadiness};
