import {surveyPath} from '../lib/survey-fields';
export function SurveyGate({path='/lists'}:{path?:string}){return <section className="gate panel"><span className="badge">会員登録不要</span><h1>簡単なアンケートで利用を開始</h1><p>利用目的などをご回答いただくと、<br/>営業リストの作成・CSV・Excel出力を使えます。</p><a className="button primary" href={surveyPath(path)}>アンケートに答えて使う →</a><p className="muted small-text">電話番号の入力・サービス案内の受け取りは任意です。<br/>店舗の検索・基本情報は、回答前でも閲覧できます。</p></section>;}

