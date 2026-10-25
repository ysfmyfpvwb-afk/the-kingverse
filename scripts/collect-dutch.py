#!/usr/bin/env python3
"""Collect independent Dutch title/ISBN references and official publisher edition facts."""
import concurrent.futures,hashlib,json,re,argparse
from pathlib import Path
from collect_reference import clean,attrs,fetch

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',default='/tmp/kingverse-reference');args=ap.parse_args();cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
 fan='https://www.stephenking.nl/skfnieuw/boeken/boeken-op-titel/'
 publisher='https://www.lsuitgeverij.nl/auteur/stephen-king/'
 fans=sorted(set(re.findall(r'href="(https://www.stephenking.nl/skfnieuw/boeken/boeken-op-titel/boek-[^"]+)"',fetch(fan,cache))))
 pubs=list(dict.fromkeys(re.findall(r'href="(https://www.lsuitgeverij.nl/boek/[^"]+)"',fetch(publisher,cache))))
 def task(pair):
  kind,url=pair
  try:
   raw=fetch(url,cache);h=re.search(r'<h1[^>]*>(.*?)</h1>',raw,re.S);title=clean(h[1]) if h else None
   r={'url':url,'title':title,'kind':kind,'sha256':hashlib.sha256(raw.encode()).hexdigest()}
   if kind=='fanclub':
    text=clean(raw);m=re.search(r'Originele titel: (.*?)(?:Auteur\(s\):|Auteur:|Jaartal eerste uitgave:)',text)
    r['originalTitle']=m[1].strip() if m else None;r['isbns']=list(dict.fromkeys(re.findall(r'97[89][ -]?(?:[0-9][ -]?){10}',text)))
   else:
    graphs=[]
    for item in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>',raw,re.S):
     try:graphs+=json.loads(item).get('@graph',[])
     except (ValueError,AttributeError):pass
    web=next((g for g in graphs if g.get('@type')=='WebPage'),{})
    image=web.get('thumbnailUrl');m=re.search(r'97[89]\d{10}',image or '')
    r.update(image=image,isbn=m[0] if m else None,canonical=web.get('url'),language=web.get('inLanguage'))
    r['kingAuthorLink']=bool(re.search(r'href="(?:https://www.lsuitgeverij.nl)?/auteur/stephen-king/?"',raw))
   return r
  except Exception as e:return {'url':url,'kind':kind,'error':str(e)}
 results=[]
 jobs=[('fanclub',u) for u in fans]+[('publisher',u) for u in pubs]
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
  for i,r in enumerate(ex.map(task,jobs),1):
   results.append(r)
   if i%25==0:print(f'Dutch sources: {i}/{len(jobs)}',flush=True)
 Path('data/reference/dutch.json').write_text(json.dumps({'checked':'2026-10-25','sources':[fan,publisher],'records':results},ensure_ascii=False,indent=2)+'\n')
 print('Saved Dutch reference:',len(fans),'fanclub pages,',len(pubs),'publisher pages',flush=True)
if __name__=='__main__':main()
