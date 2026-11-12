import {NextResponse} from 'next/server';
import {sameOrigin} from '../../../../lib/auth';
import {logoutOwner,OWNER_COOKIE} from '../../../../lib/owner-auth';
import {ORIGIN} from '../../../../lib/config';
export async function POST(req:Request){try{sameOrigin(req);await logoutOwner();const response=NextResponse.json({ok:true});response.cookies.set(OWNER_COOKIE,'',{path:'/',httpOnly:true,secure:ORIGIN.startsWith('https:'),sameSite:'lax',maxAge:0});return response;}catch(error:any){return NextResponse.json({error:'ログアウトできませんでした。'},{status:error.status||400});}}
