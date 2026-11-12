import {directoryAreas,areaPath,directoryPages,jsonLd} from '../../lib/directory';
import {ORIGIN} from '../../lib/config';
import {publicMetadata} from '../../lib/seo';
import {Breadcrumb,Title,ScopeNote,formatNumber} from '../components';

export const metadata=publicMetadata('地域別の飲食店一覧｜多摩・島しょ','東京都の多摩・島しょ地域の飲食店を市町村別に探せます。すべての一覧ページへ進み、店舗名・電話番号・住所と出典を確認できます。','/areas');
export default async function Areas(){
 const areas=await directoryAreas();
 const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'地域別の飲食店一覧',item:ORIGIN+'/areas'}]};
 return <><Breadcrumb items={[["地域別の飲食店一覧"]]}/><Title title="地域別の飲食店一覧">市町村と掲載範囲を選んで、店舗名・電話番号・所在地を確認できます。</Title><ScopeNote/>
 <nav className="panel inset area-jump" aria-label="市町村の目次"><h2>市町村を選ぶ</h2><div className="tag-links">{areas.map((a,i)=><a key={a.name} href={'#area-'+i}>{a.name}（{formatNumber(a.n)}）</a>)}</div></nav>
 <div className="directory-index">{areas.map((a,i)=><section className="panel" id={'area-'+i} key={a.name}><div className="section-head"><h2><a href={areaPath(a.name)}>{a.name}の飲食店</a></h2><span className="muted small-text">{formatNumber(a.n)}施設</span></div><nav className="directory-page-links" aria-label={a.name+'の掲載範囲'}>{directoryPages(a.name,a.n).map(p=><a key={p.page} href={p.path}><span>{formatNumber(p.start)}–{formatNumber(p.end)}件</span><small>{p.page}ページ目 →</small></a>)}</nav></section>)}</div>
 <p className="muted">営業先を整理する場合は、<a href="/restaurant-lists">飲食店リストの使い方</a>と<a href="/guides/restaurant-list">リストの作り方</a>もご覧ください。</p>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></>;
}
