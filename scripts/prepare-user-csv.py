import csv,sys,json,hashlib,re,unicodedata,collections,os
from urllib.parse import urlparse
csv.field_size_limit(10000000)
path,out=sys.argv[1:3]
os.makedirs(out,exist_ok=True)
digest=hashlib.sha256()
with open(path,'rb') as f:
 for block in iter(lambda:f.read(1024*1024),b''):digest.update(block)
file_hash=digest.hexdigest()
source={'id':'provided-tabelog-'+file_hash[:16],'name':'利用者提供の飲食店情報CSV','url':'https://tabelog.com/','license':'利用者提供データ','license_url':'https://tabelog.com/','record_date':None,'scope':'利用者が指定した一都三県の飲食店CSV。出典ページURLと原本の各項目を保存。内容の最新性・営業状況は未確認。'}
pref_map={'tokyo':'東京都','東京':'東京都','kanagawa':'神奈川県','神奈川':'神奈川県','saitama':'埼玉県','埼玉':'埼玉県','chiba':'千葉県','千葉':'千葉県'}
def canonical(raw):return json.dumps(raw,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def url(value):
 value=value.strip();parsed=urlparse(value)
 return value if parsed.scheme in ('https','http') and parsed.hostname and '.' in parsed.hostname and not parsed.username and parsed.hostname not in ('localhost','127.0.0.1','0.0.0.0') else None
rows=0;valid=0;ids=set();phones=0;issues_count=collections.Counter();pref_counts=collections.Counter();proof=hashlib.sha256()
with open(path,encoding='utf-8-sig',newline='') as f,open(os.path.join(out,'provided-csv.ndjson'),'w',encoding='utf8',newline='\n') as target:
 reader=csv.DictReader(f)
 for row in reader:
  if not any(row.values()):continue
  rows+=1;raw={str(key):value or '' for key,value in row.items() if key is not None}
  if None in row:raw['__extra_columns']=json.dumps(row[None],ensure_ascii=False)
  errors=[];name=raw.get('name','').strip();address=raw.get('address','').strip();pref=pref_map.get(raw.get('prefecture','').strip().lower(),raw.get('prefecture','').strip())
  if not pref:
   found=re.match(r'^(東京都|神奈川県|埼玉県|千葉県)',address);pref=found[1] if found else '未確認'
  rest=address[len(pref):] if address.startswith(pref) else address
  municipality=next((match[1] for pattern in (r'^(.+?市)',r'^(.+?区)',r'^(.+?郡.+?[町村])',r'^(.+?[町村])') if (match:=re.match(pattern,rest))), '未確認')
  phone_raw=unicodedata.normalize('NFKC',raw.get('phone','')).strip();digits=re.sub(r'\D','',phone_raw)
  if phone_raw.startswith('+81'):digits='0'+digits[2:]
  telephone=digits if re.fullmatch(r'0\d{9,10}',digits) else None
  if phone_raw and not telephone:errors.append('電話番号の形式を確認')
  reference=raw.get('url','').strip() or raw.get('final_url','').strip()
  number=re.search(r'/(\d{8})/?(?:\?|$)',reference)
  identity='tabelog-'+(number[1] if number else hashlib.sha256((reference or pref+'\t'+name+'\t'+address).encode()).hexdigest()[:32])
  if not name or len(name)>200:errors.append('店舗名が未取得または項目上限超過')
  if not address or len(address)>500:errors.append('住所が未取得または項目上限超過')
  hours=raw.get('business_hours','').strip()
  if len(hours)>2000:errors.append('営業時間の全文は原本行に保存')
  record=None
  if name and len(name)<=200 and address and len(address)<=500 and len(pref)<=20 and len(municipality)<=60:
   sns=next((candidate for key in ('instagram','x','facebook','tiktok','youtube','line') if (candidate:=url(raw.get(key,'')))),None)
   info='\n'.join(raw.get(key,'').strip() for key in ('payment_methods','phone_related_info','phone_inquiry') if raw.get(key,'').strip())
   record={'id':identity,'name':name,'address':address,'prefecture':pref,'municipality':municipality,'category':'飲食店','phone':telephone,'hours':hours[:2000] or None,'website':url(raw.get('homepage','')),'sns':sns,'sales_info':info[:2000] or None,'business_status':'未確認','verification':'未確認','provenance':{'url':reference,'row_number':rows,'original_file_sha256':file_hash,'source_id':source['id']}}
   valid+=1;ids.add(identity);phones+=bool(telephone);pref_counts[pref]+=1
  for error in errors:issues_count[error]+=1
  raw_hash=hashlib.sha256(canonical(raw).encode()).hexdigest();proof.update(f'{rows}:{raw_hash}\n'.encode())
  target.write(json.dumps({'rowNumber':rows,'raw':raw,'record':record,'issues':errors},ensure_ascii=False,separators=(',',':'))+'\n')
  if rows%10000==0:print('Prepared '+str(rows)+' rows',flush=True)
manifest={'source':source,'original_sha256':file_hash,'raw_sha256':proof.hexdigest(),'source_rows':rows,'usable_rows':valid,'unique_stores':len(ids),'rows_with_phone':phones,'prefectures':pref_counts,'issues':issues_count}
with open(os.path.join(out,'provided-csv-manifest.json'),'w',encoding='utf8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
print(json.dumps(manifest,ensure_ascii=False),flush=True)
