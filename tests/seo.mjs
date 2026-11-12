import fs from 'node:fs';
import assert from 'node:assert/strict';
const [base,input,out]=process.argv.slice(2);
const expected=fs.readFileSync(input,'utf8').trim().split('\n').map(JSON.parse);
const checks=[];
const decode=(s)=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
function check(name,fn){fn();checks.push(name);console.log('PASS '+name);}
async function get(p){const r=await fetch(base+p,{redirect:'manual'});return {r,text:await r.text()};}
const root=await get('/');check('public homepage is 200 without sign-in',()=>{assert.equal(root.r.status,200);assert(root.text.includes('21,875'));assert(!/noindex/.test(root.r.headers.get('x-robots-tag')||''));assert(root.text.includes('/areas/'));});
check('homepage identifies the site and new canonical origin in initial HTML',()=>{
  const origin=new URL(base).origin;
  const title=decode(root.text.match(/<title>(.*?)<\/title>/s)?.[1]||'');
  assert.equal(title,'東京飲食店データベース｜店名・電話番号・地域で検索');
  assert.equal(new URL(root.text.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||'about:blank').href,origin+'/');
  assert(root.text.includes('<meta property="og:site_name" content="東京飲食店データベース"'));
  assert.equal(new URL(root.text.match(/<meta property="og:url" content="([^"]+)"/)?.[1]||'about:blank').href,origin+'/');
  assert(root.text.includes('href="/favicon.svg"'));
  assert(!root.text.includes('chatgpt.site'));
  const nodes=[...root.text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']||[s];});
  const site=nodes.find(s=>s['@type']==='WebSite');
  assert(site);assert.equal(site.name,'東京飲食店データベース');assert.equal(site.url,origin+'/');
  assert(nodes.some(s=>s['@id']===site.publisher['@id']&&s.name==='株式会社てんかい'));
});
const robots=await get('/robots.txt');check('robots permits public crawling and advertises sitemap',()=>{assert.equal(robots.r.status,200);assert(robots.text.includes('Allow: /'));assert(!/^Disallow: \/\s*$/m.test(robots.text));assert(robots.text.includes('/sitemap.xml'));});
const index=await get('/sitemap.xml');const sitemapPaths=[...index.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const urls=[],allLocations=[];let directoryPaths=[];
for(const p of sitemapPaths){const doc=await get(p);assert.equal(doc.r.status,200);const locs=[...doc.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));assert(locs.length<=50000);allLocations.push(...locs);if(p.includes('areas.xml'))directoryPaths=locs.map(x=>new URL(x).pathname+new URL(x).search);else urls.push(...locs.filter(u=>u.includes('/restaurant/')).map(u=>u.split('/').at(-1)));}
check('sitemaps include the homepage and only unique URLs on the canonical host',()=>{const origin=new URL(base).origin;assert(allLocations.includes(origin+'/'));assert(allLocations.includes(origin+'/data-sources'));assert(allLocations.every(u=>new URL(u).origin===origin));assert.equal(new Set(allLocations).size,allLocations.length);});
check('sitemaps cover all 21875 unique imported facilities',()=>{assert.equal(urls.length,expected.length);assert.equal(new Set(urls).size,expected.length);assert.deepEqual(new Set(urls),new Set(expected.map(x=>x.id)));assert(directoryPaths.includes('/areas'));assert(directoryPaths.some(p=>p.includes('?page=2')));});
const a=expected.find(r=>r.phone&&r.operator_name&&r.representative_name&&!r.name.includes(r.operator_name)&&!r.name.includes(r.representative_name));
const detail=await get('/restaurant/'+a.id);
check('store Open Graph URL points to itself rather than the homepage',()=>{assert(detail.text.includes(`<meta property="og:url" content="${new URL(base).origin}/restaurant/${a.id}"`));});
check('store title contains its name and phone; HTML has no private data',()=>{assert.equal(detail.r.status,200);const title=decode(detail.text.match(/<title>(.*?)<\/title>/s)?.[1]||'');assert(title.includes(a.name));assert(title.includes(a.phone));assert(detail.text.includes(a.phone.replace(/\D/g,'')));assert(!detail.text.includes(a.operator_name));assert(!detail.text.includes(a.representative_name));assert.match(detail.text,/<meta name="robots" content="index, follow"/);assert(!/noindex/.test(detail.r.headers.get('x-robots-tag')||''));});
const schemas=[...detail.text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));
check('real business JSON-LD and breadcrumb render on server',()=>{assert(schemas.some(s=>s['@type']==='BreadcrumbList'));const s=schemas.find(s=>s.telephone===a.phone);assert(s);assert.equal(s.name,a.name);assert(!s.openingHours);});
const numbered=directoryPaths.find(p=>p.includes('?page=2'));
const area=await get(numbered);
check('area pagination has unique canonical and crawlable store links',()=>{assert.equal(area.r.status,200);assert(area.text.includes('ページ目'));assert(area.text.includes('?page=2"'));assert(area.text.includes('rel="next"'));assert.equal([...area.text.matchAll(/<h2><a href="\/restaurant\//g)].length,100);assert(!area.text.includes(a.representative_name));});
check('invalid or out of range area pages are 404',()=>{});
for(const p of ['/areas/does-not-exist',numbered.replace('page=2','page=99999'),numbered.replace('page=2','page=abc')])assert.equal((await get(p)).r.status,404,p);
const redirect=await get(numbered.replace('page=2','page=1'));check('first area page canonical redirect',()=>assert.equal(redirect.r.status,308));
const unknown=await get('/restaurant/does-not-exist');check('nonexistent restaurant is a true 404',()=>assert.equal(unknown.r.status,404));
const search=await get('/restaurants?phone='+a.phone.replace(/\D/g,''));check('phone search finds store and is not indexed as a duplicate',()=>{assert(search.text.includes('/restaurant/'+a.id));assert.match(search.text,/<meta name="robots" content="noindex, follow"/);});
const admin=await get('/admin');check('anonymous administrator access denied',()=>{assert(!admin.text.includes('CSV取込'));assert(admin.text.includes('ログイン')||[401,403].includes(admin.r.status));});
const report={base,date:new Date().toISOString(),passed:checks.length,facilities:urls.length,sitemaps:sitemapPaths.length,areaDirectoryPages:directoryPaths.length,checks};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
