import {EntrySource} from './growth-client';
import {env} from '../lib/runtime';
import type {Metadata} from 'next';
import {Database,UserRound} from 'lucide-react';
import {workspaceViewer} from '../lib/survey';
import {ORIGIN,SITE_NAME} from '../lib/config';
import {SITE_DESCRIPTION} from '../lib/seo';
import {signInPath} from './auth-paths';
import {AuthBridge} from './auth-client';
import './globals.css';
import './growth.css';
export const dynamic='force-dynamic';
export function generateMetadata():Metadata{return {metadataBase:new URL(ORIGIN),title:{default:SITE_NAME,template:`%s | ${SITE_NAME}`},description:SITE_DESCRIPTION,applicationName:SITE_NAME,openGraph:{siteName:SITE_NAME,locale:'ja_JP',type:'website'},icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'}]},verification:env.GOOGLE_SITE_VERIFICATION?{google:env.GOOGLE_SITE_VERIFICATION}:undefined};}
export default async function Layout({children}:{children:React.ReactNode}){const user=await workspaceViewer();return <html lang="ja"><body><EntrySource/><a href="#main" className="skip-link">本文へ</a><header className="site-header"><div className="header-inner"><a className="brand" href="/"><Database size={26}/><span>東京飲食店<span className="brand-sub">データベース</span></span></a><nav aria-label="メインナビゲーション"><a href="/restaurants">飲食店検索</a><a href="/decision-makers">決裁者検索</a><a href="/lists">営業リスト</a><a href="/plans">料金プラン</a>{user?.role==='admin'&&<a href="/admin">管理画面</a>}</nav><div className="header-actions">{user?.role==='survey'?<a href="/lists">営業リストを開く</a>:user?<a className="account-link" href="/mypage"><UserRound size={16}/> マイページ</a>:<a href="/survey">アンケートで利用開始</a>}<a className="button primary small" href="/sample-list">無料サンプル</a></div></div></header><main id="main" className="container"><AuthBridge>{children}</AuthBridge></main><footer><div className="footer-inner"><div><strong>東京飲食店データベース</strong><p>出典を確かめながら、次の営業先を見つける。株式会社てんかい</p></div><nav><a href="/restaurant-lists">飲食店リスト</a><a href="/guides/restaurant-list">リストの作り方</a><a href="/areas">地域別の飲食店一覧</a><a href="/phone-search">電話番号検索</a><a href="/templates/sales-list">無料Excelテンプレート</a><a href="/tools/phone-cleaner">番号の重複チェック</a><a href="/reports/restaurant-data">市町村別データ調査</a><a href="/data-sources">データの出典</a><a href="/contact?type=correction">掲載情報の修正</a><a href="/contact?type=feature">機能・掲載情報のリクエスト</a><a href="/contact">お問い合わせ</a><a href="/privacy">プライバシー</a><a href="/login">管理者・既存アカウント</a><a href="/terms">利用条件</a></nav></div><div className="footer-bottom">飲食店の基本情報は無料で公開しています。情報の最新性・網羅性を保証するものではありません。</div></footer></body></html>;}


