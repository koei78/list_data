import {one} from '../../lib/display-db';
import {Breadcrumb,Title} from '../components';
import {SurveyForm} from '../survey/survey-form';
export const metadata={title:'機能リクエスト・お問い合わせ',robots:{index:false,follow:true}};
export default async function Contact({searchParams}:{searchParams:Promise<{restaurant?:string,type?:string}>}){const q=await searchParams,kind=q.type==='correction'?'correction':q.type==='feature'?'feature':'inquiry',restaurant=q.restaurant?await one('SELECT id,name FROM restaurants WHERE id=? AND deleted=0',[q.restaurant]):null,title=kind==='correction'?'掲載情報の修正・掲載停止':kind==='feature'?'欲しい機能・情報をリクエスト':'サービスについてのお問い合わせ';return <><Breadcrumb items={[[title]]}/><div className="narrow"><Title eyebrow="会員登録不要" title={title}>{kind==='feature'?'「この地域を追加してほしい」「こんな条件で絞り込みたい」など、実際に使う場面とあわせて教えてください。':'ご希望を入力してください。内容を確認し、ご指定の連絡方法で必要な確認・回答を行います。'}</Title>{restaurant&&<div className="notice"><p>対象店舗：<strong>{restaurant.name}</strong></p><p className="small-text">未取得情報の提供や詳細情報の開示をお約束するものではありません。</p></div>}<SurveyForm kind={kind} restaurantId={restaurant?.id}/></div></>;}

