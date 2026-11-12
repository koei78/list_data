import {directoryAreas,areaPath,jsonLd} from '../../lib/directory';
import {ORIGIN} from '../../lib/config';
import {publicMetadata} from '../../lib/seo';
import {Breadcrumb,Title,ScopeNote} from '../components';

export const metadata=publicMetadata('地域別の飲食店一覧｜東京・神奈川・埼玉・千葉','東京都の東京・神奈川・埼玉・千葉の飲食店を市町村別に探せます。すべての一覧ページへ進み、店舗名・電話番号・住所と出典を確認できます。','/areas');
export default async function Areas(){
 const areas=await directoryAreas();
 const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'地域別の飲食店一覧',item:ORIGIN+'/areas'}]};
 return <><Breadcrumb items={[["地域別の飲食店一覧"]]}/><Title title="地域別の飲食店一覧">市町村と掲載範囲を選んで、店舗名・電話番号・所在地を確認できます。</Title><ScopeNote/>
 <section className="panel inset"><h2>市町村を選ぶ</h2><nav className="area-links" aria-label="市町村の目次">{areas.map(a=><a key={a.name} href={areaPath(a.name)}>{a.name}<span>一覧を見る →</span></a>)}</nav></section>
 <p className="muted">営業先を整理する場合は、<a href="/restaurant-lists">飲食店リストの使い方</a>と<a href="/guides/restaurant-list">リストの作り方</a>もご覧ください。</p>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></>;
}
