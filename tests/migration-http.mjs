import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='https://tenkai-restaurant-db.netlify.app',old='https://tokyo-restaurant-sales-db.mori-kanata.chatgpt.site';
const checks=[];
function pass(name){checks.push(name);console.log('PASS '+name);}
const root=await fetch(base),html=await root.text();assert.equal(root.status,200);assert.equal(new URL(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]).href,base+'/');assert(!/noindex/.test(root.headers.get('x-robots-tag')||''));assert(/no-store/.test(root.headers.get('cache-control')));pass('production homepage canonical and cache policy');
async function post(origin,headers={}){return fetch(base+'/api/action',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify({action:'create-list',name:'security-check'})});}
assert.equal((await post(base,{'oai-authenticated-user-id':'forged-admin','oai-authenticated-user-email':'oshima7.8.0k@gmail.com'})).status,401);pass('legacy authentication headers grant no access');
assert.equal((await post(base,{Cookie:'nf_jwt=invalid-not-a-signed-token'})).status,401);pass('invalid Identity cookie grants no access');
assert.equal((await post('https://other.invalid')).status,403);pass('cross-origin mutations remain blocked');
for(const pathname of ['/login','/admin','/mypage','/lists','/contact']){const r=await fetch(base+pathname);assert(/noindex/.test(r.headers.get('x-robots-tag')||''));}pass('private and account pages are not indexed');
for(const pathname of ['/api/export?list=unknown','/api/backup','/api/template']){const r=await fetch(base+pathname);assert([401,403].includes(r.status));}pass('private export backup and template endpoints reject anonymous access');
const settings=await(await fetch(base+'/.netlify/identity/settings')).json();assert.equal(settings.autoconfirm,false);assert.equal(settings.disable_signup,false);pass('Identity requires email confirmation for registration');
const paths=['/','/restaurant/tky-c8bd2b6c5ddec8e8876b','/restaurants?phone=0422261449','/sitemap.xml'];
for(const pathname of paths){const r=await fetch(old+pathname,{redirect:'manual'});assert.equal(r.status,301);assert.equal(r.headers.get('location'),base+pathname);}pass('old public URLs permanently redirect preserving path and query');
const head=await fetch(old+'/areas',{method:'HEAD',redirect:'manual'});assert.equal(head.status,301);assert.equal(head.headers.get('location'),base+'/areas');pass('HEAD requests redirect consistently');
await fs.writeFile('work/netlify-migration-http-results.json',JSON.stringify({base,old,passed:checks.length,checks,date:new Date().toISOString()},null,2));

