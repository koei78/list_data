'use client';
import {useEffect} from 'react';
type Event='sample_view'|'sample_start'|'sample_submit'|'sample_download';
type Source='google'|'search'|'social'|'direct'|'internal'|'other';
function source():Source{try{const host=new URL(document.referrer).hostname;if(host===location.hostname)return 'internal';if(/(^|\.)google\.[a-z.]+$/.test(host))return 'google';if(/(^|\.)(bing.com|search.yahoo.co.jp|duckduckgo.com)$/.test(host))return 'search';if(/(^|\.)(t.co|x.com|facebook.com|instagram.com|linkedin.com)$/.test(host))return 'social';return 'other';}catch{return 'direct';}}
export function trackGrowth(event:Event,area=''){
 try{if(location.hostname==='127.0.0.1'||location.hostname==='localhost'||navigator.doNotTrack==='1'||(navigator as any).globalPrivacyControl)return;
 if(new URLSearchParams(location.search).get('measurement')==='off')sessionStorage.setItem('tenkai-measurement-off','1');
 if(sessionStorage.getItem('tenkai-measurement-off')==='1')return;
 let origin=sessionStorage.getItem('tenkai-entry-source');if(!origin){origin=source();sessionStorage.setItem('tenkai-entry-source',origin);}
 void fetch('/api/growth-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),event,area,source:origin}),keepalive:true}).catch(()=>{});
 }catch{/* Measurement must never interrupt a download or a form. */}
}
export function EntrySource(){useEffect(()=>{try{if(navigator.doNotTrack==='1'||(navigator as any).globalPrivacyControl)return;if(new URLSearchParams(location.search).get('measurement')==='off')sessionStorage.setItem('tenkai-measurement-off','1');if(!sessionStorage.getItem('tenkai-entry-source'))sessionStorage.setItem('tenkai-entry-source',source());}catch{}},[]);return null;}
