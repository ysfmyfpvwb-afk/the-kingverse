'use strict';
// The existing catalog and its hash routes remain the reader application.
(function(){
 const room=document.getElementById('reading-room'),library=document.getElementById('library-view');
 if(!room||!library)return;
 const kinds=new Set(['books','stories','films','tower']);
 const currentKind=()=>location.hash.slice(1).split('?')[0];
 function localizeRoom(){const nl=document.documentElement.lang==='nl';for(const node of document.querySelectorAll('[data-room-en]'))node.textContent=node.dataset[nl?'roomNl':'roomEn'];document.getElementById('room-search').setAttribute('aria-label',nl?'Zoek in de bibliotheek':'Search the library');}
 function synchronizeRoom(){
  const kind=currentKind(),home=!kinds.has(kind);room.hidden=!home;library.hidden=home;document.body.classList.toggle('reading-room-home',home);
  if(home&&typeof activeItem!=='undefined'&&activeItem){const prior=restoringRoute;restoringRoute=true;try{close();}finally{restoringRoute=prior;}}
  for(const item of document.querySelectorAll('[data-room-nav]')){const active=item.dataset.roomNav===(home?'home':kind==='films'?'films':'books');if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}
  document.title=home?'The Kingverse · The Reading Room':'The Kingverse · '+(kind==='films'?'Adaptations':kind==='stories'?'Stories':kind==='tower'?'Dark Tower':'Library');
  localizeRoom();if(home)document.getElementById('reading-room-title').focus({preventScroll:true});
 }
 for(const id of ['langNL','langEN'])document.getElementById(id).addEventListener('click',localizeRoom);
 document.getElementById('room-search').addEventListener('click',()=>{if(!kinds.has(currentKind()))location.hash='books';synchronizeRoom();document.getElementById('search').focus();});
 document.getElementById('room-unexpected').addEventListener('click',()=>{
  const pool=[...DB.books.map(r=>({kind:'books',record:r})),...DB.stories.map(r=>({kind:'stories',record:r})),...DB.films.map(r=>({kind:'films',record:r}))].filter(item=>item.record.id);
  let last;try{last=sessionStorage.getItem('kingverse-room-last-item');}catch{}
  const choices=pool.filter(item=>item.record.id!==last),available=choices.length?choices:pool;
  if(!available.length){document.getElementById('room-status').textContent=document.documentElement.lang==='nl'?'Er kon geen verhaal worden geopend. Probeer The Bookshelf.':'No story could be opened. Try The Bookshelf.';return;}
  const chosen=available[Math.floor(Math.random()*available.length)];try{sessionStorage.setItem('kingverse-room-last-item',chosen.record.id);}catch{}
  location.hash=chosen.kind+'?item='+encodeURIComponent(chosen.record.id);
 });
 for(const tab of document.querySelectorAll('#tabs [data-tab]'))tab.addEventListener('click',synchronizeRoom);
 window.addEventListener('popstate',synchronizeRoom);window.addEventListener('hashchange',synchronizeRoom);window.addEventListener('pageshow',synchronizeRoom);synchronizeRoom();
})();
