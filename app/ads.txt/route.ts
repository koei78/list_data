export const dynamic='force-dynamic';

export async function GET(){
 const clientId=process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID||'';
 if(!/^ca-pub-\d+$/.test(clientId))return new Response('Not found',{status:404});
 const publisherId=clientId.slice(3);
 return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
}
