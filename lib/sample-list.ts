import 'server-only';
import {all} from './display-db';
import {csvCell} from './normalize';
export const SAMPLE_MARKER='【飲食店リスト無料サンプル依頼】';
export const SAMPLE_VISIBLE="r.deleted=0 AND r.redirect_to IS NULL AND r.indexable=1 AND r.business_status<>'閉店' AND r.phone IS NOT NULL AND r.phone<>''";
export async function sampleAreas(){return all<{name:string,n:number}>(`SELECT r.municipality name,count(*) n FROM restaurants r WHERE ${SAMPLE_VISIBLE} GROUP BY r.municipality ORDER BY r.municipality`);}
export async function sampleRows(municipality:string,category=''){
 return all(`SELECT r.id,r.name,r.address,r.phone,r.category,r.municipality,r.checked_at,s.name source_name,s.url source_url,s.record_date FROM restaurants r LEFT JOIN data_sources s ON s.id=r.source_id WHERE ${SAMPLE_VISIBLE} AND r.municipality=?${category?' AND r.category=?':''} ORDER BY r.id LIMIT 30`,category?[municipality,category]:[municipality]);
}
export function sampleCsv(rows:any[]){const headers=['店舗名','住所','電話番号','業態','市町村','出典名','出典URL','原本基準日','照合日'];const keys=['name','address','phone','category','municipality','source_name','source_url','record_date','checked_at'];return '\ufeff'+[headers,...rows.map(r=>keys.map(k=>r[k]??''))].map(row=>row.map(csvCell).join(',')).join('\r\n');}
