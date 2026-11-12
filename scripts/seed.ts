// Run with: node --conditions=react-server --import=tsx scripts/seed.ts <NDJSON> <source.json>
import fs from 'node:fs/promises';
import {importRecords} from '../lib/import';
import {closeDatabase} from '../lib/database-driver';
const [input,sourceFile]=process.argv.slice(2);
if(!input||!sourceFile)throw new Error('Specify licensed NDJSON and source metadata paths');
const source=JSON.parse(await fs.readFile(sourceFile,'utf8'));
const rows=(await fs.readFile(input,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
let accepted=0,rejected=0;
try{for(let i=0;i<rows.length;i+=100){const result=await importRecords(rows.slice(i,i+100),source,'system:netlify-migration');accepted+=result.accepted;rejected+=result.rejected;if(result.rejected)throw new Error(JSON.stringify(result.errors));if(i%2000===0)console.log('Imported '+accepted+' / '+rows.length);}console.log(JSON.stringify({accepted,rejected}));}finally{await closeDatabase();}
