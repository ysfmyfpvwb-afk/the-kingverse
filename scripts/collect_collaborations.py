import sys,json,re
from pathlib import Path
sys.path.insert(0,'scripts')
from collect_reference import fetch,parse_index,parse_detail
cache=Path('/tmp/kingverse-reference');url='https://stephenking.com/works/collaboration/index.html';s=fetch(url,cache)
# Collaboration index uses its own type labels but the same factual rows.
from collect_reference import clean,attrs
rows=[]
for a,b in re.findall(r'<a\s+([^>]*class="row work"[^>]*)>(.*?)</a>',s,re.S):
 at=attrs(a);v=[clean(x) for x in re.findall(r'<div[^>]*>(.*?)</div>',b,re.S)]
 if len(v)==3:rows.append({'title':v[0],'type':v[1],'displayDate':v[2],'url':'https://stephenking.com'+at['href']})
extra=['https://stephenking.com/works/other-project/ghost-brothers-of-darkland-county.html','https://stephenking.com/works/novella/gwendys-button-box.html']
details=[]
for u in list(dict.fromkeys([r['url'] for r in rows]+extra)):
 try:details.append(parse_detail(u,fetch(u,cache)))
 except Exception as e:print(u,str(e))
Path('data/reference/collaborations.json').write_text(json.dumps({'checked':'2026-10-25','source':url,'index':rows,'details':details},ensure_ascii=False,indent=2)+'\n')
print('Collaborations',len(rows));print([(r['title'],r['fields']) for r in details])
