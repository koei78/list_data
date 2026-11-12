import 'server-only';
import {getStore} from '@netlify/blobs';
import {put,get,list,del} from '@vercel/blob';
export function backupStore(){
 if(process.env.VERCEL==='1')return {
  put:async(key:string,data:string)=>{await put(key,data,{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});},
  del:async(key:string)=>{await del(key);},
  get:async(key:string)=>{const object=await get(key,{access:'private',useCache:false});if(!object)return null;if(object.statusCode!==200)throw new Error('Private backup read failed');return {json:async()=>JSON.parse(await new Response(object.stream).text())};},
  keys:async(prefix:string)=>{const keys:string[]=[];let cursor:string|undefined;do{const page=await list({prefix,cursor});keys.push(...page.blobs.map(blob=>blob.pathname));if(!page.hasMore)break;cursor=page.cursor;}while(cursor);return keys;}
 };
 const store=getStore({name:'restaurant-backups',consistency:'strong'});return {put:(key:string,data:string)=>store.set(key,data),del:(key:string)=>store.delete(key),get:async(key:string)=>{const data=await store.get(key,{type:'text'});return data===null?null:{json:async()=>JSON.parse(data)};},keys:async(prefix:string)=>{const keys:string[]=[];for await(const page of store.list({prefix,paginate:true}))keys.push(...page.blobs.map(blob=>blob.key));return keys;}};
}
export async function verifyBackupStore(){const store=backupStore(),key='verification/'+crypto.randomUUID()+'.json',value={test:true,nonce:crypto.randomUUID()};try{await store.put(key,JSON.stringify(value));const object=await store.get(key);if(!object||JSON.stringify(await object.json())!==JSON.stringify(value)||!(await store.keys('verification/')).includes(key))throw new Error('Private backup verification failed');return {privateStorage:true,write:true,read:true,list:true};}finally{await store.del(key);}}
