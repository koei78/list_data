import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {POST} from '../app/api/sample-request/route';
import {all,one,run} from '../lib/db';
import {sampleAreas,SAMPLE_MARKER,sampleRows,sampleCsv} from '../lib/sample-list';
import {closeDatabase} from '../lib/database-driver';
import {parseCSV} from '../lib/normalize';
if(process.env.NETLIFY_LOCAL_DB!=='1'||process.env.NETLIFY==='true')throw new Error('Local testing only');
const company='Local sample test only',origin='http://127.0.0.1:3000',checks:string[]=[];
const pass=(s:string)=>{checks.push(s);console.log('PASS '+s);};
function input(extra:any={}){return {requestKey:randomUUID()+randomUUID(),municipality:'三鷹市',category:'',company,name:'Test',email:'sample-test@example.invalid',phone:'',purpose:'営業リストを作成・出力したい',preferredContact:'不要',marketingConsent:false,consent:true,website:'',note:'',attribution:{source:'google',medium:'cpc',campaign:'tama_sample_20261028'},...extra};}
const request=(b:any,site=origin,type='application/json')=>new Request(origin+'/api/sample-request',{method:'POST',headers:{origin:site,'content-type':type},body:JSON.stringify(b)});
try{
 delete process.env.SURVEY_NOTIFICATIONS_ENABLED;await run('DELETE FROM survey_rate_limits');
 const areas=await sampleAreas();assert(areas.some(a=>a.name==='三鷹市'));assert(!areas.some(a=>a.name==='新宿区'));pass('available areas match real phone-bearing public data');
 assert.equal((await POST(request(input(),'https://example.invalid'))).status,403);assert.equal((await POST(request(input(),origin,'text/plain'))).status,415);
 for(const extra of [{consent:false},{website:'bot'},{email:'invalid'},{preferredContact:'電話',phone:''},{marketingConsent:true},{note:'x'.repeat(17000)}])assert([400,413].includes((await POST(request(input(extra)))).status));pass('origin, consent, honeypot, contact preference and body limits enforced');
 const missing=await POST(request(input({municipality:'未収録地域'})));assert.equal(missing.status,400);assert.equal((await one('SELECT count(*) n FROM survey_leads WHERE company=?',[company])).n,0);pass('unavailable requests do not produce leads');
 const value=input(),response=await POST(request(value));assert.equal(response.status,200);assert.equal(response.headers.get('set-cookie'),null);assert(response.headers.get('cache-control')?.includes('no-store'));const data=await response.json();assert(data.count>0&&data.count<=30);assert(data.reference);const csv=parseCSV(data.csv);assert.equal(csv.length,data.count+1);assert.equal(csv[0].length,9);assert(!csv[0].includes('代表者'));assert(!csv[0].includes('運営会社'));assert(csv.slice(1).every(r=>r[4]==='三鷹市'&&r[2]));pass('sample response contains up to 30 public records, CSV provenance and no account session');
 const lead=await one('SELECT * FROM survey_leads WHERE id=?',[data.reference]);assert.equal(lead.kind,'inquiry');assert.equal(lead.marketing_consent,0);assert.equal(lead.preferred_contact,'不要');assert(lead.message.startsWith(SAMPLE_MARKER));assert(lead.message.includes('google / cpc / tama_sample_20261028'));assert.equal(await one('SELECT * FROM survey_sessions WHERE lead_id=?',[data.reference]),null);pass('real request and campaign source saved without granting private access');
 const again=await POST(request(value));assert.equal(again.status,200);assert.equal((await again.json()).reference,data.reference);assert.equal((await one('SELECT count(*) n FROM survey_leads WHERE company=?',[company])).n,1);assert.equal((await POST(request({...value,note:'変更した内容'}))).status,409);pass('retries keep one lead and reject changed saved payload');
 const rows=await sampleRows('三鷹市','すし屋');assert(rows.every(r=>r.category==='すし屋'));assert.equal((await sampleRows("' OR 1=1 --")).length,0);const cell=parseCSV(sampleCsv([{name:'=1+1',phone:'01234'}]));assert.equal(cell[1][0],"'=1+1");pass('filters are parameterized and CSV formula cells are escaped');
 await fs.writeFile('work/sample-request-tests.json',JSON.stringify({passed:checks.length,checks,time:new Date().toISOString(),environment:'local'},null,2));
}finally{for(const l of await all('SELECT id FROM survey_leads WHERE company=?',[company]))await run('DELETE FROM survey_leads WHERE id=?',[l.id]);await run('DELETE FROM survey_rate_limits');await closeDatabase();}
