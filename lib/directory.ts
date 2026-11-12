import {all,one} from './display-db';

export const DIRECTORY_PAGE_SIZE=100;
export const DIRECTORY_VISIBLE="deleted=0 AND redirect_to IS NULL AND indexable=1 AND business_status<>'閉店'";
export const areaPath=(name:string)=>'/areas/'+encodeURIComponent(name);
export const areaPagePath=(name:string,page:number)=>areaPath(name)+(page>1?'?page='+page:'');
export const directoryPages=(name:string,total:number)=>Array.from({length:Math.ceil(total/DIRECTORY_PAGE_SIZE)},(_,i)=>({page:i+1,path:areaPagePath(name,i+1),start:i*DIRECTORY_PAGE_SIZE+1,end:Math.min((i+1)*DIRECTORY_PAGE_SIZE,total)}));
export function directoryAreas(){return all<{name:string,n:number}>(`SELECT municipality name,count(*) n FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality<>'' GROUP BY municipality ORDER BY municipality`);}
export async function directoryArea(name:string,page:number){
  const info=await one<{n:number,phones:number,updated:string}>(`SELECT count(*) n,sum(CASE WHEN phone IS NOT NULL AND phone<>'' THEN 1 ELSE 0 END) phones,max(updated_at) updated FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality=?`,[name]);
  if(!info?.n||page>Math.ceil(info.n/DIRECTORY_PAGE_SIZE))return null;
  const rows=await all<{id:string,name:string,address:string,phone:string|null,category:string}>(`SELECT id,name,address,phone,category FROM restaurants WHERE ${DIRECTORY_VISIBLE} AND municipality=? ORDER BY normalized_name,id LIMIT ? OFFSET ?`,[name,DIRECTORY_PAGE_SIZE,(page-1)*DIRECTORY_PAGE_SIZE]);
  return {...info,rows};
}
export const jsonLd=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
