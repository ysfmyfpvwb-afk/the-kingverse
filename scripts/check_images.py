#!/usr/bin/env python3
"""Check image availability and emit contact sheets for human title/language review.
A successful HTTP response alone never approves an image for display.
"""
import concurrent.futures,hashlib,io,json,urllib.request
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent.parent
items=json.loads((ROOT/'data/image-candidates.json').read_text());out=Path('/tmp/kingverse-image-review');out.mkdir(exist_ok=True)

def task(pair):
 i,c=pair;u=c['image'];p=out/(hashlib.sha256(u.encode()).hexdigest()+'.image')
 try:
  if not p.exists():
   with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'TheKingverse/1.5 artwork verification'}),timeout=25) as r:p.write_bytes(r.read())
  raw=p.read_bytes();im=Image.open(io.BytesIO(raw)).convert('RGB');w,h=im.size
  if min(w,h)<20:raise ValueError('Blank/placeholder-sized image')
  im.thumbnail((156,205));tile=Image.new('RGB',(180,255),'#16161d');tile.paste(im,((180-im.width)//2,0));d=ImageDraw.Draw(tile)
  d.text((3,207),str(i)+' '+c['language']+' '+c['kind'],fill='#e6b882');d.text((3,222),c['key'][:27],fill='white');d.text((3,238),c['key'][27:54],fill='white')
  return {'index':i,'candidateId':c['candidateId'],'url':u,'fetchStatus':'available','sha256':hashlib.sha256(raw).hexdigest(),'width':w,'height':h},tile
 except Exception as e:return {'index':i,'candidateId':c['candidateId'],'url':u,'fetchStatus':'unavailable','error':str(e)},None
results=[];sheets={}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
 for record,tile in ex.map(task,enumerate(items)):
  results.append(record);i=record['index'];sheetnum=i//36;cell=i%36
  if sheetnum not in sheets:sheets[sheetnum]=Image.new('RGB',(1080,1530),'#0d0d11')
  if tile:sheets[sheetnum].paste(tile,((cell%6)*180,(cell//6)*255))
  if (i+1)%25==0:print('Image checks:',i+1,'/',len(items),flush=True)
for k,v in sheets.items():v.save(out/('sheet-'+str(k)+'.jpg'))
(ROOT/'data/image-fetch-results.json').write_text(json.dumps(results,indent=2)+'\n')
print('Images available:',sum(r['fetchStatus']=='available' for r in results),'/',len(results),flush=True)
