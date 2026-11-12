// Stop at the administrative prefix, before street numbers or building names.
export function municipalityFromAddress(address:string,prefecture:string){
 let rest=address.normalize('NFKC').replace(/[\u200b-\u200f\u2060\ufeff]/g,'').trim();
 for(let i=0;i<3&&rest.startsWith(prefecture);i++)rest=rest.slice(prefecture.length).trim();
 const county=rest.match(/^([^\s\d-]+?郡[^\s\d-]+?[町村])/);
 if(county)return county[1];
 return rest.match(/^([^\s\d-]+?[市区])/)?.[1]||rest.match(/^([^\s\d-]+?[町村])/)?.[1]||'未確認';
}
