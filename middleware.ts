import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
  const response=NextResponse.next();
  const path=request.nextUrl.pathname;
  // Identity cookies and gated content must never enter a shared CDN cache.
  response.headers.set('Cache-Control','private, no-store, max-age=0');
  response.headers.set('Netlify-CDN-Cache-Control','no-store');
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  if(process.env.PUBLIC_INDEXING!=='1'||/^\/(api|admin|login|mypage|lists|survey|contact|decision-makers|__forms\.html)(\/|$)/.test(path))response.headers.set('X-Robots-Tag','noindex, nofollow');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};

