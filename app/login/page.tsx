import {Breadcrumb,Title} from '../components';
import {LoginForm} from '../auth-client';
import {safeReturnTo} from '../auth-paths';
export const metadata={title:'管理者・既存アカウントのログイン',robots:{index:false,follow:false}};
export default async function Login({searchParams}:{searchParams:Promise<{return_to?:string}>}){const q=await searchParams;return <><Breadcrumb items={[["管理者・既存アカウントのログイン"]]}/><div className="narrow"><Title title="管理者・既存アカウントのログイン">営業リストの利用は、会員登録不要のアンケートから開始できます。こちらは管理者と既存アカウント向けです。</Title><p><a href="/survey">アンケートに回答して利用する →</a></p><section className="panel inset"><LoginForm returnTo={safeReturnTo(q.return_to||'/mypage')}/></section></div></>;}
