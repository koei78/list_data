import 'server-only';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {sourceSchema,recordSchema} from './import';
import {db,all,now} from './db';
import {normalize,phone,safeUrl} from './normalize';
const rawSchema=z.record(z.string().max(1000000));
const batchSchema=z.array(z.object({rowNumber:z.number().int().positive(),raw:rawSchema,record:recordSchema.nullable(),issues:z.array(z.string()).default([])})).min(1).max(250);
const canonical=(raw:Record<string,string>)=>JSON.stringify(Object.fromEntries(Object.keys(raw).sort().map(key=>[key,raw[key]])));
const sha=(raw:Record<string,string>)=>createHash('sha256').update(canonical(raw)).digest('hex');
function bulk(table:string,columns:string[],rows:any[][],primary:string[]){const values=rows.flat(),updates=columns.filter(key=>!primary.includes(key)&&key!=='created_at');return db().prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${rows.map(row=>'('+row.map(()=>'?').join(',')+')').join(',')} ON CONFLICT (${primary.join(',')}) DO UPDATE SET ${updates.map(key=>`${key}=EXCLUDED.${key}`).join(',')}`).bind(...values);}
export async function importCsvBatch(input:any){
 const source=sourceSchema.parse(input.source),rows=batchSchema.parse(input.rows),stamp=now();
 if(!safeUrl(source.url)||!safeUrl(source.license_url))throw new Error('Invalid source URL');
 if(new Set(rows.map(row=>row.rowNumber)).size!==rows.length)throw new Error('Duplicate source row number');
 const records=new Map<string,z.infer<typeof recordSchema>>();
 for(const row of rows){const record=row.record;if(!record)continue;if(!record.id)throw new Error('Stable record ID required');if(record.phone&&!/^0\d{9,10}$/.test(phone(record.phone)))throw new Error('Invalid phone');for(const key of ['website','sns'] as const)if(record[key]&&!safeUrl(record[key]!))throw new Error('Invalid URL');records.set(record.id,record);}
 const statements=[db().prepare('INSERT INTO data_sources(id,name,url,license,license_url,record_date,scope,acquired_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(source.id,source.name,source.url,source.license,source.license_url,source.record_date||null,source.scope,stamp)];
 const fields=['id','name','normalized_name','address','normalized_address','prefecture','municipality','category','phone','phone_normalized','hours','business_status','source_id','verification','created_at','updated_at'];
 const recordRows=[...records.values()];
 if(recordRows.length){
  statements.push(bulk('restaurants',fields,recordRows.map(r=>[r.id,r.name,normalize(r.name),r.address,normalize(r.address),r.prefecture,r.municipality,r.category,r.phone||null,r.phone?phone(r.phone):null,r.hours||null,r.business_status,source.id,r.verification,stamp,stamp]),['id']));
  statements.push(bulk('restaurant_private_details',['restaurant_id','website','sns','sales_info','authority_status'],recordRows.map(r=>[r.id,r.website||null,r.sns||null,r.sales_info||null,'未確認']),['restaurant_id']));
  statements.push(bulk('field_evidence',['restaurant_id','field','source_id','status','note'],recordRows.map(r=>[r.id,'__provenance__',source.id,'未確認',JSON.stringify(r.provenance||{})]),['restaurant_id','field']));
 }
 statements.push(bulk('source_import_rows',['source_id','row_number','restaurant_id','raw_json','payload_sha256','validation_errors'],rows.map(row=>[source.id,row.rowNumber,row.record?.id||null,JSON.stringify(row.raw),sha(row.raw),JSON.stringify(row.issues)]),['source_id','row_number']));
 await db().batch(statements);
 const verified=await all<{row_number:number,raw_json:Record<string,string>}>('SELECT row_number,raw_json FROM source_import_rows WHERE source_id=? AND row_number IN ('+rows.map(()=>'?').join(',')+') ORDER BY row_number',[source.id,...rows.map(row=>row.rowNumber)]);
 const hash=createHash('sha256').update(verified.map(row=>`${row.row_number}:${sha(row.raw_json)}\n`).join('')).digest('hex');
 return {staged:verified.length,stores:records.size,sha256:hash};
}
export async function verifyCsvImport(sourceId:string){
 sourceSchema.shape.id.parse(sourceId);
 let after=0,count=0,unusable=0;const hash=createHash('sha256');
 while(true){const rows=await all<{row_number:number,raw_json:Record<string,string>,restaurant_id:string|null}>('SELECT row_number,raw_json,restaurant_id FROM source_import_rows WHERE source_id=? AND row_number>? ORDER BY row_number LIMIT 5000',[sourceId,after]);if(!rows.length)break;for(const row of rows){hash.update(`${row.row_number}:${sha(row.raw_json)}\n`);count++;if(!row.restaurant_id)unusable++;}after=rows[rows.length-1].row_number;}
 const totals=await all('SELECT count(*) stores,count(phone) phones FROM restaurants WHERE source_id=?',[sourceId]);
 return {sourceRows:count,unusableRows:unusable,sha256:hash.digest('hex'),...totals[0]};
}
