import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {GET as sitemap} from '../app/sitemap.xml/route';
import {GET as sitemapPart} from '../app/sitemaps/[part]/route';
import {GET as areaSitemap} from '../app/sitemaps/areas.xml/route';
import {GET as robots} from '../app/robots.txt/route';
import {db,closeDatabase} from '../lib/database-driver';
import {search} from '../lib/search';
if(process.env.NETLIFY_LOCAL_DB!=='1'||process.env.NETLIFY==='true')throw new Error('Local database only');
const checks:string[]=[];
function pass(name:string){checks.push(name);console.log('PASS '+name);}
const source=(await fs.readFile(process.argv[2],'utf8')).trim().split('\n').map(line=>JSON.parse(line));
try{
  const index=await(await sitemap()).text();assert.equal((index.match(/<sitemap>/g)||[]).length,4);
  pass('sitemap index contains area map and three facility maps');
  const ids:string[]=[];
  for(let i=0;i<3;i++){const response=await sitemapPart(new Request('http://127.0.0.1:3100/sitemaps/'+i+'.xml'),{params:Promise.resolve({part:i+'.xml'})});assert.equal(response.status,200);const xml=await response.text();for(const match of xml.matchAll(/<loc>[^<]+\/restaurant\/([^<]+)<\/loc>/g))ids.push(match[1]);}
  assert.equal(ids.length,21875);assert.deepEqual(new Set(ids),new Set(source.map(r=>r.id)));pass('all 21875 unique facility URLs preserved');
  const directories=await(await areaSitemap()).text();assert.equal((directories.match(/<url>/g)||[]).length,239);assert(directories.includes('?page=2'));pass('all 239 area directory URLs and pagination preserved');
  assert.equal((await sitemapPart(new Request('http://127.0.0.1:3100'),{params:Promise.resolve({part:'invalid.xml'})})).status,404);assert.equal((await sitemapPart(new Request('http://127.0.0.1:3100'),{params:Promise.resolve({part:'999.xml'})})).status,404);pass('invalid sitemap parts return 404');
  const sample=source.find(r=>r.phone&&r.operator_name&&r.representative_name&&!r.name.includes(r.operator_name)&&!r.name.includes(r.representative_name));
  const found=await search({phone:sample.phone},null);assert(found.rows.some(r=>r.id===sample.id));pass('phone search finds migrated store');
  const policy=await robots().text();assert(policy.includes('Allow: /'));assert(policy.includes('Sitemap: http://127.0.0.1:3100/sitemap.xml'));pass('public crawl policy advertises configured sitemap');
  for(const table of ['users','inquiries','sales_lists','disclosure_grants'])assert.equal((await db().prepare(`SELECT count(*) n FROM ${table}`).first()).n,0);pass('local permission fixtures cleaned up');
  await fs.writeFile('work/seo-route-test-results.json',JSON.stringify({passed:checks.length,checks,environment:'direct Next.js route/component invocation, local PGlite',httpAndBrowserTested:false,time:new Date().toISOString()},null,2));
}finally{await closeDatabase();}
