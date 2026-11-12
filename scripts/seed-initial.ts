// Initial licensed dataset import. Never overwrites existing facility records.
import fs from 'node:fs/promises';
import {recordSchema,sourceSchema} from '../lib/import';
import {normalize,phone} from '../lib/normalize';
import {db,closeDatabase} from '../lib/database-driver';
const [input,sourceFile]=process.argv.slice(2);
const source=sourceSchema.parse(JSON.parse(await fs.readFile(sourceFile,'utf8')));
const rows=(await fs.readFile(input,'utf8')).trim().split('\n').map(line=>recordSchema.parse(JSON.parse(line)));
if(rows.some(r=>!r.id)||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Every initial record must have a unique ID');
const fields=['id','name','normalized_name','address','normalized_address','prefecture','municipality','category','phone','phone_normalized','kana','postal_code','hours','open_time','close_time','holiday','station','store_type','opened_at','store_count','latitude','longitude','business_status','source_id','checked_at','verification','updated_at','created_at'];
const privateFields=['operator_name','corporate_number','representative_name','decision_maker_name','decision_maker_role','authority_status','website','sns','sales_info'] as const;
const stamp=new Date().toISOString();
function insert(table:string,columns:string[],data:any[][]){return db().prepare(`INSERT INTO ${table}(${columns.join(',')}) VALUES ${data.map(row=>'('+row.map(()=>'?').join(',')+')').join(',')} ON CONFLICT DO NOTHING`).bind(...data.flat());}
try{
  const other=await db().prepare('SELECT count(*) n FROM restaurants WHERE source_id<>?').bind(source.id).first();
  if(other.n)throw new Error('Initial importer cannot run against a mixed-source database');
  await insert('data_sources',['id','name','url','license','license_url','record_date','scope','acquired_at'],[[source.id,source.name,source.url,source.license,source.license_url,source.record_date||null,source.scope,stamp]]).run();
  for(let offset=0;offset<rows.length;offset+=500){
    const chunk=rows.slice(offset,offset+500);
    const publicData=chunk.map(r=>[r.id,r.name,normalize(r.name),r.address,normalize(r.address),r.prefecture,r.municipality,r.category,r.phone||null,r.phone?phone(r.phone):null,r.kana||null,r.postal_code||null,r.hours||null,r.open_time||null,r.close_time||null,r.holiday||null,r.station||null,r.store_type||null,r.opened_at||null,r.store_count||null,r.latitude??null,r.longitude??null,r.business_status,source.id,r.checked_at||null,r.verification,stamp,stamp]);
    const privateData=chunk.map(r=>[r.id,...privateFields.map(k=>r[k]??null)]);
    const evidence=chunk.filter(r=>r.provenance).map(r=>[r.id,'__provenance__',source.id,r.checked_at||null,r.verification,JSON.stringify(r.provenance)]);
    const statements=[insert('restaurants',fields,publicData),insert('restaurant_private_details',['restaurant_id',...privateFields],privateData)];
    if(evidence.length)statements.push(insert('field_evidence',['restaurant_id','field','source_id','checked_at','status','note'],evidence));
    await db().batch(statements);
    console.log('Imported/verified '+Math.min(offset+500,rows.length)+' / '+rows.length);
  }
  const totals=await db().prepare('SELECT count(*) n,count(phone) phones FROM restaurants').first();
  const details=await db().prepare('SELECT count(*) n,count(operator_name) operators,count(representative_name) representatives FROM restaurant_private_details').first();
  if(totals.n!==rows.length||details.n!==rows.length)throw new Error('Facility totals differ from source');
  await db().prepare('INSERT INTO import_jobs(id,source_id,actor,accepted,rejected,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),source.id,'system:netlify-migration',rows.length,0,stamp).run();
  console.log(JSON.stringify({facilities:totals.n,phones:totals.phones,privateRecords:details.n,operators:details.operators,representatives:details.representatives,rejected:0}));
}finally{await closeDatabase();}
