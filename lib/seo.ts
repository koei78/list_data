import type {Metadata} from 'next';
import {ORIGIN,SITE_NAME} from './config';

export const HOME_TITLE=`${SITE_NAME}｜店名・電話番号・地域で検索`;
export const SITE_DESCRIPTION='東京都・神奈川県・埼玉県・千葉県の飲食店を店名・電話番号・地域から検索。住所・営業時間・情報の出典を確認できます。基本情報は登録なしで閲覧できます。';

export function publicMetadata(title:string,description:string,path:string,home=false):Metadata{
  const fullTitle=home?title:`${title} | ${SITE_NAME}`;
  const url=new URL(path,ORIGIN).href;
  return {
    title:{absolute:fullTitle},description,alternates:{canonical:url},
    openGraph:{type:'website',locale:'ja_JP',siteName:SITE_NAME,title:fullTitle,description,url},
    twitter:{card:'summary',title:fullTitle,description},
  };
}

export const websiteSchema={
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'WebSite','@id':ORIGIN+'/#website',url:ORIGIN+'/',name:SITE_NAME,inLanguage:'ja',publisher:{'@id':ORIGIN+'/#publisher'}},
    {'@type':'Organization','@id':ORIGIN+'/#publisher',name:'株式会社てんかい',url:ORIGIN+'/'},
  ],
};
