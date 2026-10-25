import sys,json
from pathlib import Path
sys.path.insert(0,'scripts')
from collect_reference import fetch,parse_index,attrs,clean
import re
out=[]
for kind in ['novel','collection','short','movie','television','collaboration']:
 u='https://stephenking.com/works/'+kind+'/index.html'
 try:
  s=fetch(u,Path('/tmp/kingverse-reference'));rows=[]
  for a,b in re.findall(r'<a\s+([^>]*class="row work"[^>]*)>(.*?)</a>',s,re.S):
   at=attrs(a);v=[clean(x) for x in re.findall(r'<div[^>]*>(.*?)</div>',b,re.S)]
   if len(v)==3:rows.append({'title':v[0],'type':v[1],'displayDate':v[2],'url':'https://stephenking.com'+at['href']})
  out.append({'category':kind,'source':u,'records':rows});print(kind,len(rows))
 except Exception as e:out.append({'category':kind,'source':u,'error':str(e)})
Path('data/reference/categories.json').write_text(json.dumps({'checked':'2026-10-25','categories':out},ensure_ascii=False,indent=2)+'\n')
