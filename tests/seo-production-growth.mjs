import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base='https://tenkai-restaurant-db.netlify.app';const checks=[];
for(const path of ['/','/restaurant-lists','/areas/'+encodeURIComponent('三鷹市'),'/reports/restaurant-data','/guides/restaurant-list','/sample-list?area='+encodeURIComponent('三鷹市')+'&category='+encodeURIComponent('一般飲食店')]){
 const r=await fetch(base+path),html=await r.text();assert.equal(r.status,200,path);assert(!/noindex/.test(r.headers.get('x-robots-tag')||''));assert(!/<meta name="robots" content="[^"]*noindex/.test(html));assert(!html.includes('chatgpt.site'));assert(html.includes('rel="canonical"'));
 if(path.includes('/areas/'))assert(html.includes('705')&&html.includes('無料CSV'));
 if(path.includes('/reports/')){assert(html.includes('21,875')&&html.includes('77.1'));const schemas=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));const dataset=schemas.find(s=>s['@type']==='Dataset');assert(dataset);assert(dataset.description.length>=50);assert(dataset.license);}
 if(path.includes('/guides/'))assert(html.includes('/guides/sample-selection.png'));
 if(path.includes('/sample-list?'))assert(html.includes('491'));
 checks.push(path+' HTTP200 / canonical / indexable');
}
let r=await fetch(base+'/reports/restaurant-data.csv');assert.equal(r.status,200);assert.equal((await r.text()).trim().split('\n').length,38);checks.push('aggregate CSV: 37 municipalities');
r=await fetch(base+'/sitemaps/0.xml');assert((await r.text()).includes(base+'/reports/restaurant-data'));checks.push('report present in sitemap');
r=await fetch(base+'/guides/sample-selection.png');assert.equal(r.status,200);assert(r.headers.get('content-type').includes('image/png'));checks.push('guide screenshot served');
r=await fetch(base+'/api/growth-event',{method:'POST',headers:{origin:base,dnt:'1'}});assert.equal(r.status,204);checks.push('do-not-track request excluded');
r=await fetch(base+'/admin?tab=traffic');const admin=await r.text();assert(!admin.includes('直近14日')&&!admin.includes('source,event'));checks.push('anonymous admin does not expose metrics');
await fs.writeFile('work/seo-production-checks.json',JSON.stringify({time:new Date().toISOString(),checks},null,2));console.log(checks.join('\n'));
