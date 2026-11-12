import {getDatabase} from '@netlify/database';
import {Pool,types} from 'pg';
import {postgresSql} from './sql';
import {databaseConnection} from './database-connection';

types.setTypeParser(20,Number);
type Result={rows:any[],rowCount?:number|null,affectedRows?:number};
type Client={query:(sql:string,values?:any[])=>Promise<Result>};
let pool:Pool|undefined;
let localDb:Promise<any>|undefined;
const isLocal=()=>process.env.NETLIFY_LOCAL_DB==='1'&&process.env.NETLIFY!=='true'&&process.env.VERCEL!=='1';
async function local(){if(!localDb)localDb=import('@electric-sql/pglite').then(({PGlite})=>PGlite.create(process.env.LOCAL_PG_PATH||'./work/local-postgres'));return localDb;}
function postgres(){if(!pool)pool=process.env.DATABASE_URL?new Pool({connectionString:databaseConnection(process.env.DATABASE_URL),max:4,idleTimeoutMillis:5000,connectionTimeoutMillis:10000}):getDatabase().pool as Pool;return pool;}
function normalizeRows(rows:any[]){return rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,['n','total','count','phones'].includes(key)&&typeof value==='string'&&/^\d+$/.test(value)?Number(value):value])));}
export class PreparedStatement{
  constructor(public sql:string,public values:any[]=[]){ }
  bind(...values:any[]){return new PreparedStatement(this.sql,values);}
  async execute(client?:Client){const target=client|| (isLocal()?await local():postgres());const r=await target.query(postgresSql(this.sql),this.values);return {results:normalizeRows(r.rows),meta:{changes:r.rowCount??r.affectedRows??0}};}
  async all<T=any>(){return await this.execute() as {results:T[],meta:{changes:number}};}
  async first<T=any>(){return (await this.all<T>()).results[0]||null;}
  async run(){return this.execute();}
}
const adapter={prepare:(sql:string)=>new PreparedStatement(sql),async batch(statements:PreparedStatement[]){
  if(isLocal()){const localClient=await local();return localClient.transaction(async(tx:Client)=>{const results=[];for(const s of statements)results.push(await s.execute(tx));return results;});}
  const client=await postgres().connect();try{await client.query('BEGIN');const results=[];for(const s of statements)results.push(await s.execute(client));await client.query('COMMIT');return results;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}};
export function db(){return adapter;}
export async function closeDatabase(){if(pool)await pool.end();if(localDb)await(await localDb).close();}
