import 'server-only';
import {db} from './database-driver';
export {db};
export async function all<T=any>(sql:string,args:any[]=[]):Promise<T[]>{return (await db().prepare(sql).bind(...args).all<T>()).results;}
export async function one<T=any>(sql:string,args:any[]=[]):Promise<T|null>{return db().prepare(sql).bind(...args).first<T>();}
export async function run(sql:string,args:any[]=[]){return db().prepare(sql).bind(...args).run();}
export const now=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID();
export async function audit(actor:string,action:string,target:string=''){await run('INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)',[uid(),actor,action,target,now()]);}
