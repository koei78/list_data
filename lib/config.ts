export const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL||process.env.URL||'http://127.0.0.1:3000').replace(/\/$/,'');
export const SITE_NAME = '東京飲食店データベース';
export const STATUSES = ['未接触','アプローチ済み','商談予定','商談済み','成約','失注'];
export const PUBLIC_COLUMNS = 'r.id,r.name,r.kana,r.postal_code,r.prefecture,r.municipality,r.address,r.latitude,r.longitude,r.phone,r.hours,r.open_time,r.close_time,r.holiday,r.category,r.station,r.store_type,r.opened_at,r.store_count,r.business_status,r.source_id,r.checked_at,r.verification,r.updated_at,r.redirect_to,r.indexable';
export const PRIVATE_FIELDS = ['operator_name','corporate_number','representative_name','decision_maker_name','decision_maker_role','authority_status','website','sns','sales_info'];
