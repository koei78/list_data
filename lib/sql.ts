export const TABLE_KEYS:Record<string,string[]>={survey_leads:['id'],survey_sessions:['token_hash'],audit_logs:['id'],data_sources:['id'],disclosure_grants:['user_id','restaurant_id'],error_logs:['id'],favorites:['user_id','restaurant_id'],field_evidence:['restaurant_id','field'],import_errors:['id'],import_jobs:['id'],inquiries:['id'],merge_history:['id'],restaurant_private_details:['restaurant_id'],restaurants:['id'],sales_list_items:['list_id','restaurant_id'],sales_lists:['id'],saved_searches:['id'],search_history:['id'],seo_checks:['restaurant_id'],settings:['key'],users:['id']};
export function postgresSql(input:string){
  let sql=input.trim().replace(/;$/,'');
  if(/^INSERT OR IGNORE /i.test(sql))sql=sql.replace(/^INSERT OR IGNORE /i,'INSERT ')+' ON CONFLICT DO NOTHING';
  if(/^INSERT OR REPLACE INTO disclosure_grants VALUES/i.test(sql))sql=sql.replace(/^INSERT OR REPLACE INTO disclosure_grants VALUES/i,'INSERT INTO disclosure_grants (user_id,restaurant_id,inquiry_id,granted_by,granted_at) VALUES')+' ON CONFLICT(user_id,restaurant_id) DO UPDATE SET inquiry_id=excluded.inquiry_id,granted_by=excluded.granted_by,granted_at=excluded.granted_at';
  if(/INSERT OR REPLACE|PRAGMA|\browid\b/i.test(sql))throw new Error('Unsupported legacy SQL');
  let quote='',index=0,result='';
  for(let i=0;i<sql.length;i++){const c=sql[i];if(quote){result+=c;if(c===quote){if(sql[i+1]===quote)result+=sql[++i];else quote='';}}else if(c==="'"||c==='"'){quote=c;result+=c;}else result+=c==='?'?'$'+(++index):c;}
  return result;
}
export function upsertStatement(table:string,keys:string[]){const primary=TABLE_KEYS[table];if(!primary||!keys.length||keys.some(k=>!/^\w+$/.test(k))||primary.some(k=>!keys.includes(k)))throw new Error('Invalid table or columns');const updates=keys.filter(k=>!primary.includes(k));return `INSERT INTO ${table}(${keys.map(k=>'"'+k+'"').join(',')}) VALUES(${keys.map(()=>'?').join(',')}) ON CONFLICT(${primary.join(',')}) `+(updates.length?'DO UPDATE SET '+updates.map(k=>`"${k}"=excluded."${k}"`).join(','):'DO NOTHING');}
