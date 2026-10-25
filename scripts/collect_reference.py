#!/usr/bin/env python3
"""Collect factual metadata from public source pages; no synopsis text is republished.
Uses two workers and a local cache. Does not bypass access restrictions.
python3 scripts/collect_reference.py --cache /tmp/kingverse-reference
"""
import argparse, concurrent.futures, hashlib, html, json, re, urllib.request
from pathlib import Path
from urllib.parse import urljoin

def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', s))).strip()
def attrs(s): return dict((k,html.unescape(v)) for k,v in re.findall(r'([\w-]+)="([^"]*)"',s))
def fetch(url, cache):
 p=cache/(hashlib.sha256(url.encode()).hexdigest()+'.html')
 if not p.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'TheKingverse/1.5 bibliographic audit (public metadata)'})
  with urllib.request.urlopen(req,timeout=30) as r:
   if 'text/html' not in r.headers.get('Content-Type',''):raise ValueError('Not HTML')
   p.write_bytes(r.read())
 return p.read_text(errors='replace')
def parse_index(s):
 out=[]
 for a,body in re.findall(r'<a\s+([^>]*class="row work"[^>]*)>(.*?)</a>',s,re.S):
  at=attrs(a);v=[clean(x) for x in re.findall(r'<div[^>]*>(.*?)</div>',body,re.S)]
  if len(v)==3:out.append(dict(title=v[0],type=v[1],displayDate=v[2],date=at.get('data-date'),url=urljoin('https://stephenking.com',at['href'])))
 assert len(out)>600,'Unexpected official index markup'
 return out

def parse_detail(url,s):
 h=re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S)
 fields={clean(k):clean(v) for k,v in re.findall(r'<p class="content-header[^>]*>(.*?)</p>\s*<p class="content-content[^>]*>(.*?)</p>',s,re.S)}
 images=[attrs(x) for x in re.findall(r'<img\s+([^>]+)>',s)]
 art=next((x for x in images if x.get('alt','').endswith(' Art')),None)
 related=[]
 for a,b in re.findall(r'<a\s+([^>]*class="alternate"[^>]*)>(.*?)</a>',s,re.S):
  at=attrs(a)
  if at.get('href','').startswith('/works/'):related.append({'url':urljoin(url,at['href']),'label':clean(b)})
 # Collection content links are factual membership claims, not synopsis prose.
 links=[]
 for a,b in re.findall(r'<a\s+([^>]*href="/works/(?:short|short_story|novella|collection|novel)/[^>]+)>(.*?)</a>',s,re.S):
  at=attrs(a)
  if at.get('href'):links.append({'url':urljoin(url,at['href']),'label':clean(b)})
 return {'url':url,'title':clean(h[1]) if h else None,'fields':fields,'image':urljoin(url,art['src']) if art else None,'imageAlt':art.get('alt') if art else None,'related':related,'workLinks':list({x['url']:x for x in links}.values()),'sha256':hashlib.sha256(s.encode()).hexdigest()}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',default='/tmp/kingverse-reference');ap.add_argument('--checked',default='2026-10-25');args=ap.parse_args();cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
 url='https://stephenking.com/works/all/';raw=fetch(url,cache);rows=parse_index(raw)
 scope={'Novel','Bachman Novel','Story Collection','Novella','Short Story','Uncollected','Movie','Television'}
 urls=list(dict.fromkeys(r['url'] for r in rows if r['type'] in scope));details=[];errors=[]
 def task(u):
  try:return parse_detail(u,fetch(u,cache))
  except Exception as e:return {'url':u,'error':str(e)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
  for i,r in enumerate(ex.map(task,urls),1):
   (errors if 'error' in r else details).append(r)
   if i%25==0:print(f'Official detail pages: {i}/{len(urls)}',flush=True)
 # Cache the companion bibliography so parse_bibliography.py can refresh its factual snapshot.
 fetch('https://stephenking.com/bibliography/',cache)
 output={'checked':args.checked,'source':url,'sourceSha256':hashlib.sha256(raw.encode()).hexdigest(),'scopeTypes':sorted(scope),'index':rows,'details':details,'errors':errors}
 Path('data/reference/official.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 print('Saved',len(rows),'index rows;',len(details),'detail pages;',len(errors),'errors',flush=True)

if __name__=='__main__':main()
