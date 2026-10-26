#!/usr/bin/env python3
"""Explicit research only. Two workers, public HTML, local private cache, no images or bypass.
Acquisition hashes/errors are public; source prose stays in the private cache, never the dataset.
This collector does not certify or generate relationships. Normal builds/tests are offline.
"""
import argparse,concurrent.futures,hashlib,html,json,re,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def clean(value):
 value=re.sub(r'<(script|style)\b[^>]*>.*?</\1>',' ',value,flags=re.S|re.I)
 return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',value))).strip()
def collect(url,cache,checked):
 out={'url':url,'checked':checked,'attempted':True}
 try:
  target=cache/(hashlib.sha256(url.encode()).hexdigest()+'.html')
  if target.exists():raw=target.read_bytes();out['cacheUsed']=True
  else:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'TheKingverse/1.7 scoped bibliographic relationship review'}),timeout=30) as response:
    if 'text/html' not in response.headers.get('Content-Type',''):raise ValueError('Not HTML; not downloaded')
    raw=response.read();out.update(status=response.status,finalUrl=response.url,cacheUsed=False)
   target.write_bytes(raw)
  out.update(sha256=hashlib.sha256(raw).hexdigest(),access='public-html')
 except Exception as e:out.update(access='unavailable',error=str(e))
 return out

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);parser.add_argument('--checked',required=True);args=parser.parse_args()
 if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',args.checked):raise ValueError('Use an explicit observation date')
 cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
 inventory=json.loads((ROOT/'data/migration/batch-05-inventory.json').read_text())
 extra=ROOT/'data/migration/batch-05-supplemental-urls.json'
 urls=list(dict.fromkeys([r['source'] for r in inventory['screenCandidateScope']]+[r['source'] for r in inventory['legacyTower']]+(json.loads(extra.read_text()) if extra.exists() else [])))
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(lambda u:collect(u,cache,args.checked),urls))
 (ROOT/'data/migration/batch-05-acquisition.json').write_text(json.dumps({'checked':args.checked,'scope':'Exact 78 inherited source candidates plus 17 Tower source records; URLs deduplicated. Acquisition is not verification.','sources':rows},indent=2)+'\n')
 review=[]
 for r in rows:
  if r['access']!='public-html':review.append(r['url']+'\n'+r.get('error',''));continue
  raw=(cache/(hashlib.sha256(r['url'].encode()).hexdigest()+'.html')).read_text(errors='replace')
  # Strip navigation; retain temporary snippets for editorial reading only.
  chunks=re.findall(r'<(?:p|div|section)[^>]*(?:id|class)=[\"\'][^\"\']*(?:synopsis|notes|from_the_box|overview|about-book)[^\"\']*[\"\'][^>]*>(.*?)</(?:p|div|section)>',raw,re.S|re.I)
  text=clean(' '.join(chunks)) if chunks else clean(raw)
  review.append(r['url']+'\n'+text[:16000])
 (cache/'private-review.txt').write_text('\n\n'.join(review))
 print(json.dumps({'urls':len(rows),'available':sum(r['access']=='public-html' for r in rows),'unavailable':[r for r in rows if r['access']!='public-html']},indent=2))
if __name__=='__main__':main()
