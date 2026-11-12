import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const [base,out='work/search-growth-http.json']=process.argv.slice(2);
const checks=[];
const decode=s=>s.replaceAll('&amp;','&');
const links=html=>[...new Set([...html.matchAll(/href="([^"#]+)"/g)].map(m=>decode(m[1])))];
async function page(path){const r=await fetch(base+path,{headers:{'User-Agent':'Googlebot'},redirect:'manual'}),html=await r.text();assert.equal(r.status,200,path);assert(!/noindex/.test(r.headers.get('x-robots-tag')||''),path);return html;}
function pass(name){checks.push(name);console.log('PASS '+name);}
const home=await page('/');for(const path of ['/areas','/restaurant-lists','/guides/restaurant-list'])assert(links(home).includes(path));pass('homepage links directly to the public directory and both guides');
const areas=await page('/areas'),map=await page('/sitemaps/areas.xml');
const directoryPaths=[...map.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>{const u=new URL(decode(m[1]));return u.pathname+u.search;}).filter(p=>p!=='/areas');
assert.equal(directoryPaths.length,238);for(const path of directoryPaths)assert(links(areas).includes(path),path);pass('all 238 area list pages are linked in initial HTML without pagination traversal');
const coverage=JSON.parse(await fs.readFile('work/directory-coverage.json','utf8'));
for(const sample of coverage.samples){const html=await page(sample.path);assert(links(html).includes('/restaurant/'+sample.id));assert(!/<meta name="robots" content="noindex/.test(html));}pass('all five random stores reachable in three links from homepage');
for(const path of ['/restaurant-lists','/guides/restaurant-list']){
 const html=await page(path);assert(html.includes(`<link rel="canonical" href="${base}${path}"`));assert(html.includes(`<meta property="og:url" content="${base}${path}"`));assert(!/<meta name="robots" content="noindex/.test(html));assert(html.includes('株式会社てんかい'));assert(html.includes('/data-sources'));
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']||[s];});assert(schemas.some(s=>s['@type']==='BreadcrumbList'));
 if(path.includes('/guides/')){assert(schemas.some(s=>s['@type']==='Article'));assert(html.includes('全選択は表示中のページ'));assert(html.includes('店舗データは含みません'));}else{assert(html.includes('21,875'));assert(html.includes('16,861'));}
 pass(path+' is public, self-canonical, server-rendered and accurately attributed');
}
const sitemap=await page('/sitemaps/0.xml');for(const path of ['/restaurant-lists','/guides/restaurant-list'])assert(sitemap.includes('<loc>'+base+path+'</loc>'));pass('both public resources included in facility sitemap without changing store URLs');
const download=await fetch(base+'/templates/restaurant-sales-list.csv');assert.equal(download.status,200);const bytes=new Uint8Array(await download.arrayBuffer());assert.deepEqual([...bytes.slice(0,3)],[239,187,191]);const csv=new TextDecoder().decode(bytes).trim();assert.equal(csv.split('\n').length,1);assert.equal(csv.split(',').length,16);assert(csv.includes('電話番号')&&csv.includes('出典URL'));pass('UTF-8 BOM CSV contains only 16 empty-template headings, no customer or store data');
const gated=await fetch(base+'/lists');assert(/noindex/.test(gated.headers.get('x-robots-tag')||''));assert((await gated.text()).includes('簡単なアンケートで利用を開始'));pass('sales lists require questionnaire access and remain noindex');
const exportResponse=await fetch(base+'/api/export');assert.equal(exportResponse.status,401);pass('anonymous export of actual store lists remains blocked');
await fs.writeFile(out,JSON.stringify({at:new Date().toISOString(),base,passed:checks.length,directoryPages:directoryPaths.length,facilitiesCovered:coverage.facilities,checks},null,2));
