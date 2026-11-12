export const dynamic='force-dynamic';
import {env} from '../../lib/runtime';
import {ORIGIN} from '../../lib/config';
export function GET(){return new Response(env.PUBLIC_INDEXING==='1'?`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /mypage\nDisallow: /lists\nDisallow: /decision-makers\nDisallow: /contact\nSitemap: ${ORIGIN}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});}

