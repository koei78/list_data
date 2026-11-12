import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {randomUUID} from 'node:crypto';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const control=createInterface({input:process.stdin,terminal:false});console.log('Waiting for verification access on stdin');
const config=await new Promise(resolve=>control.once('line',line=>resolve(JSON.parse(line))));control.close();process.stdin.pause();
const base='https://list-data-eight.vercel.app',cookies=new Map(),checks=[];
const retain=response=>{for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}};
const cookie=()=>[...cookies].map(([key,value])=>key+'='+value).join('; ');
let url=config.shareUrl;
for(let i=0;i<6;i++){assert.equal(new URL(url).origin,base);const response=await fetch(url,{redirect:'manual',headers:{cookie:cookie()},signal:AbortSignal.timeout(60000)});retain(response);if(response.status>=300&&response.status<400){url=new URL(response.headers.get('location'),base).href;continue;}assert.equal(response.status,200);break;}
async function get(path){return fetch(base+path,{headers:{cookie:cookie()},redirect:'manual',signal:AbortSignal.timeout(60000)});}
async function post(path,body,origin=base){const response=await fetch(base+path,{method:'POST',headers:{cookie:cookie(),origin,'content-type':'application/json'},body:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(60000)});retain(response);return response;}
function pass(name){checks.push(name);console.log('PASS '+name);}
const manifest=JSON.parse(await fs.readFile('work/provided-csv-manifest.json','utf8'));
let sample;for await(const line of createInterface({input:createReadStream('work/provided-csv.ndjson'),crlfDelay:Infinity})){const row=JSON.parse(line);if(row.record?.phone){sample=row.record;break;}}
let list;
try{
 const health=await get('/api/health');assert.equal(health.status,200);assert.equal((await health.json()).database,'reachable');pass('production database connection');
 const setup=await get('/admin-setup');assert.equal(setup.status,200);assert((await setup.text()).includes('ADMIN_PASSWORD_HASH'));assert.equal((await (await get('/api/auth/session')).json()).user,null);pass('owner setup page and anonymous session');
 if(config.token){
  const verify=await fetch(base+'/api/ingest',{method:'POST',headers:{cookie:cookie(),'content-type':'application/json',authorization:'Bearer '+config.token},body:JSON.stringify({mode:'verify-backup'}),signal:AbortSignal.timeout(60000)});
  const result=await verify.json();assert.equal(verify.status,200,JSON.stringify(result));assert.equal(result.privateStorage,true);assert.equal(result.write,true);assert.equal(result.read,true);assert.equal(result.list,true);pass('private backup storage write, read, list and cleanup');
 }
 const home=await get('/');assert.equal(home.status,200);const html=await home.text();assert(html.includes(manifest.unique_stores.toLocaleString('en-US')));assert(!html.includes('__next_error__'));pass('homepage renders the imported facility total');
 const search=await get('/restaurants?name='+encodeURIComponent(sample.name)+'&prefecture='+encodeURIComponent(sample.prefecture));assert.equal(search.status,200);assert((await search.text()).includes('/restaurant/'+sample.id));
 const detail=await get('/restaurant/'+sample.id);assert.equal(detail.status,200);const detailHtml=await detail.text();assert(detailHtml.includes(sample.name));pass('store-name search and store detail');
 assert.equal((await get('/api/export')).status,401);assert.equal((await get('/api/backup')).status,403);pass('anonymous data export and backup remain restricted');
 assert.equal((await post('/api/survey',{},'https://invalid.example')).status,403);assert.equal((await post('/api/survey',{consent:false})).status,400);pass('cross-origin and incomplete submissions rejected');
 const submitted=await post('/api/survey',{requestKey:randomUUID()+randomUUID(),kind:'list',company:'Vercel移行の動作確認（連絡不要）',name:'検証専用',email:'migration-check@example.invalid',phone:'',purpose:'営業リストを作成・出力したい',message:'自動検証用データです。実際の問い合わせではありません。連絡・営業案内は不要です。',preferredContact:'不要',consent:true,marketingConsent:false,next:'/lists'});
 assert.equal(submitted.status,200);assert((await submitted.json()).access);assert(submitted.headers.getSetCookie().some(value=>/HttpOnly/i.test(value)&&/Secure/i.test(value)));pass('questionnaire saved with a secure session');
 const lists=await get('/lists');assert.equal(lists.status,200);assert((await lists.text()).includes('リストを作成'));pass('questionnaire session opens the workspace');
 const created=await post('/api/action',{action:'create-list',name:'移行検証用の一時リスト'});assert.equal(created.status,200);list=(await created.json()).id;
 assert.equal((await post('/api/action',{action:'add-to-list',listId:list,ids:[sample.id]})).status,200);
 const csv=await get('/api/export?list='+encodeURIComponent(list));assert.equal(csv.status,200);const csvText=await csv.text();assert(csvText.includes(sample.id));assert(csvText.includes(sample.phone));pass('store saved to a list and CSV exported with phone digits');
 const xlsx=await get('/api/export?list='+encodeURIComponent(list)+'&format=xlsx');assert.equal(xlsx.status,200);const bytes=new Uint8Array(await xlsx.arrayBuffer());assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);assert(bytes.length>1000);pass('Excel export returns an XLSX workbook');
 assert.equal((await post('/api/action',{action:'disclosure-mode',mode:'auto'})).status,401);pass('questionnaire sessions cannot perform administrator operations');
}finally{
 if(list)assert.equal((await post('/api/action',{action:'delete-list',id:list})).status,200);
 if([...cookies.keys()].some(key=>key.includes('survey')))await post('/api/survey/session',{});
}
assert.equal((await get('/api/export')).status,401);pass('session termination revokes export access');
await fs.writeFile('work/vercel-flow-verification.json',JSON.stringify({base,passed:checks.length,checks,at:new Date().toISOString(),sampleId:sample.id,testData:'One clearly labelled no-contact questionnaire record; temporary list removed'},null,2));
console.log('Verified '+checks.length+' production checks');
