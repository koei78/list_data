import 'server-only';
import {randomBytes,createHash} from 'node:crypto';
import {cache} from 'react';
import {cookies} from 'next/headers';
import {ORIGIN} from './config';
import {viewer,HttpError} from './auth';
import {one,run,db,uid,now} from './db';
import {surveySchema,SURVEY_CONSENT_VERSION} from './survey-fields';

export const SESSION_SECONDS=30*24*60*60;
export const SURVEY_COOKIE=ORIGIN.startsWith('https:')?'__Host-tenkai_survey':'tenkai_survey_local';
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function requestSurveyToken(req:Request){return req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(SURVEY_COOKIE+'='))?.slice(SURVEY_COOKIE.length+1)||'';}
export async function surveyActor(token:string){
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 const lead=await one(`SELECT l.id,l.name,l.company,l.email,l.phone FROM survey_sessions s JOIN survey_leads l ON l.id=s.lead_id WHERE s.token_hash=? AND s.expires_at>? AND s.revoked_at IS NULL AND l.disabled=0 AND l.kind='list'`,[digest(token),now()]);
 return lead?{...lead,id:'survey:'+lead.id,leadId:lead.id,role:'survey'}:null;
}
export const workspaceViewer=cache(async()=>await viewer()||await surveyActor((await cookies()).get(SURVEY_COOKIE)?.value||''));
export async function requireWorkspaceUser(req:Request){const user=await viewer()||await surveyActor(requestSurveyToken(req));if(!user)throw new HttpError(401,'簡単なアンケートに回答すると利用できます。');return user;}
export async function limitSurvey(req:Request){
 const ip=process.env.VERCEL==='1'?(req.headers.get('x-vercel-forwarded-for')||'unknown'):process.env.NETLIFY==='true'?(req.headers.get('x-nf-client-connection-ip')||'unknown'):'local';
 const bucket=Math.floor(Date.now()/3600000),key=digest(ORIGIN+'|'+ip+'|'+bucket);
 const accepted=await one('INSERT INTO survey_rate_limits(key,used,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET used=survey_rate_limits.used+1 WHERE survey_rate_limits.used<10 RETURNING used',[key,new Date((bucket+2)*3600000).toISOString()]);
 if(!accepted)throw new HttpError(429,'送信回数の上限です。時間をおいてお試しください。');
 await run('DELETE FROM survey_rate_limits WHERE expires_at<?',[now()]);
}
export async function saveSurvey(input:unknown){
 const v=surveySchema.parse(input),requestHash=digest(v.requestKey);
 if(v.restaurantId&&!await one('SELECT id FROM restaurants WHERE id=? AND deleted=0',[v.restaurantId]))throw new HttpError(400,'対象店舗を確認してください。');
 const {requestKey,website,...payload}=v,payloadHash=digest(JSON.stringify(payload));
 const id=uid(),created=now();
 await run('INSERT INTO survey_leads(id,request_key_hash,payload_hash,kind,company,name,email,phone,purpose,message,preferred_contact,marketing_consent,restaurant_id,consent_version,consent_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key_hash) DO NOTHING',[id,requestHash,payloadHash,v.kind,v.company,v.name,v.email,v.phone,v.purpose,v.message,v.preferredContact,Number(v.marketingConsent),v.restaurantId||null,SURVEY_CONSENT_VERSION,created,created]);
 const lead=await one('SELECT * FROM survey_leads WHERE request_key_hash=?',[requestHash]);
 if(lead.payload_hash!==payloadHash||lead.disabled)throw new HttpError(409,'送信済みの内容と異なります。ページを開き直してください。');
 let token:string|null=null;
 if(v.kind==='list'){
  token=randomBytes(32).toString('base64url');
  await db().batch([db().prepare('DELETE FROM survey_sessions WHERE lead_id=? AND expires_at<?').bind(lead.id,created),db().prepare('INSERT INTO survey_sessions(token_hash,lead_id,expires_at,created_at) VALUES(?,?,?,?)').bind(digest(token),lead.id,new Date(Date.now()+SESSION_SECONDS*1000).toISOString(),created)]);
 }
 return {lead,token};
}
export async function sendSurveyNotification(id:string){
 // Netlify Forms is the notification channel; DB remains the authoritative inbox.
 if(process.env.SURVEY_NOTIFICATIONS_ENABLED!=='1')return 'pending';
 const attempt=now();
 const lead=await one("UPDATE survey_leads SET notification_status='sending',notification_attempted_at=? WHERE id=? AND notification_status<>'accepted' AND (notification_status<>'sending' OR notification_attempted_at<?) RETURNING *",[attempt,id,new Date(Date.now()-60000).toISOString()]);
 if(!lead)return (await one('SELECT notification_status FROM survey_leads WHERE id=?',[id]))?.notification_status||'pending';
 const fields={ 'form-name':'usage-survey',name:lead.name,email:lead.email,company:lead.company,phone:lead.phone,purpose:lead.purpose,message:lead.message,preferred_contact:lead.preferred_contact,marketing_consent:lead.marketing_consent?'希望する':'希望しない',request_type:lead.kind,restaurant_id:lead.restaurant_id||'',lead_id:lead.id,consent_version:lead.consent_version,consent_at:lead.consent_at,admin_url:ORIGIN+'/admin?tab=leads' };
 let state='failed';try{const r=await fetch(new URL('/__forms.html',ORIGIN),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields),signal:AbortSignal.timeout(8000)});if(r.ok)state='accepted';}catch{}
 await run('UPDATE survey_leads SET notification_status=? WHERE id=? AND notification_attempted_at=?',[state,id,attempt]);return state;
}
