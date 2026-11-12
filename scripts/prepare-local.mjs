import fs from 'node:fs/promises';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
const location=process.env.LOCAL_PG_PATH||'./work/local-postgres';
await fs.mkdir(path.dirname(location),{recursive:true});
const db=await PGlite.create(location);
await db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name text PRIMARY KEY)');
const folder='netlify/database/migrations';
for(const name of (await fs.readdir(folder)).filter(n=>n.endsWith('.sql')).sort()){
  if((await db.query('SELECT 1 FROM local_migrations WHERE name=$1',[name])).rows.length)continue;
  await db.transaction(async tx=>{await tx.exec(await fs.readFile(path.join(folder,name),'utf8'));await tx.query('INSERT INTO local_migrations VALUES($1)',[name]);});
  console.log('Applied '+name);
}
await db.close();
console.log('Local PostgreSQL schema ready');
