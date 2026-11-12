import {ORIGIN} from './config';
import {publicMetadata} from './seo';
import {safeUrl} from './normalize';

type Store={id:string,name:string,address:string,municipality:string,prefecture:string,phone?:string|null,hours?:string|null,category?:string,postal_code?:string|null,latitude?:number|null,longitude?:number|null,updated_at?:string,indexable?:number,business_status?:string};
const compact=(value:string)=>value.replace(/\s+/g,' ').trim();
const excerpt=(value:string,limit:number)=>{const characters=Array.from(value);return characters.length>limit?characters.slice(0,limit-1).join('')+'…':value;};
export function restaurantSummary(store:Store){return `${store.name}の所在地は${compact(store.address)}です。${store.phone?`電話番号は${store.phone}です。`:'電話番号は未確認です。'}`;}
export function restaurantDescription(store:Store){
 const hours=store.hours?compact(store.hours).split('営業時間・定休日は変更')[0].trim():'';
 const details=[restaurantSummary(store),hours?`営業時間：${excerpt(hours,90)}。`:'', '掲載元の情報と確認状況を掲載。現在の営業状況は店舗の公式情報でもご確認ください。'];
 return excerpt(details.join(''),210);
}
export function restaurantMetadata(store:Store){
 const location=[store.prefecture,store.municipality].filter(value=>value&&value!=='未確認').join('・');
 return {...publicMetadata(`${store.name}（${location}）｜電話番号・住所`,restaurantDescription(store),'/restaurant/'+store.id),robots:{index:!!store.indexable&&store.business_status!=='閉店',follow:true}};
}
export function evidencePageUrl(note:string|undefined,fallback:string|undefined){
 try{const parsed=JSON.parse(note||'{}');const reference=safeUrl(parsed.url);if(reference)return reference;}catch{}
 return safeUrl(fallback||null)||undefined;
}
export function restaurantSchema(store:Store){
 let street=compact(store.address);
 for(const prefix of [store.prefecture,store.municipality])if(prefix&&street.startsWith(prefix))street=street.slice(prefix.length).trim();
 const schema:any={'@context':'https://schema.org','@type':['集団給食','旅館・ホテル','コンビニエンスストア等','複数の許可区分'].includes(store.category||'')?'LocalBusiness':'Restaurant','@id':`${ORIGIN}/restaurant/${store.id}#restaurant`,name:store.name,url:`${ORIGIN}/restaurant/${store.id}`,description:restaurantDescription(store),mainEntityOfPage:{'@id':`${ORIGIN}/restaurant/${store.id}#webpage`},address:{'@type':'PostalAddress',addressCountry:'JP',addressRegion:store.prefecture,addressLocality:store.municipality,streetAddress:street||compact(store.address)}};
 if(store.postal_code)schema.address.postalCode=store.postal_code;
 if(store.phone)schema.telephone=store.phone;
 if(store.latitude!=null&&store.longitude!=null)schema.geo={'@type':'GeoCoordinates',latitude:store.latitude,longitude:store.longitude};
 return schema;
}
export function restaurantWebPage(store:Store,sourceUrl?:string){
 const page:any={'@context':'https://schema.org','@type':'WebPage','@id':`${ORIGIN}/restaurant/${store.id}#webpage`,url:`${ORIGIN}/restaurant/${store.id}`,name:`${store.name}の店舗情報`,description:restaurantDescription(store),inLanguage:'ja',isPartOf:{'@id':ORIGIN+'/#website'},mainEntity:{'@id':`${ORIGIN}/restaurant/${store.id}#restaurant`}};
 if(store.updated_at&&!Number.isNaN(Date.parse(store.updated_at)))page.dateModified=new Date(store.updated_at).toISOString();
 if(sourceUrl)page.citation=sourceUrl;
 return page;
}
