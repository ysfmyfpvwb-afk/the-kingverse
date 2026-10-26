#!/usr/bin/env python3
"""Explicit online audit only. Retains factual rows/response metadata, never synopsis or image bytes.
Normal migrations and tests read the checked-in evidence and require no network.
"""
import hashlib,json,re
from pathlib import Path
from urllib.request import Request,urlopen
from collect_reference import parse_index,attrs,clean
ROOT=Path(__file__).resolve().parent.parent
DATE='2026-10-26'
def get(url,referer=None):
 headers={'Referer':referer} if referer else {}
 with urlopen(Request(url,headers=headers),timeout=30) as r:return r.read(),{'httpStatus':r.status,'contentType':r.headers.get('Content-Type'),'finalUrl':r.url,'sha256':None}
def main():
 result={'checked':DATE,'scope':'Index metadata, linked bibliography rows and two existing English covers only; no detail-wide bibliographic verification','sources':{},'errors':[]}
 for name,url in [('index','https://stephenking.com/works/all/'),('bibliography','https://stephenking.com/bibliography/')]:
  try:
   body,meta=get(url);meta['sha256']=hashlib.sha256(body).hexdigest();text=body.decode('utf-8',errors='replace')
   if name=='index':rows=parse_index(text)
   else:
    rows=[]
    for at,body in re.findall(r'<a\s+([^>]*class="bibliography-content"[^>]*)>(.*?)</a>',text,re.S):
     a=attrs(at)
     if a.get('href'):
      fields={k:clean(v).rstrip('.') for k,v in re.findall(r'<span class="([^"]+)">(.*?)</span>',body,re.S)}
      rows.append({'url':'https://stephenking.com'+a['href'],'title':a.get('data-sort'),**fields})
    if len(rows)<600:raise ValueError('Unexpected bibliography markup; do not infer completeness')
   result['sources'][name]={'url':url,**meta,'rows':rows,'comparisonUnit':'source row; not unique work'}
  except Exception as e:result['errors'].append({'url':url,'error':str(e)})
 covers=[]
 for art in json.loads((ROOT/'data/v2/artworks.json').read_text()):
  if art['language']!='en':continue
  item={'artworkId':art['id'],'editionId':art['editionId'],'url':art['url'],'rightsStatus':'needs-review','permissionEvidence':None,'rightsNote':'Existing source is official, but no explicit republication licence or hotlink permission was established. No image is downloaded to the repository or proxied.','requests':[]}
  for referer in [None,'https://ysfmyfpvwb-afk.github.io/the-kingverse/explorer/']:
   try:
    data,meta=get(art['url'],referer);item['requests'].append({**meta,'referer':referer,'bytes':len(data),'jpegSignature':data[:3]==bytes.fromhex('ffd8ff')})
   except Exception as e:item['requests'].append({'referer':referer,'error':str(e)})
  covers.append(item)
 result['covers']=covers
 result['rightsSources']=[{'url':'https://stephenking.com/works/novel/talisman.html','finding':'Official page offers cover imagery and carries an all-rights-reserved notice; availability is not evidence of a republication licence.'},{'url':'https://stephenking.com/other/terms_of_use.html','finding':'Attempted location was inaccessible via web tool; no permission inferred.'}]
 (ROOT/'data/migration/source-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print('Source audit:',{k:len(v['rows'])for k,v in result['sources'].items()},'errors',len(result['errors']))
if __name__=='__main__':main()
