'use strict';
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value || '').normalize('NFKC').replace(/[’‘]/g, "'").toLocaleLowerCase('en');
const bn = r => r['Engelse titel'] || '';
const sn = r => r['Engelse verhaalnaam'] || '';
const fn = r => r['Verfilming (EN)'] || '';
let tab = 'books', lang = 'nl', activeItem = null, returnFocus = null;
try { lang = localStorage.getItem('kingverse-lang') === 'en' ? 'en' : 'nl'; } catch { /* Storage may be disabled. */ }
const tr = (nl, en) => lang === 'nl' ? nl : en;
// Keep the imported bibliography intact; documented duplicate records are excluded from the view.
const B = [...new Map(DB.books.map(r => [bn(r), r])).values()];
const S = DB.stories, T = DB.tower;
const F = DB.films.filter(r => !(fn(r) === 'The Dark Tower' && r.Medium === 'Televisie' && r.Jaar === 2017));
F.push({ 'Verfilming (EN)': 'Carrie', Jaar: 2013, Medium: 'Film', 'Bronwerk (EN)': 'Carrie', Relatie: 'Gebaseerd op / geïnspireerd door', Bron: 'https://www.demilofilm.com/works/carrie', director: 'Kimberly Peirce', release: '2013-10-18', cast: ['Chloë Grace Moretz — Carrie White', 'Julianne Moore — Margaret White'], status: 'released', verified: true });
F.push({ 'Verfilming (EN)': 'Carrie', Jaar: 2026, Medium: 'Televisieserie', 'Bronwerk (EN)': 'Carrie', Relatie: 'Gebaseerd op / geïnspireerd door', Bron: 'https://stephenking.com/works/television/carrie.html', sources: ['https://www.aboutamazon.com/news/entertainment/carrie-stephen-king-mike-flanagan-prime-video'], showrunner: 'Mike Flanagan', release: '2026-10-07', episodes: 8, platform: 'Prime Video', studio: 'Amazon MGM Studios', directors: 'Mike Flanagan (1, 2, 7, 8); Kate Siegel (3); Axelle Carolyn (4); Kyra Sedgwick (5); Hiromi Kamata (6)', cast: ['Summer H. Howell — Carrie White', 'Samantha Sloyan — Margaret White', 'Siena Agudong — Sue Snell', 'Alison Thornton — Chris Hargensen', 'Joel Oulette — Tommy Ross', 'Josie Totah — Tina', 'Arthur Conti — Billy', 'Thalia Dudek — Emaline', 'Amber Midthunder — Miss Desjardin', 'Matthew Lillard — Principal Grayle'], renewal: '2026-10-22', status: 'released', verified: true });
const carrieTV = F.find(r => fn(r) === 'Carrie' && r.Jaar === 2002);
Object.assign(carrieTV, { Medium: 'Televisiefilm', director: 'David Carson', status: 'released', Bron: 'https://www.swank.com/public-libraries/details/21296-carrie', cast: ['Angela Bettis — Carrie White', 'Patricia Clarkson — Margaret White'], verified: true });
const carrieOriginal = F.find(r => fn(r) === 'Carrie' && r.Jaar === 1976);
Object.assign(carrieOriginal, {director: 'Brian De Palma', status: 'released', release: '1976-11-03', verified: true});
// An exact title/year mapping supplies verified credits only to that adaptation.
for (const film of F) {
  const m = MEDIA.films[`${fn(film)}|${film.Jaar}`];
  if (m) Object.assign(film, {director: m.director || film.director, status: 'released', Bron: m.source});
}
const translations = {
  'Roman / novelle':'Novel / novella', 'Verhalenbundel':'Story collection', 'Bundel / verzameling':'Collection', 'Film':'Film',
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
    // An existing Dutch title with an unverified cover must never get an English image.
    if (lang === 'nl' && !editions?.nl && r['Nederlandse titel (indicatief)']) return null;
    return editions?.[lang] || (lang === 'nl' && !r['Nederlandse titel (indicatief)'] ? editions?.en : null);
  }
  return kind === 'films' ? MEDIA.films[`${fn(r)}|${r.Jaar}`] || null : null;
}
function labelHeading() { return ({books:tr('Boeken en bundels','Books & collections'),stories:tr('Verhalen','Short stories'),films:tr('Verfilmingen','Screen adaptations'),tower:tr('Verbindingen met de Toren','Connections to the Tower')})[tab]; }
function rows() { return ({books:B,stories:S,films:F,tower:T})[tab]; }
function field() { return ({books:'Type', stories:'Engelse bundel', films:'Medium', tower:'Soort connectie'})[tab]; }
function imageMarkup(r, large = false) {
  if (!['books','films'].includes(tab)) return '';
  const m = media(r), label = tab === 'books' ? tr('Omslag nog niet geverifieerd','Cover not yet verified') : tr('Poster nog niet geverifieerd','Poster not yet verified');
  return `<div class="artwork${large ? ' artwork-large' : ''}"><div class="art-placeholder"${m ? ' aria-hidden="true"' : ''}><span aria-hidden="true">${tab === 'books' ? '❦' : '▷'}</span><span>${safe(title(r))}</span><small>${safe(m ? tr('Afbeelding niet beschikbaar','Image unavailable') : label)}</small></div>${m ? `<img src="${safe(m.image)}" alt="${safe((tab === 'books' ? tr('Boekomslag','Book cover') : tr('Officiële Engelstalige promotieafbeelding','Official English promotional artwork')) + ': ' + m.title + (tab === 'films' ? ' ('+r.Jaar+')' : ' · '+m.language.toUpperCase()))}" width="400" height="600" loading="${large ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">` : ''}<span class="art-language">${m ? m.language.toUpperCase() : tr('BEELD ONTBREEKT','ARTWORK PENDING')}</span></div>`;
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
function render() {
  applyLang();
  const all = rows(), select = $('filter'), old = select.dataset.tab === tab ? select.value : '';
  const options = [...new Set(all.map(r => r[field()]).filter(Boolean))].sort();
  if (select.dataset.tab !== tab || select.dataset.lang !== lang) {
  select.innerHTML = `<option value="">${tab === 'stories' ? tr('Alle bundels','All collections') : tr('Alle typen','All types')}</option>` + options.map(v => `<option value="${safe(v)}">${safe(localize(v))}</option>`).join('');
  select.value = old; select.dataset.tab = tab; select.dataset.lang = lang;
  }
  const q = norm($('search').value).trim();
  const filtered = all.map((r, i) => ({r, i})).filter(({r}) => (!q || norm(JSON.stringify(r)+' '+title(r)+' '+localize(r[field()])).includes(q)) && (!select.value || r[field()] === select.value));
  filtered.sort((a,b) => $('sort').value === 'title' ? title(a.r).localeCompare(title(b.r),lang) : ((Number(a.r.Jaar)||9999)-(Number(b.r.Jaar)||9999)) || title(a.r).localeCompare(title(b.r),lang));
  $('count').textContent = `${labelHeading()} · ${filtered.length} ${tr('resultaten','results')}`;
  if (!filtered.length) { $('results').innerHTML = `<p class="empty">${tr('Geen resultaten. Probeer een andere zoekterm.','No results. Try another search.')}</p>`; return; }
  if (tab === 'tower') {
    $('results').innerHTML = '<div class="timeline">'+filtered.map(({r,i}) => `<button class="linkcard" data-id="${i}"><b>${safe(title(r))}</b><span class="tag">${safe(localize(r['Soort connectie']))}</span><p>${safe(localize(r.Toelichting))}</p></button>`).join('')+'</div>';
  } else {
    $('results').innerHTML = `<div class="grid ${tab === 'stories' ? 'story-grid' : 'visual-grid'}">`+filtered.map(({r,i}) => {
      const subtitle = tab === 'books' ? (lang === 'nl' ? bn(r) : '') : tab === 'stories' ? r['Engelse bundel'] : r['Bronwerk (EN)'];
      return `<button class="tile" data-id="${i}">${imageMarkup(r)}<div class="tile-copy"><div class="num">${safe(r.Jaar || tr('JAAR ONBEVESTIGD','YEAR UNCONFIRMED'))}${tab === 'films' ? ' · '+safe(localize(r.Medium)) : ''}</div><h3>${safe(title(r))}</h3><div class="sub">${safe(subtitle || '')}</div><div class="foot"><span>${safe(tab === 'books' ? localize(r.Type) : tab === 'stories' ? tr('Verhaal','Short story') : (r.showrunner || r.director || media(r)?.director || tr('Credits nog te controleren','Credits pending')))}</span><span aria-hidden="true">↗</span></div></div></button>`;
    }).join('')+'</div>';
  }
  bindImages($('results'));
  $('results').querySelectorAll('[data-id]').forEach(el => el.onclick = () => openItem(all[Number(el.dataset.id)]));
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
    out += line(tr('Originele titel','Original title'), bn(r)) + line(tr('Nederlandse titel','Dutch title'), MEDIA.books[bn(r)]?.nl?.title || r['Nederlandse titel (indicatief)'] || tr('Nog niet bevestigd; Engelse titel getoond','Unconfirmed; showing English title')) + line(tr('Eerste publicatie','First publication'), r.Jaar) + line(tr('Type','Type'),localize(r.Type)) + line(tr('Auteur','Author'), r.Auteur);
    const m = media(r);
    if (m) {
      out += section(tr('Getoonde editie','Displayed edition'), line(tr('Taal','Language'), m.language === 'nl' ? tr('Nederlands','Dutch') : tr('Engels','English')) + line('ISBN',m.isbn || tr('Niet bevestigd voor dit omslag','Not confirmed for this cover')) + (m.publisher ? line(tr('Uitgever','Publisher'), m.publisher) : '') + `<p>${sourceLink(m.source,tr('Editiebron','Edition source'))}</p>`);
      if (lang === 'nl' && m.language === 'en') out += `<p>${tr('Nederlandse editie niet bevestigd; Engelse editie als fallback.','Dutch edition unconfirmed; English edition used as fallback.')}</p>`;
    }
    const stories = S.filter(s => norm(s['Engelse bundel']) === norm(bn(r)));
    if (stories.length) out += section(tr('Verhalen in deze bundel','Stories in this collection')+` (${stories.length})`,stories.map(s => linkTo('stories',sn(s),title(s,'stories'),S.indexOf(s))).join(''));
    const films = F.filter(f => norm(f['Bronwerk (EN)']) === norm(bn(r)) || norm(f['Oorspronkelijke bundel']) === norm(bn(r)));
    if (films.length) out += section(tr('Verfilmingen','Screen adaptations')+` (${films.length})`,films.map(f => `<div class="adaptation-link">${linkTo('films',fn(f),`${fn(f)} (${f.Jaar || '?'}) · ${localize(f.Medium)}`,F.indexOf(f))}</div>`).join(''));
    const tower = T.filter(t => norm(t['Werk / verwijzing']) === norm(bn(r)) || (bn(r).startsWith('The Dark Tower') && t['Soort connectie'] === 'Hoofdreeks') || (bn(r).endsWith('The Wind Through the Keyhole') && t['Soort connectie'] === 'Tussenboek'));
    if (tower.length) out += section('Dark Tower',tower.map(t => line(localize(t['Soort connectie']),localize(t.Toelichting))).join(''));
  }
  if (tab === 'stories') {
    out += line(tr('Bundel','Collection'),r['Engelse bundel']) + line(tr('Nederlandse titel','Dutch title'),r['Nederlandse verhaalnaam (geverifieerd waar bekend)'] || tr('Nog te verifiëren','Not yet verified'));
    const collection = B.find(b => norm(bn(b)) === norm(r['Engelse bundel']));
    if (collection) out += linkTo('books',bn(collection),tr('Open de bundel','Open collection'),B.indexOf(collection));
    const films = F.filter(f => norm(f['Bronwerk (EN)']) === norm(sn(r)));
    if (films.length) out += section(tr('Verfilmingen','Screen adaptations'), films.map(f => linkTo('films',fn(f),`${fn(f)} (${f.Jaar || '?'})`,F.indexOf(f))).join(''));
  }
  if (tab === 'films') {
    out += line(tr('Bronwerk','Source work'),r['Bronwerk (EN)']) + line(tr('Jaar','Year'),r.Jaar || tr('Niet bevestigd','Unconfirmed')) + line(tr('Medium','Format'),localize(r.Medium));
    const m = media(r);
    out += line(tr('Regisseur / showrunner','Director / showrunner'),r.showrunner || r.director || m?.director || tr('Nog te verifiëren','Not yet verified'));
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
    const book = B.find(b => norm(bn(b)) === norm(r['Bronwerk (EN)']));
    const story = S.find(s => norm(sn(s)) === norm(r['Bronwerk (EN)']));
    if(book) out += linkTo('books',bn(book),tr('Open het bronboek','Open source book'),B.indexOf(book));
    if(story) out += linkTo('stories',sn(story),tr('Open het bronverhaal','Open source story'),S.indexOf(story));
    if(!book && !story) out += `<p>${tr('Het bronwerk staat nog niet als afzonderlijk record in de catalogus.','The source work does not yet have a separate catalog entry.')}</p>`;
    if(r.sources) out += r.sources.map(url=>`<p>${sourceLink(url,tr('Aanvullende officiële bron','Additional official source'))}</p>`).join('');
  }
  if(tab === 'tower') {
    out += line(tr('Verband','Connection'),localize(r.Toelichting)) + line(tr('Soort','Type'),localize(r['Soort connectie'])) + linkTo('books',r['Soort connectie'] === 'Hoofdreeks' ? 'The Dark Tower' : r['Werk / verwijzing'],tr('Zoek in de bibliotheek','Search library'));
  }
  out += `<p>${sourceLink(r.Bron,tr('Bibliografische bron','Bibliographic source'))}</p>`;
  const m = media(r);
  if(m) out += `<p class="art-credit">${safe(m.credit)} · ${sourceLink(m.source,tr('Afbeeldingsbron','Artwork source'))} · ${tr('Gecontroleerd','Checked')} ${m.checked}. ${tr('Auteursrechten bij de rechthebbenden.','Copyright remains with the rights holders.')}</p>`;
  out += `<div class="notice">${tr('Werkcatalogus: alleen de expliciet vermelde editie- en afbeeldingsbronnen zijn gecontroleerd. Andere titels, credits, datums en verbanden vragen nog controle.','Working catalog: only the explicitly cited edition and artwork sources have been checked. Other titles, credits, dates and relationships still need review.')}</div>`;
  return out;
}
function bindDetail() {
  bindImages($('detailBody'));
  $('detailBody').querySelectorAll('.jump').forEach(el => el.onclick = () => {
    const kind = el.dataset.next, exact = el.dataset.exact;
    if(exact !== undefined) {tab = kind; updateTabs(); render(); activeItem = rows()[Number(exact)]; $('detailBody').innerHTML = detailContent(activeItem); bindDetail(); $('detail').querySelector('.sheet').scrollTop = 0; $('close').focus();}
    else navigate(kind,el.dataset.query);
  });
}
function openItem(r) {
  returnFocus = document.activeElement; activeItem = r;
  $('detailBody').innerHTML = detailContent(r); $('detail').classList.add('open');
  document.querySelector('.shell').inert = true; document.body.style.overflow = 'hidden';
  $('detail').querySelector('.sheet').scrollTop = 0; bindDetail(); $('close').focus();
}
function close() {
  $('detail').classList.remove('open'); document.querySelector('.shell').inert = false; document.body.style.overflow = ''; activeItem = null;
  if(returnFocus?.isConnected) returnFocus.focus(); else $('search').focus();
}
function updateTabs() {document.querySelectorAll('#tabs [data-tab]').forEach(el=> {el.classList.toggle('active',el.dataset.tab === tab); el.setAttribute('aria-pressed',String(el.dataset.tab === tab));});}
function navigate(next,query='') {close();tab=next;updateTabs();$('search').value=query;$('filter').dataset.tab='';render();$('search').focus();}
function applyLang() {
  document.documentElement.lang = lang;
  for(const code of ['nl','en']) { const el = $(code === 'nl' ? 'langNL' : 'langEN');el.classList.toggle('selected',lang === code);el.setAttribute('aria-pressed',String(lang === code)); }
  const labels = {books:'📚 '+tr('Bibliotheek','Library'),stories:'✒️ '+tr('Verhalen','Stories'),films:'🎬 '+tr('Verfilmingen','Adaptations'),tower:'🌹 Dark Tower'};
  document.querySelectorAll('#tabs [data-tab]').forEach(el=>el.textContent=labels[el.dataset.tab]);
  document.querySelector('.hero p').textContent = tr('Ontdek de boeken, verhalen en verfilmingen van Stephen King. Twee talen. Eén universum. Van de eerste pagina tot het laatste beeld.','Explore the books, stories and screen adaptations of Stephen King. Two languages. One universe. From the first page to the final frame.');
  $('search').placeholder = tr('Zoek op titel, bundel, verhaal of verfilming…','Search books, collections, stories or adaptations…');
  $('search').setAttribute('aria-label',tr('Zoeken','Search'));$('filter').setAttribute('aria-label',tr('Filter op type of bundel','Filter by type or collection'));$('sort').setAttribute('aria-label',tr('Sorteren','Sort'));$('results').setAttribute('aria-label',labelHeading());
  $('sort').options[0].textContent=tr('Chronologisch','Chronological');$('sort').options[1].textContent=tr('Alfabetisch','Alphabetical');$('close').textContent=tr('✕ Sluiten','✕ Close');
  $('stats').innerHTML = [[B.length,tr('boeken en bundels','books & collections')],[S.length,tr('verhaalvermeldingen','story entries')],[F.length,tr('film- en tv-vermeldingen','film & TV entries')],[T.length,tr('Dark Tower-links','Dark Tower links')]].map(([count,label])=>`<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join('');
  document.querySelector('footer').innerHTML = tr('THE KINGVERSE · Editie 1.4 · Een groeiend archief; nog niet volledig geverifieerd.','THE KINGVERSE · Edition 1.4 · A growing archive; not yet fully verified.') + ` <a href="https://github.com/ysfmyfpvwb-afk/the-kingverse/blob/main/DATA-QUALITY.md" target="_blank" rel="noopener noreferrer">${tr('Bronnen & controlestatus','Sources & verification status')}</a> · ${sourceLink('https://openlibrary.org', 'Open Library')} 🌹`;
}
function setLang(next) {
  lang=next; try {localStorage.setItem('kingverse-lang',next);} catch { /* Keep the language usable without storage. */ }
  render(); if(activeItem) {$('detailBody').innerHTML=detailContent(activeItem);bindDetail();}
}
function init() {
  $('langNL').onclick=()=>setLang('nl');$('langEN').onclick=()=>setLang('en');
  document.querySelectorAll('#tabs [data-tab]').forEach(el=>el.onclick=()=>navigate(el.dataset.tab));
  $('search').oninput=render;$('filter').onchange=render;$('sort').onchange=render;$('close').onclick=close;
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
  updateTabs();render();
}
init();
