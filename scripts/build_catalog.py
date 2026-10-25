#!/usr/bin/env python3
"""Rebuild the catalog, image candidate list and field-level audit from committed facts.
Offline and deterministic. Network collection is deliberately separate.
"""
import copy,hashlib,json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def read(p):return json.loads((ROOT/p).read_text())
def write(p,obj): (ROOT/p).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower())
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
def bookname(r):return r.get('Engelse titel','')
def storyname(r):return r.get('Engelse verhaalnaam','')
def filmname(r):return r.get('Verfilming (EN)','')
def parse_date(s):
 if not s or not re.search(r'\b(?:18|19|20)\d\d\b',s):return None
 from datetime import datetime
 s=re.sub(r'(\d)(st|nd|rd|th)',r'\1',s).replace(',','')
 for fmt,out in [('%B %d %Y','%Y-%m-%d'),('%B %Y','%Y-%m'),('%Y','%Y')]:
  try:return datetime.strptime(s,fmt).strftime(out)
  except ValueError:pass
 return None

def main():
 legacy=read('data/legacy-v1.4.json');ref=read('data/reference/official.json');dutch=read('data/reference/dutch.json');ed=read('data/editorial.json');review=read('data/image-review.json') if (ROOT/'data/image-review.json').exists() else {}
 bibliography=read('data/reference/bibliography.json');
 collab=read('data/reference/collaborations.json');contributors=read('data/contributors.json');
 details={r['url']:r for r in ref['details']};details.update({r['url']:r for r in collab['details']});ba=ed['bookAliases'];sa=ed['storyAliases'];fa=ed['screenAliases'];variants=ed['editionVariants'];checked=ref['checked'];changes=[];candidates=[];conflicts=[]
 B=copy.deepcopy(legacy['books']);F=copy.deepcopy(legacy['films']);S=[]
 for b in B:
  old=bookname(b);b['Engelse titel']=ba.get(old,old)
  if old!=bookname(b):b['aliases']=[old];changes.append({'category':'books','title':old,'field':'originalTitle','before':old,'after':bookname(b)})
 for raw in legacy['stories']:
  s=copy.deepcopy(raw);s['Engelse verhaalnaam']=sa.get(storyname(s),storyname(s));s['Engelse bundel']=ba.get(s['Engelse bundel'],s['Engelse bundel']);existing=next((r for r in S if norm(storyname(r))==norm(storyname(s))),None)
  if existing:existing['collections']=list(dict.fromkeys(existing['collections']+[s['Engelse bundel']]))
  else:s['collections']=[s['Engelse bundel']];S.append(s)
 for f in F:f.pop('verified',None)
 allbookrows=[r for r in ref['index'] if r['type'] in ['Novel','Bachman Novel','Story Collection']]
 serialrows=[r for r in allbookrows if r['title'].startswith('The Green Mile:') and 'Complete Serial Novel' not in r['title']]
 bookrows=[r for r in allbookrows if r['title'] not in variants and r not in serialrows]
 storyrows=list({r['url']:r for r in ref['index'] if r['type'] in ['Short Story','Novella','Uncollected']}.values())
 filmrows=[r for r in ref['index'] if r['type'] in ['Movie','Television']]
 # Separately published novellas remain accessible in the library and in the story index.
 for r in storyrows:
  d=details[r['url']];fmt=d['fields'].get('Available Format(s)','')
  if r['title'] in ['Elevation',"Gwendy's Button Box",'Blockade Billy']:bookrows.append(r)
 def audit_record(r,category,official=None):
  r['id']=category+':'+slug(bookname(r) if category=='books' else storyname(r) if category=='stories' else filmname(r)+'-'+str(r.get('Jaar') or 'tbd'))
  r['audit']={'checked':checked,'scope':'field-level','fields':{},'uncertain':[]}
  if official:r['audit']['reference']=official['url']
  return r
 def apply(r,cat,rr):
  d=details[rr['url']];fields=d['fields'];a=r['audit'];
  if cat=='films' and parse_date(rr['displayDate']) and parse_date(fields.get('Released')) and parse_date(rr['displayDate'])[:4]!=parse_date(fields.get('Released'))[:4]:
   a['detailUsable']=False;a['uncertain'].append('sharedSourceUrlCollision');fields={'Released':rr['displayDate']}
  r['Bron']=rr['url'];r['referenceTitle']=rr['title'];a['fields'].update(title={'status':'checked','source':rr['url']},type={'status':'checked','source':rr['url']})
  release=parse_date(fields.get('Released'));idx=parse_date(rr['displayDate'])
  override=ed['dateOverrides'].get((filmname(r)+'|'+str(r.get('Jaar'))) if cat=='films' else storyname(r) if cat=='stories' else bookname(r))
  if override:release=override['date'];r.setdefault('sources',[]).append(override['source'])
  if idx and release and idx[:4]!=release[:4]:conflicts.append({'title':rr['title'],'category':cat,'field':'index/detail date','index':rr['displayDate'],'detail':fields.get('Released'),'decision':'Use detail field; keep index as evidence','source':rr['url']})
  if release:
   prev=r.get('Jaar');y=int(release[:4])
   if cat=='stories':r['reportedDate']=release;r['dateMeaning']='official-record-date';r['Jaar']=y
   elif prev and prev!=y and not override:
    a['uncertain'].append('publicationYear' if cat=='books' else 'releaseDate');r['reportedDate']=release
    conflicts.append({'title':rr['title'],'category':cat,'field':'legacy/detail year','legacy':prev,'detail':release,'decision':'Retain legacy year; do not equate edition, festival, broadcast and first publication dates','source':rr['url']})
   else:
    r['Jaar']=y;r['reportedDate']=release
    if cat=='films':r['release']=release
    a['fields']['date']={'status':'checked-source-date','source':override['source'] if override else rr['url'],'precision':{4:'year',7:'month',10:'day'}[len(release)],'meaning':'official-record-date'}
   r['status']='released' if cat=='films' else 'published'
  else:
   # TBD and Unreleased are not evidence of production, a renewal, or publication.
   r['status']='unconfirmed';a['uncertain'].append('releaseDate' if cat=='films' else 'publicationDate')
  if cat=='books':
   if rr['type']=='Story Collection' or rr['title']=='The Bachman Books':r['Type']='Bundel / verzameling'
   elif rr['type']=='Novella':r['Type']='Novelle'
   elif rr['title'].startswith('The Green Mile:') and 'Complete' not in rr['title']:r['Type']='Seriedeel'
   elif rr['type']=='Collaboration':r['Type']='Strip' if '/comic/' in rr['url'] else 'Fotoboek' if rr['title']=='Nightmares in the Sky' else 'Bijdragenbundel' if rr['title'].startswith('Mid-Life Confidential') else 'Non-fictie'
   else:r['Type']='Roman'
   r['Auteur']='Richard Bachman' if rr['type']=='Bachman Novel' else r.get('Auteur','Stephen King')
   if fields.get('Written With'):r['Auteur']+=' / '+fields['Written With']
   if fields.get('Publisher'):r['publisher']=fields['Publisher'];a['fields']['publisher']={'status':'checked','source':rr['url']}
  elif cat=='stories':
   r['Type']='Novelle' if rr['type']=='Novella' else 'Verhaal';r['Auteur']='Stephen King'+(' / '+fields['Written With'] if fields.get('Written With') else '')
  else:
   if rr['type']=='Movie':r['Medium']='Film'
   for source,target in [('Director(s)','director'),('Channel/Service','platform'),('Distributor(s)','distributor')]:
    if fields.get(source):r[target]=fields[source];a['fields'][target]={'status':'checked','source':rr['url']}
   # Explicit format labels only; a poster directory is not proof of TV format.
   fmt=fields.get('Available Format(s)','').lower()
   if 'tv series' in fmt:r['Medium']='Televisieserie';a['fields']['format']={'status':'checked','source':rr['url']}
  return d
 # Add every literary/book project from the official collaboration index, with roles refined below.
 collabextras=[]
 for d in collab['details']:
  if any(x in d['url'] for x in ['/nonfiction/','/comic/']):
   rr={'title':d['title'],'type':'Collaboration','displayDate':d['fields'].get('Released',''),'url':d['url']};bookrows.append(rr);collabextras.append(rr)
 # Apply primary title/type/source checks to every existing item and add missing reference entities.
 matched={'books':set(),'stories':set(),'films':set()}
 for cat,rows,current,titlekey in [('books',bookrows,B,'Engelse titel'),('stories',storyrows,S,'Engelse verhaalnaam'),('films',filmrows,F,'Verfilming (EN)')]:
  for r in current:audit_record(r,cat)
  for rr in rows:
   cname=fa.get(rr['title'],rr['title']) if cat=='films' else ba.get(rr['title'],rr['title']) if cat=='books' else rr['title'];d=details[rr['url']];date=parse_date(rr['displayDate']) if cat=='films' else parse_date(d['fields'].get('Released'));year=int(date[:4]) if date else None
   if cat=='films' and cname=='11.22.63':year=2016
   matches=[r for r in current if norm(r[titlekey])==norm(cname)]
   if cat=='films':
    wantedTV=rr['type']=='Television';matches=[r for r in matches if (r.get('Medium')!='Film')==wantedTV]
    byyear=[r for r in matches if r.get('Jaar')==year];matches=byyear or (matches if len(matches)==1 else [])
   r=matches[0] if matches else None
   if r is None:
    r={titlekey:cname,'Jaar':year,'Bron':rr['url']}
    if cat=='books':r.update({'Nederlandse titel (indicatief)':None,'Auteur':'Stephen King'})
    if cat=='stories':r.update({'Engelse bundel':None,'collections':[],'Nederlandse verhaalnaam (geverifieerd waar bekend)':None})
    if cat=='films':r.update({'Medium':'Film' if rr['type']=='Movie' else 'Televisie','Bronwerk (EN)':None,'Relatie':'Nog te verifiëren'})
    audit_record(r,cat,rr);current.append(r);changes.append({'category':cat,'title':cname,'action':'added','source':rr['url']})
   r['audit']['reference']=rr['url'];matched[cat].add(rr['url']+'|'+rr['displayDate'] if cat=='films' else rr['url']);apply(r,cat,rr)
  for r in current:
   if not r['audit']['fields']:r['audit']['uncertain'].append('referenceMatch')
 # Classify every imported collection contribution, including poems and an essay.
 for story in S[:]:
  if storyname(story) in ['Rage','The Long Walk','Roadwork','The Running Man']:
   S.remove(story);changes.append({'category':'stories','title':storyname(story),'action':'moved-novel-to-book-contents','reason':'A collected Bachman novel is not a short story.'});continue
  if not story['audit'].get('reference'):
   rr=next((x for x in ref['index'] if norm(x['title'])==norm(storyname(story))) ,None)
   if rr:
    story['Bron']=rr['url'];story['audit']['fields']['title']={'status':'checked','source':ref['source']};story['audit']['uncertain']=[x for x in story['audit']['uncertain'] if x!='referenceMatch']
    story['Type']={'Poem':'Gedicht','Essay':'Essay','Screenplay':'Scenario'}.get(rr['type'],'Bijdrage')
 for film in F:
  rr=film['audit'].get('reference');entry=next((x for x in bibliography['records'] if x['url']==rr and '/television/' in x['url']),None)
  if entry:
   fmt={'[Miniseries]':'Miniserie','[Series]':'Televisieserie','[Made-for-TV Movie]':'Televisiefilm'}.get(entry.get('format'))
   if fmt:
    if film.get('renewal') and fmt=='Miniserie':
     conflicts.append({'title':filmname(film),'category':'films','field':'format','bibliography':fmt,'current':'Televisieserie','decision':'Renewal from the cited current studio source takes precedence over the older miniseries label.','source':bibliography['source']});fmt='Televisieserie'
    film['Medium']=fmt;film['audit']['fields']['format']={'status':'checked','source':bibliography['source']}
 # Include two independently documented franchise extensions without pretending this exhausts derivative works.
 for raw in ed['extraFilms']:
  r=copy.deepcopy(raw);audit_record(r,'films');r['audit']['fields']={'title':{'status':'checked','source':r['Bron']},'date':{'status':'checked','source':r['Bron']}}
  r['audit']['uncertain']+=['director','formatDetails'];F.append(r);changes.append({'category':'films','title':filmname(r),'action':'added','source':r['Bron']})
 # Authorship is not inferred from an illustration, a foreword, or a recommendation.
 for r in B+S:
  name=bookname(r) or storyname(r);d=details.get(r['audit'].get('reference'),{});co=d.get('fields',{}).get('Written With')
  r['authors']=[{'name':'Stephen King','role':'author'}]
  if r.get('Auteur')=='Richard Bachman':r['authors'][0]['creditedAs']='Richard Bachman'
  if co and name not in contributors:
   r['authors'].append({'name':co,'role':'coauthor'});r['collaboration']={'kind':'coauthored','source':d['url']};r['audit']['fields']['authors']={'status':'checked','source':d['url']}
  if name in contributors:
   info=contributors[name];r['authors']=info['authors'];r['collaboration']={k:v for k,v in info.items() if k!='authors'};r['audit']['fields']['authors']={'status':'checked-named-roles','source':info['source']}
   if info.get('incomplete'):r['audit']['uncertain'].append('completeContributorList')
  r['Auteur']=' / '.join(a.get('creditedAs',a['name']) for a in r['authors'] if a['role'] in ['author','coauthor','contributor'])
 # Links resolve by canonical source URL or exact title; no fuzzy title-only remake matching.
 def work_by_url(url):
  for arr in [B,S]:
   for r in arr:
    if r.get('audit',{}).get('reference')==url:return r,('books' if arr is B else 'stories')
  # The official site's related links sometimes use /novel/ for a novella and /short_story/ for a short story.
  tail=url.rsplit('/',1)[-1]
  for arr in [B,S]:
   for r in arr:
    if r.get('audit',{}).get('reference','').rsplit('/',1)[-1]==tail:return r,('books' if arr is B else 'stories')
  return None,None
 # Every collection membership stays visible; additionally distinguish confirmed memberships from imported ones.
 for s in S:
  reference=s['audit'].get('reference');d=details.get(reference,{})
  confirmed=[]
  for link in d.get('workLinks',[]):
   b,kind=work_by_url(link['url'])
   if b and kind=='books' and b.get('Type')=='Bundel / verzameling':confirmed.append(bookname(b))
  for b in B:
   bd=details.get(b['audit'].get('reference'),{})
   if b.get('Type')=='Bundel / verzameling' and any(link['url']==reference for link in bd.get('workLinks',[])):confirmed.append(bookname(b))
  s['collections']=list(dict.fromkeys(s['collections']+confirmed));s['verifiedCollections']=list(dict.fromkeys(confirmed));s['Engelse bundel']=s['collections'][0] if s['collections'] else None
  if confirmed:s['audit']['fields']['collection']={'status':'checked','source':reference}
  else:s['audit']['uncertain'].append('collectionMembership')
 for f in F:
  d=details.get(f['audit'].get('reference'),{}) if f['audit'].get('detailUsable',True) else {};sources=[]
  for link in d.get('workLinks',[])+d.get('related',[]):
   w,kind=work_by_url(link['url'])
   if w:sources.append({'kind':kind,'title':bookname(w) if kind=='books' else storyname(w),'id':w['id']})
  # Prefer the actual novella/story, retain its containing collection as an additional source.
  sources=list({x['id']:x for x in sources}.values());sources.sort(key=lambda x: x['kind']!='stories')
  old=f.get('Bronwerk (EN)');old=ba.get(old,sa.get(old,old))
  if sources:
   f['sourceWorks']=sources;f['Bronwerk (EN)']=sources[0]['title'];f['Relatie']='Gebaseerd op / geïnspireerd door';f['audit']['fields']['sourceWorks']={'status':'checked','source':f['Bron']}
  else:
   f['Bronwerk (EN)']=old;f['sourceWorks']=[{'kind':kind,'title':name(r),'id':r['id']} for kind,arr,name in [('books',B,bookname),('stories',S,storyname)] for r in arr if old and norm(name(r))==norm(old)]
   f['audit']['uncertain'].append('sourceRelationship')
  for field in ['cast']:
   if not f.get(field):f['audit']['uncertain'].append(field)
  if not f.get('director') and not f.get('showrunner'):f['audit']['uncertain'].append('directorOrShowrunner')
  if f.get('Medium')=='Televisie':f['audit']['uncertain'].append('tvFormat')
 # Dutch references: exact independently recorded original-title pairs plus explicitly curated aliases.
 nlmap={}
 for r in dutch['records']:
  if not r.get('originalTitle') or '(comic)' in r.get('title',''):continue
  original=re.sub(r' \(Uit .*','',r['originalTitle']);title=re.sub(r'^Boek \| ','',r['title']).split(' | ')[0]
  nlmap[norm(title)]=original
 for b in B:
  title=bookname(b);legacyNL=b.get('Nederlandse titel (indicatief)')
  fan=next((r for r in dutch['records'] if r.get('originalTitle') and norm(r['originalTitle']) in [norm(title),norm(title.replace('The Dark Tower: ',''))] and '(comic)' not in r.get('title','')),None)
  if fan:b['dutchTitleSource']=fan['url']
  matches=[]
  for p in dutch['records']:
   if p['kind']!='publisher' or not p.get('isbn') or not p.get('kingAuthorLink') or p.get('language')!='nl-NL':continue
   pt=re.sub(r' \((?:POD|luxe editie)\)$','',p['title'],flags=re.I)
   mapped=ed['dutchAliases'].get(p['title']) or ed['dutchAliases'].get(pt) or nlmap.get(norm(pt))
   exactLegacy=legacyNL and norm(pt)==norm(legacyNL)
   if (mapped and norm(mapped)==norm(title)) or exactLegacy or (norm(pt)==norm(title) and p.get('isbn')):matches.append(p)
  if matches:
   # Prefer the existing verified edition when still listed, then a plain title rather than a tie-in or POD variant.
   old=legacy['media']['books'].get(next((k for k in legacy['media']['books'] if ba.get(k,k)==title),title),{}).get('nl')
   p=next((p for p in matches if old and p['isbn']==old.get('isbn')),matches[0]);
   if legacyNL and legacyNL!=p['title']:b['aliases']=list(dict.fromkeys(b.get('aliases',[])+[legacyNL]))
   b['Nederlandse titel (indicatief)']=p['title'];b['dutchTitleSource']=p.get('canonical') or p['url'];b['audit']['fields']['dutchEdition']={'status':'checked-edition-facts','source':b['dutchTitleSource']}
   candidates.append({'kind':'books','key':title,'language':'nl','title':p['title'],'isbn':p['isbn'],'image':p['image'],'source':b['dutchTitleSource'],'publisher':'Luitingh-Sijthoff','credit':'Luitingh-Sijthoff','checked':checked})
  else:b['audit']['uncertain'].append('dutchEdition')
 # Standalone Dutch story editions are evidenced by publisher ISBNs, not inferred from story illustrations.
 for story in S:
  story['standalonePublications']=[]
  for edition in dutch['records']:
   if edition['kind']!='publisher' or not edition.get('isbn') or edition.get('language')!='nl-NL':continue
   mapped=ed['dutchAliases'].get(edition.get('title'))
   if not mapped or norm(mapped)!=norm(storyname(story)):continue
   if any(norm(bookname(b))==norm(storyname(story)) for b in B):continue
   story['Nederlandse verhaalnaam (geverifieerd waar bekend)']=edition['title'];story['dutchTitleSource']=edition.get('canonical') or edition['url']
   story['standalonePublications'].append({'isbn':edition['isbn'],'title':edition['title'],'language':'nl','source':edition.get('canonical') or edition['url']})
   candidates.append({'kind':'stories','key':storyname(story),'language':'nl','title':edition['title'],'isbn':edition['isbn'],'image':edition['image'],'source':edition.get('canonical') or edition['url'],'publisher':'Luitingh-Sijthoff','credit':'Luitingh-Sijthoff','checked':checked})
 # Book art must come from a book/edition page, never a story page that happens to show a containing collection.
 for b in B:
  d=details.get(b['audit'].get('reference'),{})
  if d.get('image') and 'no_image' not in d['image']:
   candidates.append({'kind':'books','key':bookname(b),'language':'en','title':bookname(b),'image':d['image'],'source':d['url'],'publisher':b.get('publisher'),'credit':'StephenKing.com / respective publisher','edition':'Official displayed edition; ISBN unconfirmed','checked':checked})
 for f in F:
  d=details.get(f['audit'].get('reference'),{})
  if d.get('image') and 'no_image' not in d['image'] and f.get('Jaar') and f['audit'].get('detailUsable',True):
   candidates.append({'kind':'films','key':filmname(f)+'|'+str(f['Jaar']),'language':'en','title':filmname(f),'image':d['image'],'source':d['url'],'credit':'StephenKing.com / respective studio','checked':checked})
 # Carry the earlier explicitly checked images for supplementary items only if no current candidate replaces them.
 for k,langs in legacy['media']['books'].items():
  k=ba.get(k,k)
  for lang,m in langs.items():
   if not any(c['kind']=='books' and c['key']==k and c['language']==lang for c in candidates):candidates.append(dict(m,kind='books',key=k))
 for k,m in legacy['media']['films'].items():
  if not any(c['kind']=='films' and c['key']==k for c in candidates):candidates.append(dict(m,kind='films',key=k))
 M={'checked':checked,'books':{},'stories':{},'films':{}}
 for c in candidates:
  c['candidateId']=hashlib.sha256((c['kind']+'|'+c['key']+'|'+c['language']+'|'+c['image']).encode()).hexdigest()[:16]
  proof=review.get(c['candidateId'])
  if not proof or proof.get('status')!='verified':continue
  m={k:v for k,v in c.items() if k not in ['kind','key']};m['imageStatus']='verified';m['review']=proof
  if c['kind'] in ['books','stories']:M[c['kind']].setdefault(c['key'],{})[c['language']]=m
  else:M['films'][c['key']]=m
 # Book-to-book contents preserve the four collected Bachman novels after removing their misleading short-story duplicates.
 bachman=next(b for b in B if bookname(b)=='The Bachman Books')
 bachman['containsWorks']=[{'kind':'books','title':bookname(b),'id':b['id']} for b in B if bookname(b) in ['Rage','The Long Walk','Roadwork','The Running Man']]
 for b in B:
  if b.get('Type')=='Seriedeel':b['partOf']='The Green Mile: The Complete Serial Novel'
 # Publications are distinct from unique works, collections and translated editions.
 publications=[]
 for rr in allbookrows:
  parent=variants.get(rr['title']) or ('The Green Mile' if rr in serialrows else None)
  if not parent:continue
  if parent=='The Green Mile: The Complete Serial Novel':parent='The Green Mile'
  d=details[rr['url']]
  publications.append({'work':parent,'title':rr['title'],'kind':'serial-part' if rr in serialrows else 'edition-variant','reportedDate':parse_date(d['fields'].get('Released')),'source':rr['url']})
 green=next(b for b in B if bookname(b)=='The Green Mile')
 green['firstPublication']={'date':'1996-03','precision':'month','kind':'serial-start','source':serialrows[-1]['url'] if serialrows else green['Bron']}
 green['publicationNote']={'nl':'Eerst in zes delen in 1996; de bronpagina voor de verzamelde editie vermeldt 2000.','en':'First serialized in six parts in 1996; the collected-edition page reports 2000.'}
 for b in B:b['publications']=[x for x in publications if x['work']==bookname(b)]
 for entity in B+S:
  if entity is not green:entity['audit']['uncertain']=list(dict.fromkeys(entity['audit']['uncertain']+['firstPublicationHistory']))
 green['audit']['uncertain']=[x for x in green['audit']['uncertain'] if x!='publicationYear']
 write('data/publications.json',publications)
 # Existing Tower records are replaced only by explicit, sourced editorial connections.
 tower=read('data/tower-connections.json') if (ROOT/'data/tower-connections.json').exists() else copy.deepcopy(legacy['tower'])
 # Shared literary identities unite standalone novella records and story-index entries.
 for b in B:b['workId']='work:'+('collection:' if b.get('Type') in ['Bundel / verzameling','Bijdragenbundel'] else '')+slug(bookname(b))
 for story in S:
  story['workId']='work:'+slug(storyname(story))
  story['collectionIds']=[b['id'] for name in story['collections'] for b in B if norm(bookname(b))==norm(name)]
  story['collectionIds'].sort(key=lambda bid: next(b.get('Jaar') or 9999 for b in B if b['id']==bid))
  story['defaultCollectionId']=story['collectionIds'][0] if story['collectionIds'] else None
  story['standaloneBookId']=next((b['id'] for b in B if b['workId']==story['workId'] and b.get('Type')!='Bundel / verzameling'),None)
 editions=[];covers={}
 for entity in B+S:entity['editionIds']=[]
 for c in candidates:
  if c['kind'] not in ['books','stories']:continue
  entity=next(r for r in (B if c['kind']=='books' else S) if (bookname(r) if c['kind']=='books' else storyname(r))==c['key'])
  m=M[c['kind']].get(c['key'],{}).get(c['language']);eid='edition:'+c.get('isbn',hashlib.sha256((entity['workId']+'|'+c['language']+'|'+c['source']).encode()).hexdigest()[:16]);cid='cover:'+c['candidateId'] if m else None
  if not any(e['id']==eid for e in editions):editions.append({'id':eid,'workId':entity['workId'],'language':c['language'],'title':c['title'],'isbn':c.get('isbn'),'source':c['source'],'coverId':cid,'coverStatus':'verified' if m else 'unverified'})
  entity['editionIds'].append(eid)
  if m:
   m['editionId']=eid;m['coverId']=cid;covers[cid]={'id':cid,'editionId':eid,'image':m['image'],'language':c['language'],'status':'verified','source':m['source']}
 M['covers']=covers
 works=list({r['workId']:{'id':r['workId'],'title':bookname(r) or storyname(r),'kind':'collection' if r.get('Type') in ['Bundel / verzameling','Bijdragenbundel'] else 'literary-work','authors':r['authors']} for r in B+S}.values())
 catalog={'books':B,'stories':S,'films':F,'tower':tower,'works':works,'editions':editions}

 (ROOT/'catalog.js').write_text('// Generated by scripts/build_catalog.py; original import: data/legacy-v1.4.json\nconst DB = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
 (ROOT/'media.js').write_text('// Generated: only source-matched, successfully fetched and visually reviewed images.\nconst MEDIA = '+json.dumps(M,ensure_ascii=False,indent=2)+';\n')
 write('data/image-candidates.json',candidates)
 ledger={'checked':checked,'scopeDefinitions':{'books':'Unique official novels/Bachman novels/collections plus three separately published novellas. Four edition variants and six Green Mile serial publications are attached to their work and do not inflate the work count.','stories':'Unique official Short Story/Novella/Uncollected URLs, plus imported collection contributions; memberships are many-to-many. Dates are source-record dates, not automatically first publication.','films':'Official Movie/Television entities plus retained external adaptations and two sourced franchise additions. This is not an exhaustive derivative/short-film universe.'},'records':{cat:[{'id':r['id'],'title':r.get('Engelse titel') or r.get('Engelse verhaalnaam') or filmname(r),'audit':r['audit']} for r in arr] for cat,arr in [('books',B),('stories',S),('films',F)]},'referenceCoverage':{},'conflicts':conflicts,'changes':changes,'editionVariants':variants,'publicationRecordsCompared':len(allbookrows)+3,'attachedPublications':publications,'unreachableDutchSources':[r for r in dutch['records'] if 'error' in r],'supplementaryScreenQueue':ed['supplementaryScreenQueue']}
 for cat,rr,arr in [('books',bookrows,B),('stories',storyrows,S),('films',filmrows,F)]:
  urls={r['url']+'|'+r['displayDate'] if cat=='films' else r['url'] for r in rr};missing=urls-matched[cat];ledger['referenceCoverage'][cat]={'expected':len(urls),'present':len(arr),'referenceMatched':len(matched[cat]),'missing':sorted(missing),'uncertainRecords':sum(bool(r['audit']['uncertain']) for r in arr)}
 ledger['images']={'nl':sum('nl' in x for x in M['books'].values()),'en':sum('en' in x for x in M['books'].values()),'posters':len(M['films'])}
 ledger['referenceCoverage']['stories']['expectedUniqueWorks']=len({norm(sa.get(r['title'],r['title'])) for r in storyrows})
 ledger['referenceCoverage']['books']['expectedUniqueWorks']=len(bookrows)
 ledger['referenceCoverage']['films']['expectedUniqueWorks']=len(filmrows)
 ledger['collaborations']={'source':collab['source'],'referenceEntries':len(collab['index']),'uniqueRecordedProjects':len({r['workId'] for r in B+S if r.get('collaboration')}),'scopeNote':'Includes literary co-authorship and separately labelled comic/photographic/contributed projects; not all contributors to an anthology are co-authors of one text.'}
 ledger['collaborations']['missingReferenceEntries']=[row['title'] for row in collab['index'] if not any((norm(bookname(r) or storyname(r))==norm(row['title']) or (row['title']=='Mid-Life Confidential' and (bookname(r) or storyname(r)).startswith('Mid-Life Confidential:'))) and r.get('collaboration') for r in B+S)]
 ledger['storyCovers']={'collectedStories':sum(bool(s['defaultCollectionId']) for s in S),'withoutRecordedCollection':sum(not s['defaultCollectionId'] for s in S),'standaloneWorks':len({s['workId'] for s in S if s['standaloneBookId'] or s['standalonePublications']}),'extraDutchStandaloneCovers':sum('nl' in v for v in M['stories'].values()),'extraEnglishStandaloneCovers':sum('en' in v for v in M['stories'].values())}
 write('data/audit.json',ledger)
 print('Catalog:',{k:len(v) for k,v in catalog.items()},'Artwork:',ledger['images'],'Changes:',len(changes),'Conflicts:',len(conflicts))
if __name__=='__main__':main()
