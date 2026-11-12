import 'server-only';
import {z} from 'zod';
import {all,one,run} from './db';
import {createHash} from 'node:crypto';
import {HttpError} from './auth';
export const eventSchema=z.object({id:z.string().uuid(),event:z.enum(['sample_view','sample_start','sample_submit','sample_download']),area:z.string().max(60).default(''),source:z.enum(['google','search','social','direct','internal','other'])}).strict();
export const japanDay=(date=new Date())=>new Date(date.getTime()+9*3600000).toISOString().slice(0,10);
export async function recordGrowth(req:Request,input:unknown){
 const v=eventSchema.parse(input);
 if(v.area&&!await one('SELECT 1 FROM restaurants WHERE municipality=? AND deleted=0 LIMIT 1',[v.area]))throw new HttpError(400,'地域を確認してください。');
 // Separate, short-lived rate limit; raw IP addresses are never saved.
 const bucket=Math.floor(Date.now()/3600000),ip=process.env.NETLIFY==='true'?(req.headers.get('x-nf-client-connection-ip')||'unknown'):'local';
 const key='growth:'+createHash('sha256').update(ip+'|'+bucket).digest('hex');
 const accepted=await one('INSERT INTO survey_rate_limits(key,used,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET used=survey_rate_limits.used+1 WHERE survey_rate_limits.used<120 RETURNING used',[key,new Date((bucket+2)*3600000).toISOString()]);
 if(!accepted)throw new HttpError(429,'送信回数の上限です。');
 const now=new Date();
 await run('INSERT INTO growth_events(id,event,area,source,day,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',[v.id,v.event,v.area,v.source,japanDay(now),now.toISOString()]);
 await run('DELETE FROM growth_events WHERE created_at<?',[new Date(now.getTime()-90*86400000).toISOString()]);
 await run('DELETE FROM survey_rate_limits WHERE expires_at<?',[now.toISOString()]);
}
export async function growthSummary(){
 const today=japanDay(),since=japanDay(new Date(Date.now()-13*86400000));
 const [events,sources,saved]=await Promise.all([
  all<{day:string,event:string,n:number}>('SELECT day,event,count(*) n FROM growth_events WHERE day>=? GROUP BY day,event ORDER BY day DESC,event',[since]),
  all<{source:string,event:string,n:number}>('SELECT source,event,count(*) n FROM growth_events WHERE day>=? GROUP BY source,event ORDER BY source,event',[since]),
  all<{day:string,n:number}>("SELECT substring((created_at::timestamptz AT TIME ZONE 'Asia/Tokyo')::text,1,10) AS \"day\",count(*) n FROM survey_leads WHERE kind='inquiry' AND message LIKE ? AND company<>? AND created_at>=? GROUP BY 1 ORDER BY 1 DESC",['【飲食店リスト無料サンプル依頼】%','公開動作確認（実際の問い合わせではありません）',new Date(new Date(since+'T00:00:00+09:00').getTime()).toISOString()])
 ]);return {today,since,events,sources,saved};
}

