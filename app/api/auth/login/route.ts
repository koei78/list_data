import {NextResponse} from 'next/server';
import {sameOrigin} from '../../../../lib/auth';
import {loginOwner,OWNER_COOKIE,OWNER_SECONDS} from '../../../../lib/owner-auth';
import {ORIGIN} from '../../../../lib/config';
export async function POST(req:Request){try{sameOrigin(req);const text=await req.text();if(text.length>2000)return NextResponse.json({error:'入力内容が長すぎます。'},{status:413});const token=await loginOwner(req,JSON.parse(text));const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});response.cookies.set(OWNER_COOKIE,token,{httpOnly:true,secure:ORIGIN.startsWith('https:'),sameSite:'lax',path:'/',maxAge:OWNER_SECONDS});return response;}catch(error:any){return NextResponse.json({error:error.status?error.message:'ログインできませんでした。'},{status:error.status||400,headers:{'Cache-Control':'no-store'}});}}
