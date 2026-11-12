import {sameOrigin,HttpError,viewer} from '../../../lib/auth';
import {recordGrowth} from '../../../lib/growth';
import {z} from 'zod';
export async function POST(req:Request){try{
 sameOrigin(req);
 if(req.headers.get('dnt')==='1'||req.headers.get('sec-gpc')==='1')return new Response(null,{status:204});
 if(!req.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'JSON形式が必要です。');
 const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'入力が必要です。');let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1200){await reader.cancel();throw new HttpError(413,'入力が長すぎます。');}chunks.push(value);}
 if((await viewer())?.role==='admin')return new Response(null,{status:204});
 let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'JSONを確認してください。');}
 await recordGrowth(req,value);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:'計測を保存できませんでした。'},{status:e instanceof HttpError?e.status:e instanceof z.ZodError?400:500,headers:{'Cache-Control':'no-store'}});}}
