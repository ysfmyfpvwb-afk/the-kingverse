'use strict';
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value || '').normalize('NFKC').replace(/[’‘]/g, "'").toLocaleLowerCase('en');
const bn = r => r['Engelse titel'] || '';
const sn = r => r['Engelse verhaalnaam'] || '';
const fn = r => r['Verfilming (EN)'] || '';
let tab = 'books', lang = 'en', activeItem = null, returnFocus = null, restoringRoute = false;
try { const saved=localStorage.getItem('kingverse-lang');if(saved==='nl'||saved==='en')lang=saved; } catch { /* Storage may be disabled. */ }
const requestedLanguage=typeof location!=='undefined'?new URLSearchParams(location.search||'').get('lang'):null;
if(requestedLanguage==='en'||requestedLanguage==='nl'){lang=requestedLanguage;try{localStorage.setItem('kingverse-lang',lang);}catch{}}
const tr = (nl, en) => lang === 'nl' ? nl : en;
// The generated catalog already resolves works, editions, memberships and source conflicts.
const B = DB.books, S = DB.stories, F = DB.films, T = DB.tower;
const translations = {
  'Roman / novelle':'Novel / novella', 'Roman':'Novel', 'Novelle':'Novella', 'Verhaal':'Short story', 'Gedicht':'Poem', 'Scenario':'Screenplay', 'Bijdrage':'Contribution', 'Non-fictie':'Nonfiction', 'Strip':'Comic', 'Fotoboek':'Photobook', 'Musical':'Musical', 'Bijdragenbundel':'Contributed collection', 'Prequel':'Prequel', 'Vervolgfilm':'Sequel', 'Nog te verifiëren':'Not yet verified', 'Verhalenbundel':'Story collection', 'Bundel / verzameling':'Collection', 'Film':'Film',
  'Televisie':'Television · format unverified', 'Televisiefilm':'TV movie', 'Televisieserie':'TV series', 'Miniserie':'Miniseries',
  'Gebaseerd op / geïnspireerd door':'Based on / inspired by', 'Origineel scenario':'Original screenplay',
  'Hoofdreeks':'Core series', 'Tussenboek':'Interquel', 'Roland-verhaal':'Roland story', 'Personage':'Character', 'Kosmologie':'Cosmology', 'Thematisch':'Thematic',
  'Roland en de Ka-tet; zeven kerndelen':'Roland and the ka-tet; seven core volumes',
  'Gesitueerd tussen deel IV en V':'Set between volumes IV and V', 'Opgenomen in Everything’s Eventual':"Collected in Everything’s Eventual",
  'Breakers en de Toren':'Breakers and the Tower', 'Overlappende kosmologie; geen direct vervolg':'Overlapping cosmology; no direct sequel',
  'Crimson King en Patrick Danville':'Crimson King and Patrick Danville'
};
const localize = value => value === 'Televisie' ? tr('Televisie · formaat onbevestigd','Television · format unverified') : lang === 'en' ? (translations[value] || value || '') : value || '';
const summaries = {
  'Carrie': ['Een gepeste scholier ontdekt dat haar gedachten de wereld om haar heen kunnen veranderen.', 'A bullied teenager discovers that her thoughts can change the world around her.'],
  "'Salem's Lot": ['Een schrijver keert terug naar een stadje waar een oud kwaad ontwaakt.', 'A writer returns to a small town where an ancient evil is waking.'],
  'The Shining': ['Een gezin brengt de winter door in een hotel met een gewelddadig verleden.', 'A family spends the winter in a hotel with a violent past.'],
  'The Stand': ['Na een verwoestende epidemie zoeken overlevenden hun plaats in een nieuwe wereld.', 'After a devastating epidemic, survivors seek their place in a changed world.'],
  'The Long Walk': ['Een wandelwedstrijd krijgt een dodelijke inzet voor de jonge deelnemers.', 'A walking competition carries deadly stakes for its young contestants.'],
  'The Dead Zone': ['Een man ontwaakt uit een coma met visioenen die hem voor moeilijke keuzes stellen.', 'A man wakes from a coma with visions that force him into difficult choices.'],
  'Firestarter': ['Een meisje met een gevaarlijke gave wordt opgejaagd door de organisatie achter een geheim experiment.', 'A girl with a dangerous gift is pursued by the organization behind a secret experiment.'],
  'Cujo': ['Een moeder en haar kind raken opgesloten bij een hond die niet meer zichzelf is.', 'A mother and her child are trapped near a dog that is no longer itself.'],
  'Christine': ['Een tiener raakt in de ban van een auto met een eigen wil.', 'A teenager falls under the spell of a car with a will of its own.'],
  'Pet Sematary': ['Een gezin ontdekt een begraafplaats waar verlies een angstaanjagende betekenis krijgt.', 'A family discovers a burial ground where loss takes on a terrifying meaning.'],
  'Misery': ['Een schrijver wordt na een ongeluk afhankelijk van zijn meest toegewijde lezer.', 'After an accident, a novelist becomes dependent on his most devoted reader.'],
  'IT': ['Jeugdvrienden keren terug naar Derry om het kwaad uit hun jeugd onder ogen te zien.', 'Childhood friends return to Derry to confront the evil of their youth.']
};
function edition(r) { return MEDIA.books[bn(r)]?.[lang] || null; }
function title(r, kind = tab) {
  if (kind === 'books') return edition(r)?.title || (lang === 'nl' ? r['Nederlandse titel (indicatief)'] || bn(r) : bn(r));
  if (kind === 'stories') return lang === 'nl' ? r['Nederlandse verhaalnaam (geverifieerd waar bekend)'] || sn(r) : sn(r);
  return kind === 'films' ? fn(r) : r['Werk / verwijzing'];
}
function media(r, kind = tab) {
  if (kind === 'books') {
    const editions = MEDIA.books[bn(r)];
    return editions?.[lang] || (lang === 'nl' ? editions?.en : null);
  }
  if (kind === 'stories') {const b = storyArtworkBook(r);if(b)return media(b,'books');const own=MEDIA.stories?.[sn(r)];return own?.[lang] || (lang==='nl'?own?.en:null) || null;}
  return kind === 'films' ? MEDIA.films[`${fn(r)}|${r.Jaar}`] || null : null;
}
function storyArtworkBook(r) {
  const standalone = B.find(b => b.workId === r.workId && b.Type !== 'Bundel / verzameling');
  return B.find(b => b.id === r.defaultCollectionId) || standalone || null;
}
function collectionLabel(r) {
  const b=B.find(b => b.id === r.defaultCollectionId);
  return b ? linkTo('books',bn(b),tr('Onderdeel van ','Collected in ')+title(b,'books'),B.indexOf(b)) : '';
}
function labelHeading() { return ({books:tr('Boeken en bundels','Books & collections'),stories:tr('Verhalen','Short stories'),films:tr('Verfilmingen','Screen adaptations'),tower:tr('Verbindingen met de Toren','Connections to the Tower')})[tab]; }
function rows() { return ({books:B,stories:S,films:F,tower:T})[tab]; }
function field() { return ({books:'Type', stories:'Engelse bundel', films:'Medium', tower:'Soort connectie'})[tab]; }
function imageMarkup(r, large = false) {
  if (!['books','stories','films'].includes(tab)) return '';
  if (tab === 'stories' && !storyArtworkBook(r) && !media(r,'stories')) return '';
  const m = media(r), label = tab !== 'films' ? tr('Omslag nog niet geverifieerd','Cover not yet verified') : tr('Poster nog niet geverifieerd','Poster not yet verified');
  return `<div class="artwork${large ? ' artwork-large' : ''}"><div class="art-placeholder"${m ? ' aria-hidden="true"' : ''}><span aria-hidden="true">${tab !== 'films' ? '❦' : '▷'}</span><span>${safe(title(r))}</span><small>${safe(m ? tr('Afbeelding niet beschikbaar','Image unavailable') : label)}</small></div>${m ? `<img src="${safe(m.image)}" alt="${safe((tab !== 'films' ? tr('Boekomslag','Book cover') : tr('Officiële Engelstalige promotieafbeelding','Official English promotional artwork')) + ': ' + m.title + (tab === 'films' ? ' ('+r.Jaar+')' : ' · '+m.language.toUpperCase()))}" width="400" height="600" loading="${large ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">` : ''}<span class="art-language">${m ? m.language.toUpperCase() + (tab !== 'films' && lang === 'nl' && m.language === 'en' ? ' · FALLBACK' : '') : tr('BEELD ONTBREEKT','ARTWORK PENDING')}</span></div>`;
}
const failedImages = new Set();
function bindImages(root) {
  root.querySelectorAll('.artwork img').forEach(img => {
    const fail = () => {failedImages.add(img.src); img.parentElement.querySelector('.art-placeholder')?.removeAttribute('aria-hidden'); img.remove();};
    if (failedImages.has(img.src)) {fail();return;}
    img.addEventListener('error', fail, {once:true});
    img.addEventListener('load', () => {if(img.naturalWidth < 2 || img.naturalHeight < 2) fail();}, {once:true});
    if (img.complete && !img.naturalWidth) fail();
  });
}
function searchText(r) {
  const related = tab==='stories' ? (r.collectionIds||[]).map(id=>B.find(b=>b.id===id)).filter(Boolean) : tab==='films' ? (r.sourceWorks||[]).map(w=>(w.kind==='books'?B:S).find(x=>x.id===w.id)).filter(Boolean) : [];
  return norm(JSON.stringify([bn(r),sn(r),fn(r),title(r),r['Nederlandse titel (indicatief)'],r['Nederlandse verhaalnaam (geverifieerd waar bekend)'],r.aliases,r.collections,r.Jaar,r.Type,r.Medium,r.Auteur,r.authors,r.cast,r.director,r.showrunner,r.platform,r['Bronwerk (EN)'],r.concepts,r.description,related.map(w=>[bn(w),sn(w),w['Nederlandse titel (indicatief)'],w['Nederlandse verhaalnaam (geverifieerd waar bekend)'],w.aliases])]));
}
function render() {
  applyLang();
  const all = rows(), select = $('filter'), old = select.dataset.tab === tab ? select.value : '';
  const options = [...new Set((tab==='stories' ? all.flatMap(r=>r.collections||[]) : all.map(r=>r[field()])).filter(Boolean))].sort();
  if (tab === 'books' || tab === 'stories') options.push('__collaborations');
  if (select.dataset.tab !== tab || select.dataset.lang !== lang) {
  select.innerHTML = `<option value="">${tab === 'stories' ? tr('Alle bundels','All collections') : tr('Alle typen','All types')}</option>` + options.map(v => `<option value="${safe(v)}">${safe(v === '__collaborations' ? tr('Samenwerkingen','Collaborations') : tab==='stories' ? title(B.find(b=>bn(b)===v)||{'Engelse titel':v},'books') : localize(v))}</option>`).join('');
  select.value = old; select.dataset.tab = tab; select.dataset.lang = lang;
  }
  const q = norm($('search').value).trim();
  const exactIds=new Set(q?all.filter(r=>[bn(r),sn(r),fn(r),title(r),r['Nederlandse titel (indicatief)'],r['Nederlandse verhaalnaam (geverifieerd waar bekend)'],...(r.aliases||[])].filter(Boolean).some(value=>norm(value)===q)).map(r=>r.id):[]);
  const filtered = all.map((r, i) => ({r, i})).filter(({r}) => (!q || (exactIds.size?exactIds.has(r.id):searchText(r).includes(q))) && (!select.value || (select.value === '__collaborations' ? Boolean(r.collaboration) : tab==='stories' ? (r.collections||[]).includes(select.value) : r[field()] === select.value)));
  filtered.sort((a,b) => $('sort').value === 'title' ? title(a.r).localeCompare(title(b.r),lang) : ((Number(a.r.Jaar)||9999)-(Number(b.r.Jaar)||9999)) || title(a.r).localeCompare(title(b.r),lang));
  $('count').textContent = `${labelHeading()} · ${filtered.length} ${tr('resultaten','results')}`;
  if (!filtered.length) { $('results').innerHTML = `<p class="empty">${tr('Geen resultaten. Probeer een andere zoekterm.','No results. Try another search.')}</p>`; return; }
  if (tab === 'tower') {
    $('results').innerHTML = '<div class="timeline">'+filtered.map(({r,i}) => `<button class="linkcard" data-id="${i}"><b>${safe(title(r))}</b><span class="tag">${safe(localize(r['Soort connectie']))}</span><p>${safe(r.description?.[lang] || localize(r.Toelichting))}</p></button>`).join('')+'</div>';
  } else {
    $('results').innerHTML = `<div class="grid ${tab === 'stories' ? 'visual-grid story-grid' : 'visual-grid'}">`+filtered.map(({r,i}) => {
      const subtitle = tab === 'books' ? (lang === 'nl' ? bn(r) : '') : tab === 'stories' ? r['Engelse bundel'] : r['Bronwerk (EN)'];
      return `${tab === 'stories' ? '<article class="story-card">' : ''}<button class="tile" data-id="${i}">${imageMarkup(r)}<div class="tile-copy"><div class="num">${safe(r.Jaar || tr('JAAR ONBEVESTIGD','YEAR UNCONFIRMED'))}${tab === 'films' ? ' · '+safe(localize(r.Medium)) : ''}</div><h3>${safe(title(r))}</h3><div class="sub">${safe(subtitle || '')}</div><div class="foot"><span>${safe(tab === 'books' ? localize(r.Type) : tab === 'stories' ? localize(r.Type || 'Verhaal') : (r.showrunner || r.director || media(r)?.director || tr('Credits nog te controleren','Credits pending')))}</span><span aria-hidden="true">↗</span></div></div></button>${tab === 'stories' ? collectionLabel(r) + '</article>' : ''}`;
    }).join('')+'</div>';
  }
  bindImages($('results'));
  $('results').querySelectorAll('[data-id]').forEach(el => el.onclick = () => openItem(all[Number(el.dataset.id)]));
  bindJumps($('results'));
}
function line(label, value) { return `<div class="entry"><strong>${safe(label)}</strong><small>${safe(value ?? tr('Niet bevestigd','Not confirmed'))}</small></div>`; }
function section(label, content) { return `<h3>${safe(label)}</h3>${content}`; }
function linkTo(kind, query, label, exact = null) { return `<button class="jump" data-next="${kind}" data-query="${safe(query)}"${exact === null ? '' : ` data-exact="${exact}"`}>${safe(label)} ↗</button>`; }
function sourceLink(url, label) { return /^https:\/\//.test(url || '') ? `<a class="source" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>` : ''; }
function description(r) {
  const key = tab === 'books' ? bn(r) : r['Bronwerk (EN)'];
  const summary = summaries[key];
  if (summary && tab === 'books') return summary[lang === 'nl' ? 0 : 1];
  if (tab === 'films' && r.Jaar === 2026 && fn(r) === 'Carrie') return tr('Mike Flanagan brengt de roman over Carrie White naar Prime Video. Het eerste seizoen telt acht afleveringen.','Mike Flanagan brings the story of Carrie White to Prime Video in an eight-episode first season.');
  return tab === 'books' ? tr('Een werk uit de bibliografie van Stephen King. Een inhoudelijke beschrijving is nog niet geverifieerd.','A work in Stephen King’s bibliography. A plot description has not yet been verified.') : '';
}
function detailContent(r) {
  let out = `<div class="eyebrow">${safe(labelHeading())}</div><h2 id="detailTitle">${safe(title(r))}</h2>${imageMarkup(r,true)}`;
  const desc = description(r); if (desc) out += `<p>${safe(desc)}</p>`;
  if (tab === 'books') {
    out += line(tr('Originele titel','Original title'), bn(r)) + line(tr('Nederlandse titel','Dutch title'), MEDIA.books[bn(r)]?.nl?.title || r['Nederlandse titel (indicatief)'] || tr('Nog niet bevestigd; Engelse titel getoond','Unconfirmed; showing English title')) + line(tr('Bibliografisch jaar','Bibliographic year'), r.Jaar) + line(tr('Type','Type'),localize(r.Type)) + line(tr('Auteur','Author'), r.Auteur);
    const m = media(r);
    if (m) {
      out += section(tr('Getoonde editie','Displayed edition'), line(tr('Taal','Language'), m.language === 'nl' ? tr('Nederlands','Dutch') : tr('Engels','English')) + line('ISBN',m.isbn || tr('Niet bevestigd voor dit omslag','Not confirmed for this cover')) + (m.publisher ? line(tr('Uitgever','Publisher'), m.publisher) : '') + `<p>${sourceLink(m.source,tr('Editiebron','Edition source'))}</p>`);
      if (lang === 'nl' && m.language === 'en') out += `<p>${tr('Geen gecontroleerde Nederlandse cover beschikbaar; Engelse cover als gemarkeerde fallback.','No verified Dutch cover available; English cover used as a labelled fallback.')}</p>`;
    }
    const stories = S.filter(s => s.collectionIds?.includes(r.id));
    if (stories.length) out += section(tr('Verhalen in deze bundel','Stories in this collection')+` (${stories.length})`,stories.map(s => linkTo('stories',sn(s),title(s,'stories'),S.indexOf(s))).join(''));
    const storyIds = S.filter(s=>s.collectionIds?.includes(r.id)).map(s=>s.id);
    const films = F.filter(f => f.sourceWorks?.some(w=>w.id===r.id || storyIds.includes(w.id)) || norm(f['Oorspronkelijke bundel'])===norm(bn(r)));
    if (films.length) out += section(tr('Verfilmingen','Screen adaptations')+` (${films.length})`,films.map(f => `<div class="adaptation-link">${linkTo('films',fn(f),`${fn(f)} (${f.Jaar || '?'}) · ${localize(f.Medium)}`,F.indexOf(f))}</div>`).join(''));
    if(r.containsWorks?.length) out += section(tr('Bevat de werken','Contains the works'),r.containsWorks.map(w=>workLink(w)).join(''));
    if(r.publications?.length) out += section(tr('Publicatiegeschiedenis en edities','Publication history and editions'),r.publications.map(p=>line(p.title,p.reportedDate||tr('Datum onbevestigd','Date unconfirmed'))+sourceLink(p.source,tr('Publicatiebron','Publication source'))).join(''));
    if(r.firstPublication)out+=line(tr('Eerste publicatie','First publication'),r.firstPublication.date+' · '+tr('begin van de seriële uitgave','start of the serial publication'));
    if(r.publicationNote) out += `<p>${safe(r.publicationNote[lang])}</p>`;
  }
  if (tab === 'stories') {
    out += line(tr('Soort werk','Work type'),localize(r.Type || 'Verhaal'));
    if(r.reportedDate) out += line(tr('Datum in bronregistratie','Date in source record'),r.reportedDate);
    out += `<p>${tr('Een datum bij een bundeluitgave bewijst niet wanneer het verhaal voor het eerst werd gepubliceerd.','A collection date does not establish the story’s first publication.')}</p>`;
    if(r.collectionIds?.length) out += section(tr('Opgenomen in','Collected in'),r.collectionIds.map(id=>workLink({id,kind:'books'})).join(''));
    else out += `<p>${r.standaloneBookId || r.standalonePublications?.length ? tr('Een zelfstandige publicatie is vastgelegd; zie de editiegegevens.','A standalone publication is recorded; see the edition details.') : tr('Geen bundelrelatie vastgelegd. Een eigen boekcover is hier niet vereist.','No collection relationship recorded. A separate book cover is not required here.')}</p>`;
    if(r.standalonePublications?.length)out+=section(tr('Zelfstandige edities','Standalone editions'),r.standalonePublications.map(e=>line(e.title,e.isbn+' · '+e.language.toUpperCase())+sourceLink(e.source,tr('Uitgeversbron','Publisher source'))).join(''));
    const standalone = B.find(b=>b.workId===r.workId);
    if(standalone) out += workLink({id:standalone.id,kind:'books'},tr('Zelfstandige uitgave','Standalone publication'));
    const films = F.filter(f=>f.sourceWorks?.some(w=>w.id===r.id));
    if(films.length) out += section(tr('Verfilmingen','Screen adaptations'),films.map(f=>linkTo('films',fn(f),`${fn(f)} (${f.Jaar||'?'})`,F.indexOf(f))).join(''));
  }
  if (tab === 'films') {
    out += line(tr('Bronwerk','Source work'),r['Bronwerk (EN)']) + line(tr('Jaar','Year'),r.Jaar || tr('Niet bevestigd','Unconfirmed')) + line(tr('Medium','Format'),localize(r.Medium));
    const m = media(r);
    out += line(tr('Regisseur / showrunner','Director / showrunner'),r.showrunner || r.director || m?.director || tr('Nog te verifiëren','Not yet verified'));
    if(r.distributor)out+=line(tr('Oorspronkelijke distributeur','Original distributor'),r.distributor);
    if(r.audit?.uncertain.length)out+=`<div class="notice">${tr('Nog te controleren: ','Still to verify: ')}${safe(r.audit.uncertain.map(auditLabel).join(', '))}</div>`;
    if(r.release) out += line(tr('Releasedatum','Release date'),r.release);
    if(r.directors) out += line(tr('Regie per aflevering','Episode directors'),r.directors);
    if(r.studio) out += line(tr('Productiestudio','Production studio'),r.studio);
    if(r.platform) out += line(tr('Streamingplatform','Streaming platform'),r.platform);
    if(r.episodes) out += line(tr('Afleveringen seizoen 1','Season 1 episodes'),r.episodes);
    out += line(tr('Status','Status'),r.status === 'released' ? tr('Verschenen','Released') : tr('Nog niet onafhankelijk geverifieerd','Not independently verified'));
    if(r.cast) out += section(tr('Hoofdrollen','Principal cast'),`<ul>${r.cast.map(c=>`<li>${safe(c)}</li>`).join('')}</ul>`);
    if(r.renewal) out += line(tr('Volgend seizoen','Next season'),tr('Seizoen 2 bevestigd op ','Season 2 confirmed on ')+r.renewal) + line(tr('Releasedatum seizoen 2','Season 2 release date'),tr('Niet bevestigd','Unconfirmed'));
    out += line(tr('Relatie','Relationship'),localize(r.Relatie));
    if(r['Oorspronkelijke bundel']) out += line(tr('Oorspronkelijke bundel','Original collection'),r['Oorspronkelijke bundel']);
    if(r.sourceWorks?.length) out+=section(tr('Gekoppelde bronwerken','Linked source works'),r.sourceWorks.map(w=>workLink(w)).join(''));
    else out+=`<p>${r.Relatie==='Origineel scenario' ? tr('Origineel scenario; geen afzonderlijk bronboek vereist.','Original screenplay; a separate source book is not required.') : tr('De bronrelatie is nog niet als afzonderlijke werkkoppeling bevestigd.','The source relationship has not yet been confirmed as a separate work link.')}</p>`;
    if(r.sources) out += r.sources.map(url=>`<p>${sourceLink(url,tr('Aanvullende bron','Additional source'))}</p>`).join('');
  }
  if(tab === 'tower') {
    out += line(tr('Verband','Connection'),r.description?.[lang] || localize(r.Toelichting)) + line(tr('Zekerheid','Certainty'),certainty(r.certainty)) + line(tr('Personages / concepten','Characters / concepts'),r.concepts?.join(', '));
    out += section(tr('Betrokken werken','Related works'),(r.works||[]).map(w=>workLink(w)).join(''));
  }
  if(tab==='books' || tab==='stories') {
    if(r.collaboration?.note) out+=`<p>${safe(r.collaboration.note[lang])}</p>`;
    if(r.authors) out+=section(tr('Auteurs en makers','Authors and contributors'),r.authors.map(a=>line(a.name+(a.creditedAs?' ('+a.creditedAs+')':''),localizeRole(a.role))).join(''));
    const related=T.filter(t=>t.works?.some(w=>w.kind===tab && (w.id===r.id || w.title===(tab==='books'?bn(r):sn(r)))));
    if(related.length) out+=section('Dark Tower',related.map(t=>line(t.concepts.join(', '),t.description?.[lang]||t.Toelichting)+`<small>${safe(certainty(t.certainty))}</small>`+(t.works||[]).filter(w=>w.title!==(tab==='books'?bn(r):sn(r))).map(w=>workLink(w)).join('')).join(''));
    if(r.audit?.uncertain.length) out += `<div class="notice">${tr('Nog te controleren: ','Still to verify: ')}${safe(r.audit.uncertain.map(v=>auditLabel(v)).join(', '))}</div>`;
  }
  out += `<p>${sourceLink(r.Bron,tr('Bibliografische bron','Bibliographic source'))}</p>`;
  const m = media(r);
  if(m) out += `<p class="art-credit">${safe(m.credit)} · ${sourceLink(m.source,tr('Afbeeldingsbron','Artwork source'))} · ${tr('Gecontroleerd','Checked')} ${m.checked}. ${tr('Auteursrechten bij de rechthebbenden.','Copyright remains with the rights holders.')}</p>`;
  out += `<div class="notice">${tr('Bronnen zijn per veld gecontroleerd. Dit is geen bevestiging van de volledige publicatiegeschiedenis of alle mogelijke adaptaties.','Sources are checked by field. This does not establish the full publication history or every possible adaptation.')}</div>`;
  return out;
}
function certainty(value) {return ({explicit:tr('Expliciet','Explicit'),'strongly-implied':tr('Sterk geïmpliceerd','Strongly implied'),interpretive:tr('Interpretatief','Interpretive')})[value] || tr('Nog te controleren','Unverified');}
function localizeRole(role) {return ({author:tr('Auteur','Author'),coauthor:tr('Co-auteur','Co-author'),illustrator:tr('Illustrator','Illustrator'),photographer:tr('Fotograaf','Photographer'),contributor:tr('Bijdrage aan bundel','Collection contributor'),editor:tr('Redacteur','Editor'),librettist:tr('Libretto','Libretto'),composer:tr('Muziek / liedteksten','Music / lyrics'),pseudonym:tr('Pseudoniem van Stephen King','Stephen King pseudonym')})[role]||role;}
function auditLabel(key) {return ({publicationYear:tr('eerste publicatiejaar','first publication year'),releaseDate:tr('releasedatum','release date'),dutchEdition:tr('Nederlandse editie','Dutch edition'),cast:tr('cast','cast'),directorOrShowrunner:tr('regisseur / showrunner','director / showrunner'),sourceRelationship:tr('bronrelatie','source relationship'),tvFormat:tr('TV-formaat','TV format'),referenceMatch:tr('aanvullende broncontrole','additional source check'),firstPublicationHistory:tr('eerste-publicatiegeschiedenis','first-publication history'),completeContributorList:tr('volledige makerslijst','complete contributor list'),collectionMembership:tr('bundelrelatie','collection membership'),publicationDate:tr('publicatiedatum','publication date'),sharedSourceUrlCollision:tr('bronpagina gedeeld door verschillende remakes','source page shared by distinct remakes')})[key]||key;}
function workLink(w,label) {
 const all=({books:B,stories:S,films:F})[w.kind];
 const i=all?.findIndex(r=>w.id ? r.id===w.id : (w.kind==='books'?bn(r):w.kind==='stories'?sn(r):fn(r))===w.title);
 return i>=0 ? linkTo(w.kind,'',label || title(all[i],w.kind),i) : `<span>${safe(w.title || tr('Werk nog niet opgenomen','Work not yet recorded'))}</span>`;
}
function bindJumps(root) {
 root.querySelectorAll('.jump').forEach(el=>el.onclick=()=>{
  const kind=el.dataset.next,exact=el.dataset.exact;
  if(exact!==undefined) {
   tab=kind;updateTabs();$('filter').dataset.tab='';$('search').value='';render();
   const item=rows()[Number(exact)];if(item)openItem(item);
  } else navigate(kind,el.dataset.query);
 });
}
function bindDetail() {bindImages($('detailBody'));bindJumps($('detailBody'));}
function openItem(r) {
  if(!restoringRoute)updateRoute(r.id,true);
  returnFocus = document.activeElement; activeItem = r;
  $('detailBody').innerHTML = detailContent(r); $('detail').classList.add('open');
  document.querySelector('.shell').inert = true; document.body.style.overflow = 'hidden';
  $('detail').querySelector('.sheet').scrollTop = 0; bindDetail(); $('close').focus();
}
function close() {
  if(activeItem && !restoringRoute)updateRoute(null,false);
  $('detail').classList.remove('open'); document.querySelector('.shell').inert = false; document.body.style.overflow = ''; activeItem = null;
  if(returnFocus?.isConnected) returnFocus.focus(); else $('search').focus();
}
function updateTabs() {document.querySelectorAll('#tabs [data-tab]').forEach(el=> {el.classList.toggle('active',el.dataset.tab === tab); el.setAttribute('aria-pressed',String(el.dataset.tab === tab));});}
function navigate(next,query='') {close();tab=next;updateTabs();$('search').value=query;$('filter').dataset.tab='';render();$('search').focus();if(!restoringRoute)updateRoute(null,true);}
function applyLang() {
  document.documentElement.lang = lang; $('aboutLink').textContent=tr('Bronnen & Werkwijze','Sources & Method');
  for(const code of ['nl','en']) { const el = $(code === 'nl' ? 'langNL' : 'langEN');el.classList.toggle('selected',lang === code);el.setAttribute('aria-pressed',String(lang === code)); }
  const labels = {books:'📚 '+tr('Bibliotheek','Library'),stories:'✒️ '+tr('Verhalen','Stories'),films:'🎬 '+tr('Verfilmingen','Adaptations'),tower:'🌹 Dark Tower'};
  document.querySelectorAll('#tabs [data-tab]').forEach(el=>el.textContent=labels[el.dataset.tab]);
  document.querySelector('.hero p').textContent = tr('Ontdek de boeken, verhalen en verfilmingen van Stephen King. Twee talen. Eén universum. Van de eerste pagina tot het laatste beeld.','Explore the books, stories and screen adaptations of Stephen King. Two languages. One universe. From the first page to the final frame.');
  $('search').placeholder = tr('Zoek op titel, bundel, verhaal of verfilming…','Search books, collections, stories or adaptations…');
  $('search').setAttribute('aria-label',tr('Zoeken','Search'));$('searchButtonLabel').textContent=tr('Zoek','Search');$('searchButton').setAttribute('aria-label',tr('Zoek in de catalogus','Search the catalog'));$('filter').setAttribute('aria-label',tr('Filter op type of bundel','Filter by type or collection'));$('sort').setAttribute('aria-label',tr('Sorteren','Sort'));$('results').setAttribute('aria-label',labelHeading());
  $('sort').options[0].textContent=tr('Chronologisch','Chronological');$('sort').options[1].textContent=tr('Alfabetisch','Alphabetical');$('close').textContent=tr('✕ Sluiten','✕ Close');
  $('stats').innerHTML = [[B.length,tr('boeken en bundels','books & collections')],[S.length,tr('verhaalvermeldingen','story entries')],[F.length,tr('film- en tv-vermeldingen','film & TV entries')],[T.length,tr('Dark Tower-links','Dark Tower links')]].map(([count,label])=>`<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join('');
  document.querySelector('footer').innerHTML = tr('THE KINGVERSE · Editie 1.5 · Een groeiend archief; nog niet volledig geverifieerd.','THE KINGVERSE · Edition 1.5 · A growing archive; not yet fully verified.') + ` <a href="about.html">${tr('Bronnen & controlestatus','Sources & verification status')}</a> · ${sourceLink('https://openlibrary.org', 'Open Library')} 🌹`;
}
function setLang(next) {
  lang=next; try {localStorage.setItem('kingverse-lang',next);} catch { /* Keep the language usable without storage. */ }
  render(); if(activeItem) {$('detailBody').innerHTML=detailContent(activeItem);bindDetail();}
}
function performSearch(event) {event?.preventDefault();render();updateRoute(null,false);}
function updateRoute(itemId=null,push=false) {
  const q=new URLSearchParams();if(itemId)q.set('item',itemId);if($('search').value)q.set('q',$('search').value);if($('filter').value)q.set('filter',$('filter').value);if($('sort').value==='title')q.set('sort','title');
  const hash='#'+tab+(q.size?'?'+q.toString():'');
  if(location.hash!==hash)history[push?'pushState':'replaceState'](null,'',hash);
}
function restoreRoute() {
  const [kind,params='']=location.hash.slice(1).split('?');if(!['books','stories','films','tower'].includes(kind))return;
  restoringRoute=true;
  try {
    close();tab=kind;const q=new URLSearchParams(params);$('search').value=q.get('q')||'';$('filter').dataset.tab='';$('sort').value=q.get('sort')==='title'?'title':'year';updateTabs();render();$('filter').value=q.get('filter')||'';render();
    const r=rows().find(r=>r.id===q.get('item'));if(r)openItem(r);
  } finally {restoringRoute=false;}
}
function init() {
  $('langNL').onclick=()=>setLang('nl');$('langEN').onclick=()=>setLang('en');
  document.querySelectorAll('#tabs [data-tab]').forEach(el=>el.onclick=()=>navigate(el.dataset.tab));
  $('search').oninput=performSearch;$('searchForm').onsubmit=performSearch;$('filter').onchange=performSearch;$('sort').onchange=performSearch;$('close').onclick=close;
  $('detail').onclick=e=>{if(e.target === $('detail')) close();};
  document.addEventListener('keydown',e=>{
    if(!$('detail').classList.contains('open')) return;
    if(e.key==='Escape') {e.preventDefault();close();}
    if(e.key==='Tab') {
      const elements=[...$('detail').querySelectorAll('button,a[href]')], first=elements[0],last=elements.at(-1);
      if(e.shiftKey && document.activeElement===first) {e.preventDefault();last?.focus();}
      if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('hashchange',restoreRoute);
  updateTabs();render();restoreRoute();
}
init();
