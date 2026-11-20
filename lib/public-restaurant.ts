export function publicRestaurantId(id:string){
 const bytes=new TextEncoder().encode(id);
 let binary='';
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return 'r-'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

export function publicRestaurantPath(id:string){return '/restaurant/'+publicRestaurantId(id);}

export function internalRestaurantId(pathId:string){
 if(!pathId.startsWith('r-'))return pathId;
 try{
  const encoded=pathId.slice(2).replace(/-/g,'+').replace(/_/g,'/');
  const binary=atob(encoded+'='.repeat((4-encoded.length%4)%4));
  const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }catch{return pathId;}
}

type Source={id?:string|null,name?:string|null,url?:string|null,license_url?:string|null};
export function isExcludedPublicSource(source?:Source|null){
 if(!source)return false;
 if(/tabelog|食べログ/i.test(`${source.id||''} ${source.name||''}`))return true;
 return [source.url,source.license_url].some(value=>{
  if(!value)return false;
  try{const host=new URL(value).hostname.toLowerCase();return host==='tabelog.com'||host.endsWith('.tabelog.com');}catch{return false;}
 });
}

export function publicSourceUrl(value?:string|null){
 if(!value)return undefined;
 try{const host=new URL(value).hostname.toLowerCase();if(host==='tabelog.com'||host.endsWith('.tabelog.com'))return undefined;}catch{return undefined;}
 return value;
}
