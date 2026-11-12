import {NextResponse} from 'next/server';
import {sameOrigin,HttpError} from '../../../../lib/auth';
import {SURVEY_COOKIE,requestSurveyToken,digest} from '../../../../lib/survey';
import {run,now} from '../../../../lib/db';
import {ORIGIN} from '../../../../lib/config';
export async function POST(req:Request){try{sameOrigin(req);const token=requestSurveyToken(req);if(token)await run('UPDATE survey_sessions SET revoked_at=? WHERE token_hash=?',[now(),digest(token)]);const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});response.cookies.set(SURVEY_COOKIE,'',{httpOnly:true,secure:ORIGIN.startsWith('https:'),sameSite:'lax',path:'/',maxAge:0});return response;}catch(e){return NextResponse.json({error:'操作できませんでした。'},{status:e instanceof HttpError?e.status:500});}}
