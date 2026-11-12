import {requireWorkspaceUser} from '../../../lib/survey';
import {HttpError} from '../../../lib/auth';
import {one,all,audit} from '../../../lib/display-db';
import {PRIVATE_FIELDS} from '../../../lib/config';
import {csvCell} from '../../../lib/normalize';
import {workbook} from '../../../lib/xlsx';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const user=await requireWorkspaceUser(req),q=new URL(req.url).searchParams,list=q.get('list')||'',part=Math.max(0,parseInt(q.get('part')||'0')||0);if(!await one('SELECT id FROM sales_lists WHERE id=? AND user_id=?',[list,user.id]))throw new HttpError(403,'操作できません');
 const rows=await all(`SELECT r.id,r.name,r.phone,r.address,r.hours,r.category,r.source_id,r.checked_at,i.status,i.memo,${PRIVATE_FIELDS.map(k=>`CASE WHEN ?<>'survey' AND (?='admin' OR g.user_id IS NOT NULL) THEN p.${k} ELSE NULL END AS ${k}`).join(',')} FROM sales_list_items i JOIN restaurants r ON r.id=i.restaurant_id LEFT JOIN restaurant_private_details p ON p.restaurant_id=r.id LEFT JOIN disclosure_grants g ON g.restaurant_id=r.id AND g.user_id=? WHERE i.list_id=? AND r.deleted=0 ORDER BY r.id LIMIT 5000 OFFSET ?`,[...PRIVATE_FIELDS.flatMap(()=>[user.role,user.role]),user.id,list,part*5000]);
 const headings=['店舗ID','店舗名','電話番号','住所','営業時間','業態','出典ID','確認日','営業ステータス','営業メモ','運営会社','法人番号','代表者','決裁者','役職','決裁権','公式サイト','SNS','営業情報'];const body=rows.map(r=>['id','name','phone','address','hours','category','source_id','checked_at','status','memo',...PRIVATE_FIELDS].map(k=>r[k]??''));await audit(user.id,'export',list);
 const xlsx=q.get('format')==='xlsx';return new Response(xlsx?workbook([headings,...body]):'\ufeff'+[headings,...body].map(r=>r.map(csvCell).join(',')).join('\r\n'),{headers:{'Content-Type':xlsx?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="restaurants-${part+1}.${xlsx?'xlsx':'csv'}"`,'Cache-Control':'private, no-store'}});
 }catch(e:any){return Response.json({error:e instanceof HttpError?e.message:'ダウンロードに失敗しました'},{status:e.status||500});}}
