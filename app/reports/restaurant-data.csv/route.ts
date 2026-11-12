import {publicAreaStats,phoneRate} from '../../../lib/public-data';
import {csvCell} from '../../../lib/normalize';
export const dynamic='force-dynamic';
export async function GET(){const rows=await publicAreaStats();const csv='\ufeff'+[['市町村','公開対象施設数','電話番号掲載施設数','電話番号掲載率(%)','一般飲食店施設数','掲載データ最終更新'],...rows.map(r=>[r.name,r.n,r.phones,phoneRate(r.phones,r.n),r.general,r.updated?.slice(0,10)||''])].map(r=>r.map(v=>csvCell(String(v??''))).join(',')).join('\r\n');return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tama-restaurant-coverage.csv"','X-Robots-Tag':'noindex','Cache-Control':'public, max-age=300'}});}
