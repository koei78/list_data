import {viewer} from '../../../../lib/auth';
export async function GET(){const user=await viewer();return Response.json({user:user?{id:user.id,name:user.name,email:user.email}:null},{headers:{'Cache-Control':'private, no-store'}});}
