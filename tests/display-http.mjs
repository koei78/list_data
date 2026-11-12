import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='https://tenkai-restaurant-db.netlify.app';
const rows=(await fs.readFile('../data-acquisition/app-import.ndjson','utf8')).trim().split('\n').map(JSON.parse);
const affected=rows.filter(row=>/\p{Co}/u.test(row.name+row.address));
const ids=[...new Set(affected.map(row=>row.id))];
let checked=0,next=0;
async function read(path){const response=await fetch(base+path);assert.equal(response.status,200,path);const html=await response.text();assert(!/\p{Co}/u.test(html),'Private-use text in '+path);return html;}
const home=await read('/');assert(home.includes('梅ちゃんの台所'));assert(home.includes('店名確認中'));
async function worker(){while(next<ids.length){const id=ids[next++];const html=await read('/restaurant/'+id);assert(html.includes('application/ld+json'));if(id==='tky-0a3fb4b928f6415b85c3'){assert(html.includes('<h1>梅ちゃんの台所</h1>'));assert(html.includes('梅ちゃんの台所｜0422-29-9426'));}checked++;}}
await Promise.all(Array.from({length:4},worker));
const search=await read('/restaurants?name='+encodeURIComponent('梅ちゃん'));assert(search.includes('/restaurant/tky-0a3fb4b928f6415b85c3'));assert(search.includes('梅ちゃんの台所'));
const report={base,affectedFacilityPages:checked,homepage:true,titleAndStructuredData:true,correctedNameSearch:true,remainingPrivateUseCharacters:0,time:new Date().toISOString()};
await fs.writeFile('work/display-http-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
