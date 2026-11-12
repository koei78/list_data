import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createInterface} from 'node:readline';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const control=createInterface({input:process.stdin,terminal:false});
console.log('Waiting for owner verification credentials on stdin');
const config=await new Promise(resolve=>control.once('line',line=>resolve(JSON.parse(line))));
control.close();process.stdin.pause();
const base='https://list-data-eight.vercel.app',cookies=new Map(),checks=[];
const retain=response=>{for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}};
const cookie=()=>[...cookies].map(([key,value])=>key+'='+value).join('; ');
async function get(path){return fetch(base+path,{headers:{cookie:cookie()},redirect:'manual',signal:AbortSignal.timeout(60000)});}
async function post(path,body){const response=await fetch(base+path,{method:'POST',headers:{cookie:cookie(),origin:base,'content-type':'application/json'},body:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(60000)});retain(response);return response;}
function pass(name){checks.push(name);console.log('PASS '+name);}
try{
 const login=await post('/api/auth/login',{email:config.email,password:config.password});config.password='';assert.equal(login.status,200);assert(login.headers.getSetCookie().some(value=>/HttpOnly/i.test(value)&&/Secure/i.test(value)&&/SameSite=lax/i.test(value)));pass('production owner login and secure cookie');
 const session=await get('/api/auth/session');assert.equal(session.status,200);assert((await session.json()).user.id.startsWith('owner-'));pass('owner identity is restored from the session');
 for(const tab of ['overview','restaurants','leads','inquiries','users','import','sources','seo','backup','traffic']){const page=await get('/admin?tab='+tab);assert.equal(page.status,200,tab);const html=await page.text();assert(!html.includes('__next_error__')&&!html.includes('Application error:')&&!html.includes('管理者ログイン'),tab);if(tab==='overview')assert(html.includes('操作監査ログ'),'administrator permissions');}
 pass('all ten administrator pages render');
 const backup=await get('/api/backup');assert.equal(backup.status,200);assert(Array.isArray((await backup.json()).ids));pass('authenticated private backup listing');
}finally{await post('/api/auth/logout',{});}
assert.equal((await (await get('/api/auth/session')).json()).user,null);assert.equal((await get('/api/backup')).status,403);pass('owner logout revokes access');
await fs.writeFile('work/vercel-owner-verification.json',JSON.stringify({base,at:new Date().toISOString(),passed:checks.length,checks},null,2));
console.log('Verified '+checks.length+' owner checks');
