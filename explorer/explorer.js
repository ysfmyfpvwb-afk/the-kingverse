'use strict';
// Progressive enhancement: all connections and navigation are static HTML.
for(const image of document.querySelectorAll('.cover img')){
 const figure=image.closest('.cover');
 const fallback=figure.querySelector('.cover-fallback');
 const retry=figure.querySelector('.cover-retry');
 const show=()=>{
  image.hidden=false;fallback.hidden=true;
  if(retry){retry.hidden=true;retry.disabled=false;retry.textContent='Retry cover';}
 };
 const fail=()=>{
  image.hidden=true;fallback.hidden=false;
  if(retry){retry.hidden=false;retry.disabled=false;retry.textContent='Retry cover';}
 };
 image.addEventListener('load',show);
 image.addEventListener('error',fail);
 if(retry)retry.addEventListener('click',()=>{
  retry.disabled=true;retry.textContent='Loading cover…';
  // Reuse the approved URL and normal browser cache; no proxy or alternate artwork.
  image.src=image.getAttribute('src');
 });
 if(image.complete){if(image.naturalWidth)show();else fail();}
}
const kind=document.getElementById('kind');const certainty=document.getElementById('certainty');
const status=document.getElementById('connection-status');
document.querySelector('.controls').hidden=false;
function drawMap(){
 const map=document.querySelector('.connection-map');
 const svg=map.querySelector('.map-lines');
 const center=map.querySelector('.map-center').getBoundingClientRect();
 const bounds=map.getBoundingClientRect();
 svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
 svg.replaceChildren();
 map.dataset.dense=String(map.querySelectorAll('.map-node:not([hidden])').length>8);
 if(map.dataset.dense==='true')return;
 for(const node of map.querySelectorAll('.map-node:not([hidden])')){
  const box=node.getBoundingClientRect();
  const line=document.createElementNS('http://www.w3.org/2000/svg','path');
  const x1=center.x+center.width/2-bounds.x,y1=center.bottom-bounds.y;
  const x2=box.x+box.width/2-bounds.x,y2=box.y-bounds.y;
  line.setAttribute('d',`M ${x1} ${y1} C ${x1} ${y1+20}, ${x2} ${y2-20}, ${x2} ${y2}`);
  svg.append(line);
 }
}
function filter(){
 let shown=0;
 for(const item of document.querySelectorAll('[data-relation]')){
  item.hidden=!((kind.value==='all'||item.dataset.kind===kind.value)&&(certainty.value==='all'||item.dataset.certainty===certainty.value));
  if(!item.hidden&&item.classList.contains('map-node'))shown++;
 }
 drawMap();
 status.textContent=`${shown} connection${shown===1?'':'s'} shown. ${shown===0?'Try another filter. ':''}`;
}
kind.addEventListener('change',filter);certainty.addEventListener('change',filter);
window.addEventListener('resize',drawMap);
document.querySelector('.connection-map').addEventListener('toggle',drawMap,true);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(drawMap).observe(document.querySelector('.connection-map'));
drawMap();
