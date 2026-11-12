import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {displayRecord,displayText,hasPrivateUse} from '../lib/display-text';
import {search} from '../lib/search';
import {one} from '../lib/db';
import {closeDatabase} from '../lib/database-driver';
if(process.env.NETLIFY_LOCAL_DB!=='1'||process.env.NETLIFY==='true')throw new Error('Local database only');
try{
 const rows=(await fs.readFile('../data-acquisition/app-import.ndjson','utf8')).trim().split('\n').map(JSON.parse);
 const fields=['name','address','operator_name','representative_name'];
 let affectedNames=0,affectedFields=0;
 for(const row of rows){
  const before=JSON.stringify(row),view=displayRecord(row);
  if(hasPrivateUse(row.name))affectedNames++;
  for(const key of fields){if(typeof row[key]==='string'&&hasPrivateUse(row[key]))affectedFields++;assert(!hasPrivateUse(view[key]||''));}
  assert(view.name.trim());assert.equal(JSON.stringify(row),before);
 }
 assert.equal(affectedNames,48);assert.equal(affectedFields,80);
 assert.equal(displayText('A \uE100 B'),'A   B');
 assert.equal(displayText('é 髙 吉 😀'),'é 髙 吉 😀');
 assert.equal(displayText('A\u{F0000}B'),'A B');
 assert.equal(displayRecord({name:'\uE12C'}).name,'店名確認中');
 const results=await search({name:'梅ちゃん'},null);
 const corrected=results.rows.find(r=>r.id==='tky-0a3fb4b928f6415b85c3');
 assert(corrected);assert.equal(corrected.name,'梅ちゃんの台所');
 assert.equal((await one('SELECT name FROM restaurants WHERE id=?',[corrected.id])).name,'\uE17Bちゃんの台所');
 assert.equal((await search({name:'梅ちゃん',municipality:'立川市'},null)).total,0);
 assert.equal((await search({name:'梅ちゃん',operator:'anything'},null)).total,0);
 const report={affectedNames,affectedFields,rawDataPreserved:true,verifiedNameSearch:true,areaAndPermissionFiltersPreserved:true,privateUseTextRemoved:true,ordinaryUnicodePreserved:true,time:new Date().toISOString()};
 await fs.writeFile('work/display-text-test-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await closeDatabase();}
