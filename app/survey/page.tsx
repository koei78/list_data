import {Breadcrumb,Title} from '../components';
import {SurveyForm} from './survey-form';
import {surveyReturnTo} from '../../lib/survey-fields';
import {workspaceViewer} from '../../lib/survey';
export const metadata={title:'利用前の簡単アンケート',robots:{index:false,follow:true}};
export default async function Survey({searchParams}:{searchParams:Promise<{next?:string}>}){const q=await searchParams,next=surveyReturnTo(q.next),actor=await workspaceViewer();return <><Breadcrumb items={[["利用アンケート"]]}/><div className="narrow"><Title eyebrow="会員登録不要" title="簡単なアンケートで、利用を開始">営業リストの作成・CSV・Excel出力をご利用いただけます。電話番号とサービス案内の受け取りは任意です。</Title><ol className="survey-steps"><li>アンケートに回答</li><li>機能を利用</li><li>候補を保存・出力</li></ol>{actor&&<div className="notice"><p>このブラウザーでは利用できる状態です。<a href={next}>機能へ進む →</a></p></div>}<SurveyForm next={next}/></div></>;}
