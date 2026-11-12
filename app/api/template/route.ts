export const dynamic='force-dynamic';
import {requireUser} from '../../../lib/auth';
export async function GET(){try{await requireUser(true);return new Response('\ufeffid,name,address,prefecture,municipality,category,phone,kana,postal_code,hours,open_time,close_time,holiday,station,store_type,opened_at,store_count,business_status,operator_name,corporate_number,representative_name,decision_maker_name,decision_maker_role,authority_status,website,sns,sales_info,checked_at,verification\r\n',{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="restaurants-template.csv"','Cache-Control':'no-store'}});}catch{return new Response('Unauthorized',{status:403});}}

