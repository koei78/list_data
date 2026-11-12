import {normalize} from './normalize';

// Corrections are tied to the original spelling; raw source records stay intact.
export const verifiedNames=[{
 id:'tky-0a3fb4b928f6415b85c3',
 original:'\uE17Bちゃんの台所',
 name:'梅ちゃんの台所',
 source:'https://www.city.mitaka.lg.jp/c_service/088/attached/attach_88546_2.pdf'
}];
const textFields=new Set(['name','restaurant','restaurant_name','address','kana','municipality','category','operator_name','representative_name','decision_maker_name','decision_maker_role','station','hours','holiday','sales_info']);
export const hasPrivateUse=(text:string)=>/\p{Co}/u.test(text);
export function displayText(text:string){return text.replace(/\p{Co}+/gu,' ');}
export function displayRecord<T>(record:T):T{
 if(!record||typeof record!=='object')return record;
 const output={...record} as Record<string,unknown>;
 let incompleteName=false,correctedNameSource:string|undefined;
 for(const [key,value] of Object.entries(output)){
  if(typeof value!=='string'||!textFields.has(key))continue;
  const isName=['name','restaurant','restaurant_name'].includes(key);
  const correction=isName?verifiedNames.find(item=>item.original===value):undefined;
  if(correction){output[key]=correction.name;correctedNameSource=correction.source;}
  else if(hasPrivateUse(value)){
   const cleaned=displayText(value);
   output[key]=isName?(cleaned.trim()?cleaned:'店名確認中'):cleaned;
   if(isName)incompleteName=true;
  }
 }
 if(incompleteName)output.nameNeedsReview=true;
 if(correctedNameSource)output.nameEvidenceUrl=correctedNameSource;
 return output as T;
}
export function correctedNameMatches(query:string){
 const prefix=normalize(query);
 return verifiedNames.filter(item=>normalize(item.name).startsWith(prefix));
}
