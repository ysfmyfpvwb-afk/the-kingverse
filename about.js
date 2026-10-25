'use strict';
let language='en';
try {const saved=localStorage.getItem('kingverse-lang');if(saved==='nl'||saved==='en')language=saved;} catch {}
const requestedLanguage=new URLSearchParams(location.search).get('lang');if(requestedLanguage==='en'||requestedLanguage==='nl')language=requestedLanguage;
function chooseLanguage(next) {
 language=next;document.documentElement.lang=next;
 document.querySelectorAll('[data-language]').forEach(section=>section.hidden=section.dataset.language!==next);
 for(const [code,id] of [['nl','langNL'],['en','langEN']]) {const button=document.getElementById(id);button.classList.toggle('selected',code===next);button.setAttribute('aria-pressed',String(code===next));}
 try {localStorage.setItem('kingverse-lang',next);}catch{}
}
document.getElementById('langNL').onclick=()=>chooseLanguage('nl');
document.getElementById('langEN').onclick=()=>chooseLanguage('en');
chooseLanguage(language);
