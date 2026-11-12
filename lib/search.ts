import {all,one} from './display-db';
import {PUBLIC_COLUMNS} from './config';
import {normalize,phone} from './normalize';
import {correctedNameMatches} from './display-text';
export type Query=Record<string,string|undefined>;
export function searchWhere(q:Query,user:any){const where=['r.deleted=0','r.redirect_to IS NULL'];const args:any[]=[];const eq=(field:string,key:string)=>{if(q[key]){where.push(`r.${field}=?`);args.push(q[key]);}};
 if(q.name){const name=normalize(q.name),matches=correctedNameMatches(q.name);where.push('(r.normalized_name>=? AND r.normalized_name<?'+matches.map(()=> ' OR (r.id=? AND r.name=?)').join('')+')');args.push(name,name+'\uffff',...matches.flatMap(item=>[item.id,item.original]));}
 if(q.phone){where.push('r.phone_normalized=?');args.push(phone(q.phone));}
 for(const k of ['prefecture','municipality','category','station','holiday','store_type'])eq(k,k);
 for(const [k,op] of [['open_time','>='],['close_time','<='],['opened_at','>='],['store_count','>=']] as const)if(q[k]){where.push(`r.${k}${op}?`);args.push(q[k]);}
 if(q.operator||q.decision){if(!user||user.role==='survey'){where.push('0=1');}else{let s='SELECT 1 FROM restaurant_private_details p WHERE p.restaurant_id=r.id';if(user.role!=='admin'){s+=' AND EXISTS(SELECT 1 FROM disclosure_grants g WHERE g.restaurant_id=r.id AND g.user_id=?)';args.push(user.id);}if(q.operator){s+=' AND p.operator_name LIKE ?';args.push('%'+q.operator+'%');}if(q.decision==='yes')s+=' AND p.decision_maker_name IS NOT NULL';if(q.decision==='no')s+=' AND p.decision_maker_name IS NULL';where.push(`EXISTS(${s})`);}}
 return {sql:where.join(' AND '),args};}
export async function search(q:Query,user:any){const w=searchWhere(q,user);const page=Math.min(100000,Math.max(1,parseInt(q.page||'1')||1));const sort=q.sort==='name'?'r.normalized_name,r.id':q.sort==='oldest'?'r.updated_at,r.id':'r.updated_at DESC,r.id';const [count,rows]=await Promise.all([one(`SELECT count(*) n FROM restaurants r WHERE ${w.sql}`,w.args),all(`SELECT ${PUBLIC_COLUMNS} FROM restaurants r WHERE ${w.sql} ORDER BY ${sort} LIMIT 30 OFFSET ?`,[...w.args,(page-1)*30])]);return {total:count?.n||0,rows,page};}
let facetCache:{until:number,data:any[][]}|undefined;
export async function facets(){if(facetCache&&facetCache.until>Date.now())return facetCache.data;const data=await Promise.all([all('SELECT municipality name,count(*) n FROM restaurants WHERE deleted=0 AND redirect_to IS NULL GROUP BY municipality ORDER BY n DESC'),all('SELECT category name,count(*) n FROM restaurants WHERE deleted=0 AND redirect_to IS NULL GROUP BY category ORDER BY n DESC')]);facetCache={until:Date.now()+60000,data};return data;}

