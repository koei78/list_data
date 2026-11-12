import {NextResponse} from 'next/server';
import {z} from 'zod';
import {sameOrigin,HttpError} from '../../../lib/auth';
import {limitSurvey,saveSurvey,sendSurveyNotification,SURVEY_COOKIE,SESSION_SECONDS} from '../../../lib/survey';
import {ORIGIN} from '../../../lib/config';
import {surveyReturnTo} from '../../../lib/survey-fields';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 sameOrigin(req);
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'送信形式を確認してください。');
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'回答を入力してください。');
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16000){await reader.cancel();throw new HttpError(413,'入力内容が長すぎます。');}chunks.push(value);}
 let b:any;try{b=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'回答の形式を確認してください。');}
 await limitSurvey(req);const {lead,token}=await saveSurvey(b);
 // A notification failure must not lose a saved response or falsely report a failed submission.
 await sendSurveyNotification(lead.id).catch(()=>{});
 const response=NextResponse.json({ok:true,reference:lead.id,next:surveyReturnTo(b.next),access:!!token},{headers:{'Cache-Control':'private, no-store'}});
 if(token)response.cookies.set(SURVEY_COOKIE,token,{httpOnly:true,secure:ORIGIN.startsWith('https:'),sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});return response;
 }catch(e){const status=e instanceof HttpError?e.status:e instanceof z.ZodError?400:500;return NextResponse.json({error:e instanceof z.ZodError?'必須項目・連絡先・同意をご確認ください。':e instanceof HttpError?e.message:'受付を完了できませんでした。時間をおいて再度お試しください。'},{status,headers:{'Cache-Control':'private, no-store'}});}}
