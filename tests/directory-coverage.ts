import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {directoryAreas,directoryPages,directoryArea} from '../lib/directory';
import {closeDatabase} from '../lib/database-driver';
if(process.env.NETLIFY_LOCAL_DB!=='1'||process.env.NETLIFY==='true')throw new Error('Local database only');
try{
 const expected=(await fs.readFile('../data-acquisition/app-import.ndjson','utf8')).trim().split('\n').map(line=>JSON.parse(line));
 const sample=JSON.parse(await fs.readFile('../seo-google-sample.json','utf8')).sample;
 const pages=[],seen=new Set<string>(),samples:any[]=[];
 for(const area of await directoryAreas())for(const page of directoryPages(area.name,area.n)){
   const data=await directoryArea(area.name,page.page);assert(data);
   assert.equal(data.rows.length,page.end-page.start+1);
   pages.push(page.path);
   for(const row of data.rows){assert(!seen.has(row.id),'duplicate store '+row.id);seen.add(row.id);if(sample.some((s:any)=>s.id===row.id))samples.push({id:row.id,name:row.name,path:page.path});}
 }
 assert.deepEqual(seen,new Set(expected.map(r=>r.id)));assert.equal(new Set(pages).size,pages.length);assert.equal(samples.length,5);
 await fs.writeFile('work/directory-coverage.json',JSON.stringify({time:new Date().toISOString(),pages:pages.length,facilities:seen.size,allFacilitiesReachable:true,samples},null,2));
 console.log(JSON.stringify({pages:pages.length,facilities:seen.size,allFacilitiesReachable:true,samples}));
}finally{await closeDatabase();}
