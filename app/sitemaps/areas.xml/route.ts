export const dynamic='force-dynamic';
import {directoryAreas,areaPagePath,DIRECTORY_PAGE_SIZE} from '../../../lib/directory';
import {ORIGIN} from '../../../lib/config';
import {xml} from '../../../lib/normalize';
export async function GET(){const areas=await directoryAreas();const paths=['/areas',...areas.flatMap(a=>Array.from({length:Math.ceil(a.n/DIRECTORY_PAGE_SIZE)},(_,i)=>areaPagePath(a.name,i+1)))];return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>${xml(ORIGIN+p)}</loc></url>`).join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}

