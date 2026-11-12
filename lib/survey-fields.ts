import {z} from 'zod';
import {normalizePhoneInput} from './phone-tools';
export const SURVEY_PURPOSES=['営業先を探したい','営業リストを作成・出力したい','飲食店向けサービスを提案したい','店舗・運営会社の情報を相談したい','その他'] as const;
export const SURVEY_CONSENT_VERSION='2026-10-27-v2';
export const SURVEY_CONSENT='個人情報の取り扱いを確認し、株式会社てんかいが入力情報を機能の提供・改善、ご要望の確認・回答に利用することに同意します。';
export const MARKETING_CONSENT='株式会社てんかいから、希望する連絡方法で関連サービスの提案・営業の案内を受け取る（任意）';
export const surveySchema=z.object({
 requestKey:z.string().regex(/^[a-f0-9-]{72}$/),
 kind:z.enum(['list','inquiry','correction','feature']),
 company:z.string().trim().min(1).max(200),name:z.string().trim().min(1).max(100),
 email:z.string().trim().email().max(254),phone:z.string().trim().max(80).default(''),
 purpose:z.enum(SURVEY_PURPOSES),message:z.string().trim().max(2000).default(''),
 preferredContact:z.enum(['メール','電話','不要']),restaurantId:z.string().max(120).optional(),
 marketingConsent:z.boolean().default(false),
 consent:z.literal(true),website:z.string().max(0).default(''),
}).superRefine((v,c)=>{if((v.preferredContact==='電話'||v.phone)&&!normalizePhoneInput(v.phone))c.addIssue({code:'custom',path:['phone'],message:'電話番号をご確認ください。'});if(v.kind!=='list'&&v.message.length<10)c.addIssue({code:'custom',path:['message'],message:'ご希望の内容を10文字以上でご記入ください。'});if(v.marketingConsent&&(v.preferredContact==='不要'||v.kind==='correction'))c.addIssue({code:'custom',path:['marketingConsent'],message:'連絡の設定をご確認ください。'});});
export type SurveyInput=z.infer<typeof surveySchema>;
export function surveyReturnTo(value:unknown){if(typeof value!=='string')return '/lists';try{const u=new URL(value,'https://local.invalid');return u.origin==='https://local.invalid'&&(/^\/(lists|restaurants|mypage)(\/|$)/.test(u.pathname)||/^\/restaurant\/[a-zA-Z0-9-]+$/.test(u.pathname))?u.pathname+u.search:'/lists';}catch{return '/lists';}}
export const surveyPath=(next='/lists')=>'/survey?next='+encodeURIComponent(surveyReturnTo(next));
