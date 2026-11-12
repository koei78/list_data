export const dynamic='force-dynamic';
import {one} from '../../lib/db';
import {ORIGIN} from '../../lib/config';
export async function GET(){const count=await one("SELECT count(*) n FROM restaurants WHERE deleted=0 AND redirect_to IS NULL AND indexable=1 AND business_status<>'閉店'");const parts=Math.max(1,Math.ceil(count.n/10000));return new Response('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+`<sitemap><loc>${ORIGIN}/sitemaps/areas.xml</loc></sitemap>`+Array.from({length:parts},(_,i)=>`<sitemap><loc>${ORIGIN}/sitemaps/${i}.xml</loc></sitemap>`).join('')+'</sitemapindex>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}

