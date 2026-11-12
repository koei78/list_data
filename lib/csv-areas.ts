import 'server-only';
import {all,db} from './db';
import {municipalityFromAddress} from './municipality';
export async function normalizeCsvAreas(sourceId:unknown,after:unknown){
 if(typeof sourceId!=='string'||!sourceId.startsWith('provided-tabelog-')||typeof after!=='string')throw new Error('Invalid source');
 const rows=await all<{id:string,address:string,prefecture:string,municipality:string}>('SELECT id,address,prefecture,municipality FROM restaurants WHERE source_id=? AND id>? ORDER BY id LIMIT 5000',[sourceId,after]);
 const changes=rows.map(row=>({...row,area:municipalityFromAddress(row.address,row.prefecture)})).filter(row=>row.area!==row.municipality);
 if(changes.length)await db().prepare('UPDATE restaurants AS r SET municipality=v.area FROM (VALUES '+changes.map(()=>'(?,?)').join(',')+') AS v(id,area) WHERE r.id=v.id').bind(...changes.flatMap(row=>[row.id,row.area])).run();
 return {scanned:rows.length,changed:changes.length,after:rows.at(-1)?.id||after,done:rows.length<5000};
}
