import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.argv[2]||'https://list-data-eight.vercel.app';
const manifest=JSON.parse(await fs.readFile('work/provided-csv-manifest.json','utf8'));
const totals=[manifest.unique_stores,manifest.rows_with_phone];
const results=[];
for(const path of ['/','/restaurants','/restaurants?page=2','/areas','/areas/'+encodeURIComponent('新宿区'),'/areas/'+encodeURIComponent('新宿区')+'?page=2','/restaurant-lists','/sample-list','/phone-search?phone=0312345678','/reports/restaurant-data','/guides/restaurant-list']){
 const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(60000)});assert.equal(response.status,200,path);const html=await response.text();
 assert(!html.includes('__next_error__'),path);
 for(const count of totals)assert(!new RegExp('(?<![0-9])'+String(count).replace(/\B(?=(\d{3})+(?!\d))/g,',?')+'(?![0-9])').test(html),path+' leaked an aggregate in HTML or serialized data');
 assert(!html.includes('掲載施設数'),path);
 if(path==='/restaurants'||path.startsWith('/areas/'))assert(!html.includes('件 / ')&&!html.includes('施設を掲載。うち')&&!html.includes('電話番号掲載率：'),path);
 if(path==='/sample-list'){assert(!/\\?"n\\?"\s*:\s*\d/.test(html),'sample props expose aggregate counts');assert(!html.includes('電話番号掲載 <!-- -->'),'sample options expose aggregate counts');}
 if(path==='/reports/restaurant-data')assert(!html.includes('掲載率')&&!html.includes('市町村別の集計CSVをダウンロード'),'public report exposes totals');
 if(path==='/guides/restaurant-list')assert(!html.includes('掲載491件')&&!html.includes('件数と電話番号掲載数'),'guide exposes historical aggregate counts');
 results.push({path,status:response.status});console.log('PASS '+path);
}
const csv=await fetch(base+'/reports/restaurant-data.csv',{redirect:'manual'});assert.equal(csv.status,403);assert(csv.headers.get('cache-control')?.includes('no-store'));results.push({path:'/reports/restaurant-data.csv',status:csv.status});console.log('PASS aggregate CSV requires administrator authentication');
const screenshot=await fetch(base+'/guides/sample-selection.png');assert.equal(screenshot.status,200);const sha=bytes=>createHash('sha256').update(bytes).digest('hex');assert.equal(sha(Buffer.from(await screenshot.arrayBuffer())),sha(await fs.readFile('public/guides/sample-selection.png')));results.push({path:'/guides/sample-selection.png',status:200});console.log('PASS guide image matches the verified screenshot without aggregate counts');
await fs.writeFile('work/public-count-privacy-verification.json',JSON.stringify({base,at:new Date().toISOString(),results},null,2));
