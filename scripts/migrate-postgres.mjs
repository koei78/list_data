import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Client} from 'pg';

const connectionString=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL;
if(!connectionString)throw new Error('DATABASE_URL is required for database migrations');
const client=new Client({connectionString,connectionTimeoutMillis:15000});
try{
  await client.connect();
  await client.query("SELECT pg_advisory_lock(821341755)");
  await client.query('CREATE TABLE IF NOT EXISTS app_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const folder=path.join(import.meta.dirname,'../netlify/database/migrations');
  for(const name of (await fs.readdir(folder)).filter(n=>n.endsWith('.sql')).sort()){
    const sql=await fs.readFile(path.join(folder,name),'utf8');
    const hash=createHash('sha256').update(sql).digest('hex');
    const {rows}=await client.query('SELECT sha256 FROM app_migrations WHERE name=$1',[name]);
    if(rows.length){if(rows[0].sha256!==hash)throw new Error('Applied migration changed: '+name);continue;}
    await client.query('BEGIN');
    try{
      await client.query(sql);
      await client.query('INSERT INTO app_migrations(name,sha256) VALUES($1,$2)',[name,hash]);
      await client.query('COMMIT');
      console.log('Applied '+name);
    }catch(error){await client.query('ROLLBACK');throw error;}
  }
  console.log('PostgreSQL schema ready');
}catch(error){
  console.error('Database migration failed:',error.code||error.name);
  process.exitCode=1;
}finally{await client.end();}
