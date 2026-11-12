import {cache} from 'react';
import {env} from './runtime';
import {getUser} from '@netlify/identity';
import {ORIGIN} from './config';
import {one,run,now,db} from './db';
export const viewer=cache(async()=>{const identity=await getUser();if(!identity?.email)return null;await run('INSERT OR IGNORE INTO users(id,email,name,created_at) VALUES(?,?,?,?)',[identity.id,identity.email,identity.name||identity.email,now()]);
 // Only a confirmed Identity account matching the configured owner can bootstrap an administrator.
 if(identity.confirmedAt&&env.ADMIN_BOOTSTRAP_EMAIL&&identity.email.toLowerCase()===env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase())await run("UPDATE users SET role='admin' WHERE id=? AND NOT EXISTS (SELECT 1 FROM users WHERE role='admin')",[identity.id]);
 const user=await one('SELECT * FROM users WHERE id=?',[identity.id]);return user?.disabled?null:user;});
export async function canReadPrivate(user:any,id:string){if(!user||user.role==='survey')return false;if(user.role==='admin')return true;return !!(await one('SELECT 1 FROM disclosure_grants WHERE user_id=? AND restaurant_id=?',[user.id,id]));}
export async function requireUser(admin=false){const user=await viewer();if(!user)throw new HttpError(401,'ログインしてください。');if(admin&&user.role!=='admin')throw new HttpError(403,'管理者のみ操作できます。');return user;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');const site=new URL(ORIGIN).origin;if(origin!==site)throw new HttpError(403,'別サイトからの送信は受け付けられません。');if(request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'送信元が一致しません。');}
