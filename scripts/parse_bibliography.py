#!/usr/bin/env python3
"""Extract factual bibliography fields from the cached official bibliography."""
import json,re,hashlib
from pathlib import Path
from collect_reference import clean,attrs
ROOT=Path(__file__).resolve().parent.parent
url='https://stephenking.com/bibliography/'
p=Path('/tmp/kingverse-reference')/(hashlib.sha256(url.encode()).hexdigest()+'.html')
s=p.read_text(errors="replace");rows=[]
for at,body in re.findall(r'<a\s+([^>]*class="bibliography-content"[^>]*)>(.*?)</a>',s,re.S):
 a=attrs(at)
 if not a.get('href'):continue
 fields={k:clean(v).rstrip('.') for k,v in re.findall(r'<span class="([^"]+)">(.*?)</span>',body,re.S)}
 rows.append({'url':'https://stephenking.com'+a['href'],'title':a.get('data-sort'),**fields})
(ROOT/'data/reference/bibliography.json').write_text(json.dumps({'checked':'2026-10-25','source':url,'sha256':hashlib.sha256(s.encode()).hexdigest(),'records':rows},ensure_ascii=False,indent=2)+'\n')
print('Bibliography entries:',len(rows));print('TV formats:',[(r['title'],r.get('format')) for r in rows if '/television/' in r['url']])
