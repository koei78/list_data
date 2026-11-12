import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const [base,out='work/survey-http-results.json']=process.argv.slice(2),checks=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
async function get(path,cookie=''){const r=await fetch(base+path,{headers:cookie?{cookie}:{},redirect:'manual'});return {r,text:await r.text()};}
async function post(path,body,cookie='',origin=base){return fetch(base+path,{method:'POST',headers:{origin,'Content-Type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body),redirect:'manual'});}
for(const path of ['/survey','/contact?type=feature','/contact?type=correction']){const {r,text}=await get(path);assert.equal(r.status,200);assert(/noindex/.test(r.headers.get('x-robots-tag')));assert(text.includes('会員登録不要'));assert(text.includes('name="consent"'));assert(text.includes('name="phone"'));assert(!text.includes('申請内容を管理するため'));}pass('public questionnaire and request forms work without login and stay noindex');
const form=(await get('/contact?type=feature')).text;assert(form.includes('提案・営業の案内'));assert(!/name="marketingConsent"[^>]*checked/.test(form));assert(!/name="phone"[^>]*required/.test(form));pass('phone is optional and marketing permission is explicit and unchecked');
const locked=await get('/lists');assert(locked.text.includes('簡単なアンケートで利用を開始'));assert.equal((await get('/api/export')).r.status,401);pass('private lists and exports still require access');
const home=await get('/');assert(home.text.includes('21,875'));assert(home.text.includes('機能・掲載情報をリクエスト'));assert(!/noindex/.test(home.r.headers.get('x-robots-tag')||''));pass('public SEO homepage and request entry points remain available');
const bad=await post('/api/survey',{},'','https://example.invalid');assert.equal(bad.status,403);assert.equal((await post('/api/survey',{consent:false})).status,400);pass('live submission rejects cross-origin and incomplete requests');
const payload={requestKey:randomUUID()+randomUUID(),kind:'list',company:'公開動作確認（実際の問い合わせではありません）',name:'機能テスト・連絡不要',email:'release-check@example.invalid',phone:'',purpose:'営業リストを作成・出力したい',message:'公開後の動作確認です。電話・メール・営業の連絡は不要です。',preferredContact:'不要',consent:true,marketingConsent:false,next:'/lists'};
const result=await post('/api/survey',payload);assert.equal(result.status,200);const data=await result.json(),setCookie=result.headers.get('set-cookie');assert(data.ok&&data.access&&data.reference);assert(setCookie.includes('HttpOnly')&&setCookie.includes('Secure')&&setCookie.includes('SameSite=lax'));const cookie=setCookie.split(';')[0];pass('live questionnaire is saved and issues a secure browser session');
let list;
try{
 const dashboard=await get('/lists',cookie);assert(dashboard.text.includes('リストを作成'));assert(!dashboard.text.includes('<h1>簡単なアンケート'));assert(/no-store/.test(dashboard.r.headers.get('cache-control')));pass('answered browser can open private list workspace without Identity');
 const create=await post('/api/action',{action:'create-list',name:'公開検証用の一時リスト'},cookie);assert.equal(create.status,200);list=(await create.json()).id;
 const search=await get('/restaurants');const id=search.text.match(/href="\/restaurant\/([a-zA-Z0-9-]+)"/)?.[1];assert(id);assert.equal((await post('/api/action',{action:'add-to-list',listId:list,ids:[id]},cookie)).status,200);
 const csv=await get('/api/export?list='+list,cookie);assert.equal(csv.r.status,200);assert(csv.text.includes(id));const xlsx=await fetch(base+'/api/export?list='+list+'&format=xlsx',{headers:{cookie}});assert.equal(xlsx.status,200);assert.equal(Buffer.from(await xlsx.arrayBuffer()).subarray(0,2).toString(),'PK');pass('live list creation, adding a store, CSV and Excel exports succeed');
 assert.equal((await get('/api/export?list='+list)).r.status,401);assert.equal((await post('/api/action',{action:'review-lead',id:data.reference,status:'closed'},cookie)).status,401);pass('anonymous export and survey access to administrator actions are denied');
}finally{
 if(list)assert.equal((await post('/api/action',{action:'delete-list',id:list},cookie)).status,200);
 assert.equal((await post('/api/survey/session',{},cookie)).status,200);
}
assert((await get('/lists',cookie)).text.includes('簡単なアンケートで利用を開始'));pass('test list removed and ended browser session loses access');
await fs.writeFile(out,JSON.stringify({base,passed:checks.length,checks,time:new Date().toISOString(),testLeadReference:data.reference,testLeadLabel:payload.company,notificationDelivery:'Verify Netlify Forms separately; no email destination configured'},null,2));
