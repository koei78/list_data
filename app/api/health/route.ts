export const dynamic='force-dynamic';
import {one} from '../../../lib/db';
export async function GET(){try{await one('SELECT 1 ok');return Response.json({status:'ok',database:'reachable'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'error'},{status:503});}}

