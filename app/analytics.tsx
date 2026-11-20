'use client';
import {Analytics,type BeforeSendEvent} from '@vercel/analytics/next';
export function SiteAnalytics(){return <Analytics beforeSend={(event:BeforeSendEvent)=>{const url=new URL(event.url);if(['/admin','/admin-setup','/login','/mypage','/lists'].some(path=>url.pathname===path||url.pathname.startsWith(path+'/')))return null;url.search='';url.hash='';return {...event,url:url.toString()};}}/>;}
