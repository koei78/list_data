import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {importCsvBatch,verifyCsvImport} from '../lib/csv-import';
import {closeDatabase} from '../lib/database-driver';
const directory=await fs.mkdtemp(path.resolve('work/csv-import-test-'));
process.env.NETLIFY_LOCAL_DB='1';process.env.LOCAL_PG_PATH=directory;
const local=await PGlite.create(directory);
for(const name of (await fs.readdir('netlify/database/migrations')).filter(name=>name.endsWith('.sql')).sort())await local.exec(await fs.readFile('netlify/database/migrations/'+name,'utf8'));
await local.close();
const source={id:'csv-test',name:'Test source',url:'https://example.test',license:'Test',license_url:'https://example.test',scope:'Local test only'};
const record={id:'csv-test-store',name:'テスト店舗',address:'東京都新宿区1',prefecture:'東京都',municipality:'新宿区',category:'飲食店',phone:'0312345678',hours:'営業時間\n原文',business_status:'未確認',verification:'未確認'};
const rows=[{rowNumber:1,raw:{name:'テスト店舗',note:'引用符"と改行\n',phone:'03-1234-5678'},record,issues:[]},{rowNumber:2,raw:{name:'',note:'欠損行も保存'},record:null,issues:['Missing name']},{rowNumber:3,raw:{name:'テスト店舗',note:'同じ店舗の別の原本行'},record,issues:[]}];
try{
 const result=await importCsvBatch({source,rows});assert.equal(result.staged,3);assert.equal(result.stores,1);
 const proof=createHash('sha256').update(rows.map(row=>`${row.rowNumber}:${createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(row.raw).sort().map(key=>[key,(row.raw as any)[key]])))).digest('hex')}\n`).join('')).digest('hex');
 assert.equal(result.sha256,proof);
 await importCsvBatch({source,rows});const verified=await verifyCsvImport(source.id);
 assert.equal(verified.sourceRows,3);assert.equal(verified.stores,1);assert.equal(verified.unusableRows,1);assert.equal(verified.sha256,proof);
 await assert.rejects(importCsvBatch({source,rows:[{...rows[0],record:{...record,phone:'invalid'}}]}));
 assert.equal((await verifyCsvImport(source.id)).sha256,proof);
 console.log('PASS raw rows, invalid rows, duplicate stores, idempotency, checksums and invalid phone rejection');
}finally{await closeDatabase();if(directory.startsWith(path.resolve('work')+path.sep))await fs.rm(directory,{recursive:true,force:true});}
