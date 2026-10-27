#!/usr/bin/env python3
"""Explicit, resumable HTML-metadata acquisition. No discovery crawl or media fetch.
Run --batch control first, then --batch 1..N (max twenty targets). Cached
facts/hashes are reviewed inputs; ordinary builds never use the network.
"""
import argparse, hashlib, html, json, re, time, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'data/completion/acquisition.json'
def clean(s):return html.unescape(re.sub('<[^>]+>', ' ', s)).strip()
def extract(raw,url):
 def one(p):
  m=re.search(p,raw,re.S|re.I);return re.sub(r'\s+',' ',clean(m[1])).strip() if m else None
 r={'title':one(r'<h1[^>]*>(.*?)</h1>')}
 if 'lsuitgeverij.nl/boek/' in url:
  for k,label in [('isbn13','ISBN'),('language','Taal'),('publicationDate','Publicatiedatum'),('translator','Vertaler')]:
   r[k]=one(r'<li>\s*'+label+r':\s*<b>(.*?)</b>')
  r['format']=one(r'<div id="boekdb_v2_productform"[^>]*>(.*?)</div>')
 else:
  # Preserve only labelled bibliographic header facts; never synopsis/characters.
  for k,label in [('released','Released'),('publisher','Publisher'),('formats',r'Available Format\(s\)'),('projectType','Project Type')]:
   r[k]=one(r'<(?:h[1-6]|div|span|p)[^>]*>\s*'+label+r'\s*</[^>]+>\s*<[^>]+>(.*?)</[^>]+>')
 return r
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--batch',required=True);args=ap.parse_args()
 jobs=json.loads((ROOT/'data/completion/acquisition-plan.json').read_text())['batches'][args.batch]
 assert len(jobs)<=20
 saved=json.loads(DEST.read_text()) if DEST.exists() else {'observedAt':'2026-10-27','records':[]}
 for job in jobs:
  if any(r['url']==job['url'] for r in saved['records']):continue
  r={**job,'observedAt':'2026-10-27'}
  try:
   with urllib.request.urlopen(urllib.request.Request(job['url'],headers={'User-Agent':'Kingverse bibliographic metadata review'}),timeout=25) as response:
    assert 'text/html' in response.headers.get('Content-Type','')
    raw=response.read().decode('utf-8');r.update(status=response.status,finalUrl=response.url,sha256=hashlib.sha256(raw.encode()).hexdigest(),facts=extract(raw,job['url']))
  except Exception as e:r['error']=str(e)
  saved['records'].append(r);pending=DEST.with_suffix('.pending');pending.write_text(json.dumps(saved,ensure_ascii=False,indent=2)+'\n');pending.replace(DEST)
  print(job['url'],r.get('status',r.get('error')),flush=True);time.sleep(.35)
