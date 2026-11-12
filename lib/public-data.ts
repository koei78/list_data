import {cache} from 'react';
import {all} from './display-db';
import {DIRECTORY_VISIBLE} from './directory';

export const phoneRate=(phones:number,total:number)=>total?Math.round(Number(phones)/Number(total)*1000)/10:0;
export const publicAreaStats=cache(async()=>all<{name:string,n:number,phones:number,general:number,updated:string}>(`SELECT municipality name,count(*) n,sum(CASE WHEN phone IS NOT NULL AND phone<>'' THEN 1 ELSE 0 END) phones,sum(CASE WHEN category IN ('一般飲食店','飲食店') THEN 1 ELSE 0 END) general,max(updated_at) updated FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality<>'' GROUP BY municipality ORDER BY municipality`));
export const publicSources=cache(async()=>all<{id:string,name:string,url:string,record_date:string,acquired_at:string,license:string,license_url:string}>('SELECT id,name,url,record_date,acquired_at,license,license_url FROM data_sources ORDER BY id'));
export const areaDetail=cache(async(name:string)=>{
 const [sources,categories,preview]=await Promise.all([
  all<{name:string,url:string,record_date:string}>(`SELECT DISTINCT s.name,s.url,s.record_date FROM restaurants r JOIN data_sources s ON s.id=r.source_id WHERE r.deleted=0 AND r.redirect_to IS NULL AND r.indexable=1 AND r.business_status<>'閉店' AND r.municipality=? ORDER BY s.name`,[name]),
  all<{name:string,n:number,phones:number}>(`SELECT category name,count(*) n,sum(CASE WHEN phone IS NOT NULL AND phone<>'' THEN 1 ELSE 0 END) phones FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality=? GROUP BY category ORDER BY n DESC,category`,[name]),
  all<{id:string,name:string,address:string,phone:string,category:string}>(`SELECT id,name,address,phone,category FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality=? AND phone IS NOT NULL AND phone<>'' AND category IN ('一般飲食店','飲食店') AND address NOT LIKE '%申請%' ORDER BY id LIMIT 3`,[name])
 ]);return {sources,categories,preview};
});
export const samplePath=(area:string,category='')=>'/sample-list?'+new URLSearchParams({area,...(category?{category}:{})}).toString();
