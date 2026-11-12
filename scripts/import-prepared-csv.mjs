import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const control=createInterface({input:process.stdin});
console.log('Waiting for connection configuration on stdin');
const config=await new Promise(resolve=>control.once('line',line=>resolve(JSON.parse(line))));control.close();process.stdin.pause();
const base='https://list-data-eight.vercel.app';
const manifest=JSON.parse(await fs.readFile('work/provided-csv-manifest.json','utf8'));
const cookies=new Map();
function retain(response){for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],split=pair.indexOf('=');cookies.set(pair.slice(0,split),pair.slice(split+1));}}
const cookie=()=>[...cookies].map(([key,value])=>key+'='+value).join('; ');
let location=config.shareUrl;
for(let i=0;i<6;i++){
 if(new URL(location).origin!==base)throw new Error('Unexpected authentication origin');
 const response=await fetch(location,{redirect:'manual',headers:{cookie:cookie()},signal:AbortSignal.timeout(60000)});retain(response);
 if(response.status>=300&&response.status<400){location=new URL(response.headers.get('location'),base).href;continue;}
 if(response.status!==200)throw new Error('Deployment authentication failed: '+response.status);break;
}
async function post(body){
 for(let attempt=0;attempt<5;attempt++){
  try{const response=await fetch(base+'/api/ingest',{method:'POST',headers:{cookie:cookie(),authorization:'Bearer '+config.token,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});retain(response);if(response.status===429||response.status>=500){await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));continue;}if(!response.ok)throw new Error('Import HTTP '+response.status);return await response.json();}catch(error){if(attempt===4||/HTTP 40/.test(error.message))throw error;await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
 }throw new Error('Import retries exhausted');
}
const checkpoint='work/provided-csv-import-progress.json';let completed=new Set();
try{const saved=JSON.parse(await fs.readFile(checkpoint,'utf8'));if(saved.original_sha256===manifest.original_sha256)completed=new Set(saved.completed);}catch{}
let writes=Promise.resolve(),batchNumber=0,checkedRows=0;const jobs=new Set();
const canonical=raw=>JSON.stringify(Object.fromEntries(Object.keys(raw).sort().map(key=>[key,raw[key]])));
async function send(rows,index){
 const proof=createHash('sha256').update(rows.map(row=>`${row.rowNumber}:${createHash('sha256').update(canonical(row.raw)).digest('hex')}\n`).join('')).digest('hex');
 const result=await post({mode:'csv',source:manifest.source,rows});assert.equal(result.staged,rows.length);assert.equal(result.sha256,proof);
 completed.add(index);checkedRows+=rows.length;const snapshot=JSON.stringify({original_sha256:manifest.original_sha256,completed:[...completed].sort((a,b)=>a-b)});writes=writes.then(()=>fs.writeFile(checkpoint,snapshot));
 if(completed.size%20===0)console.log(JSON.stringify({batches:completed.size,verifiedRowsThisRun:checkedRows,totalRows:manifest.source_rows}));
}
const reader=createInterface({input:createReadStream('work/provided-csv.ndjson'),crlfDelay:Infinity});let batch=[];let failure;
async function dispatch(){const rows=batch;batch=[];const index=batchNumber++;if(completed.has(index))return;const job=send(rows,index).catch(error=>{failure=error;}).finally(()=>jobs.delete(job));jobs.add(job);if(jobs.size>=4)await Promise.race(jobs);if(failure)throw failure;}
try{
 for await(const line of reader){if(!line)continue;batch.push(JSON.parse(line));if(batch.length===250)await dispatch();}
 if(batch.length)await dispatch();await Promise.all(jobs);if(failure)throw failure;await writes;
 const verified=await post({mode:'verify-csv',sourceId:manifest.source.id});assert.equal(verified.sourceRows,manifest.source_rows);assert.equal(verified.sha256,manifest.raw_sha256);assert.equal(verified.stores,manifest.unique_stores);
 await fs.writeFile('work/provided-csv-verification.json',JSON.stringify({verified:true,...verified,original_sha256:manifest.original_sha256},null,2));
 console.log(JSON.stringify({complete:true,...verified}));
}catch(error){await Promise.allSettled(jobs);await writes;console.error('CSV migration stopped: '+error.message);process.exitCode=1;}
