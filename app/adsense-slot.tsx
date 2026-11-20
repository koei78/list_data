'use client';

import Script from 'next/script';
import {usePathname} from 'next/navigation';

const clientId=process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID||'';
const slotId=process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID||'';
const configured=/^ca-pub-\d+$/.test(clientId)&&/^\d+$/.test(slotId);
const contentPaths=new Set(['/guides/restaurant-list','/templates/sales-list','/tools/phone-cleaner']);

declare global { interface Window { adsbygoogle?:Array<Record<string,unknown>>; } }

export function AdsenseSlot(){
 const pathname=usePathname();
 if(!configured||!contentPaths.has(pathname))return null;
 return <aside className="adsense-slot" aria-label="広告">
  <span className="adsense-label">広告</span>
  <ins className="adsbygoogle" style={{display:'block'}} data-ad-client={clientId} data-ad-slot={slotId} data-ad-format="auto" data-full-width-responsive="true"/>
  <Script id="google-adsense" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`} strategy="afterInteractive" async crossOrigin="anonymous" onReady={()=>{try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}}}/>
 </aside>;
}
