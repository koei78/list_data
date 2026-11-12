import 'server-only';
import {createHash,randomBytes,timingSafeEqual,pbkdf2} from 'node:crypto';
import {promisify} from 'node:util';
import {cookies} from 'next/headers';
import {one,run,db,now} from './db';
import {ORIGIN} from './config';
const derive=promisify(pbkdf2);
export const OWNER_COOKIE=ORIGIN.startsWith('https:')?'__Host-tenkai_owner':'tenkai_owner_local';
export const OWNER_SECONDS=12*60*60;
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function verifyOwnerPassword(password:string,stored:string){const parts=stored.split('$');if(parts.length!==4||parts[0]!=='pbkdf2_sha256'||parts[1]!=='600000'||!/^([a-f0-9]{32})$/.test(parts[2])||!/^([a-f0-9]{64})$/.test(parts[3])||password.length>128)return false;const derived=await derive(password,Buffer.from(parts[2],'hex'),600000,32,'sha256');return timingSafeEqual(derived,Buffer.from(parts[3],'hex'));}
export function ownerConfigured(){return !!process.env.ADMIN_BOOTSTRAP_EMAIL&&!!process.env.ADMIN_PASSWORD_HASH;}
export async function ownerIdentity(){
 return ownerIdentityFromToken((await cookies()).get(OWNER_COOKIE)?.value||'');
}
export async function ownerIdentityFromToken(token:string){
 if(!ownerConfigured()||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 const email=process.env.ADMIN_BOOTSTRAP_EMAIL!.trim().toLowerCase();
 const user=await one('SELECT u.id,u.email,u.name,u.disabled FROM admin_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.credential_version=? AND s.expires_at>?',[digest(token),digest(process.env.ADMIN_PASSWORD_HASH!),now()]);
 return user&&!user.disabled&&user.email.toLowerCase()===email?{id:user.id,email:user.email,name:user.name,confirmedAt:null}:null;
}
export async function loginOwner(req:Request,input:any){
 if(!ownerConfigured())throw Object.assign(new Error('管理者パスワードの初期設定を完了してください。'),{status:503});
 const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'',password=typeof input?.password==='string'?input.password:'';
 if(email.length>254||password.length>128)throw Object.assign(new Error('入力内容を確認してください。'),{status:400});
 const ip=process.env.VERCEL==='1'?(req.headers.get('x-vercel-forwarded-for')||'unknown'):'local';const bucket=Math.floor(Date.now()/900000);
 const allowed=await one('INSERT INTO survey_rate_limits(key,used,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET used=survey_rate_limits.used+1 WHERE survey_rate_limits.used<10 RETURNING used',['owner:'+digest(ip+'|'+bucket),new Date((bucket+2)*900000).toISOString()]);
 if(!allowed)throw Object.assign(new Error('ログイン試行の上限です。時間をおいてお試しください。'),{status:429});
 const valid=await verifyOwnerPassword(password,process.env.ADMIN_PASSWORD_HASH!);
 if(!valid||email!==process.env.ADMIN_BOOTSTRAP_EMAIL!.trim().toLowerCase())throw Object.assign(new Error('メールアドレスまたはパスワードを確認してください。'),{status:401});
 const id='owner-'+digest(email).slice(0,32),stamp=now(),token=randomBytes(32).toString('base64url');
 await db().batch([
  db().prepare("INSERT INTO users(id,email,name,role,created_at) VALUES(?,?,?,'admin',?) ON CONFLICT(id) DO UPDATE SET role='admin'").bind(id,email,email,stamp),
  db().prepare('INSERT INTO admin_sessions(token_hash,user_id,credential_version,expires_at,created_at) VALUES(?,?,?,?,?)').bind(digest(token),id,digest(process.env.ADMIN_PASSWORD_HASH!),new Date(Date.now()+OWNER_SECONDS*1000).toISOString(),stamp),
  db().prepare('DELETE FROM admin_sessions WHERE expires_at<?').bind(stamp)
 ]);
 return token;
}
export async function revokeOwnerSession(token:string){if(token)await run('DELETE FROM admin_sessions WHERE token_hash=?',[digest(token)]);}
export async function logoutOwner(){await revokeOwnerSession((await cookies()).get(OWNER_COOKIE)?.value||'');}
