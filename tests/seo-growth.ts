import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {publicAreaStats,phoneRate,areaDetail} from '../lib/public-data';
import {recordGrowth,growthSummary,eventSchema,japanDay} from '../lib/growth';
import {GET as reportCsv} from '../app/reports/restaurant-data.csv/route';
import {parseCSV} from '../lib/normalize';
import {one,run} from '../lib/db';
import {closeDatabase} from '../lib/database-driver';
if(process.env.NETLIFY_LOCAL_DB!=='1'||process.env.NETLIFY==='true')throw new Error('Local database only');
const checks:string[]=[],ids:string[]=[];const pass=(s:string)=>{checks.push(s);console.log('PASS '+s);};
try{
 const rows=await publicAreaStats();assert.equal(rows.length,37);assert.equal(rows.reduce((n,r)=>n+Number(r.n),0),21875);assert.equal(rows.reduce((n,r)=>n+Number(r.phones),0),16861);assert.equal(phoneRate(16861,21875),77.1);assert.equal(phoneRate(0,0),0);pass('coverage totals match public dataset and rounding is correct');
 for(const name of ['三鷹市','武蔵野市','調布市']){const info=await areaDetail(name),row=rows.find(r=>r.name===name)!;assert(info.sources.length>0);assert.equal(info.categories.reduce((n,r)=>n+Number(r.n),0),row.n);assert(info.preview.length>0&&info.preview.length<=3);assert(info.preview.every(r=>r.phone&&r.category==='一般飲食店'));}assert.equal((await areaDetail("' OR 1=1 --")).preview.length,0);pass('area evidence, breakdown and real examples are scoped to requested area');
 const res=await reportCsv(),csv=parseCSV(await res.text());assert.equal(csv.length,38);assert.equal(csv[0].length,6);assert(!csv[0].includes('電話番号'));assert.equal(res.headers.get('x-robots-tag'),'noindex');assert.equal(csv.slice(1).reduce((n,r)=>n+Number(r[1]),0),21875);pass('public aggregate CSV includes all areas and no individual contact data');
 const request=new Request('http://127.0.0.1:3000/api/growth-event',{method:'POST'});const id=randomUUID();ids.push(id);const input={id,event:'sample_start',source:'google',area:'三鷹市'};
 await recordGrowth(request,input);await recordGrowth(request,input);assert.equal((await one('SELECT count(*) n FROM growth_events WHERE id=?',[id])).n,1);pass('retried event IDs do not double count');
 assert(!eventSchema.safeParse({...input,email:'must-not-save@example.invalid'}).success);assert(!eventSchema.safeParse({...input,event:'arbitrary'}).success);await assert.rejects(()=>recordGrowth(request,{...input,id:randomUUID(),area:'未収録地域'}));pass('personal fields, arbitrary event names and unlisted areas are rejected');
 assert.equal(japanDay(new Date('2026-10-27T15:00:00Z')),'2026-10-28');assert.equal(japanDay(new Date('2026-10-27T14:59:59Z')),'2026-10-27');const summary=await growthSummary();assert(summary.events.some(r=>r.day===japanDay()&&r.event==='sample_start'&&r.n>=1));pass('JST date boundary and private aggregate report query work');
 const old=randomUUID();ids.push(old);await run('INSERT INTO growth_events(id,event,area,source,day,created_at) VALUES(?,?,?,?,?,?)',[old,'sample_view','','direct','2020-01-01','2020-01-01T00:00:00.000Z']);await recordGrowth(request,input);assert.equal(await one('SELECT id FROM growth_events WHERE id=?',[old]),null);pass('events older than 90 days are removed');
 await fs.writeFile('work/seo-growth-tests.json',JSON.stringify({checks,passed:checks.length,time:new Date().toISOString(),environment:'local'},null,2));
}finally{for(const id of ids)await run('DELETE FROM growth_events WHERE id=?',[id]);await run("DELETE FROM survey_rate_limits WHERE key LIKE 'growth:%'");await closeDatabase();}
