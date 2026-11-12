import {z} from 'zod';
import {sameOrigin,HttpError} from '../../../lib/auth';
import {limitSurvey,saveSurvey,sendSurveyNotification} from '../../../lib/survey';
import {surveySchema} from '../../../lib/survey-fields';
import {SAMPLE_MARKER,sampleRows,sampleCsv} from '../../../lib/sample-list';
export const dynamic='force-dynamic';
const params=z.object({municipality:z.string().trim().min(1).max(60),category:z.string().trim().max(80).default(''),note:z.string().trim().max(1000).default(''),attribution:z.object({source:z.string().regex(/^[a-zA-Z0-9_-]{0,80}$/),medium:z.string().regex(/^[a-zA-Z0-9_-]{0,80}$/),campaign:z.string().regex(/^[a-zA-Z0-9_-]{0,80}$/)}).optional()});
export async function POST(req:Request){try{
 sameOrigin(req);
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'送信形式を確認してください。');
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'必要事項を入力してください。');
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw new HttpError(413,'入力内容が長すぎます。');}chunks.push(value);}
 let b:any;try{b=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'入力内容を確認してください。');}
 const filter=params.parse(b),a=filter.attribution;
 const message=[SAMPLE_MARKER,'地域：'+filter.municipality,'業態：'+(filter.category||'指定なし'),'追加のご相談：'+(filter.note||'なし'),'流入元：'+(a?.source||'direct')+' / '+(a?.medium||'none')+' / '+(a?.campaign||'none')].join('\n');
 const v=surveySchema.parse({...b,kind:'inquiry',message,restaurantId:undefined});
 await limitSurvey(req);
 const rows=await sampleRows(filter.municipality,filter.category);
 if(!rows.length)throw new HttpError(400,'この条件のサンプルはありません。地域・区分を変更してください。');
 const {lead}=await saveSurvey(v);
 await sendSurveyNotification(lead.id).catch(()=>{});
 return Response.json({ok:true,reference:lead.id,count:rows.length,csv:sampleCsv(rows)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){const status=e instanceof HttpError?e.status:e instanceof z.ZodError?400:500;return Response.json({error:e instanceof HttpError?e.message:e instanceof z.ZodError?'必須項目・連絡先・同意をご確認ください。':'受付を完了できませんでした。時間をおいて再度お試しください。'},{status,headers:{'Cache-Control':'private, no-store'}});}}
