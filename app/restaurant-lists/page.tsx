import {FeaturedAreas} from '../featured-areas';
import {SampleCTA} from '../sample-cta';
import {PublicResources} from './../public-resources';
import {one} from '../../lib/display-db';
import {directoryAreas,areaPath,DIRECTORY_VISIBLE,jsonLd} from '../../lib/directory';
import {ORIGIN} from '../../lib/config';
import {publicMetadata} from '../../lib/seo';
import {Breadcrumb,Title,ScopeNote,formatNumber} from '../components';

export const metadata=publicMetadata('東京都の飲食店リスト｜無料検索・電話番号・CSV・Excel出力','東京都の多摩・島しょ地域の飲食店リスト。公的な許可台帳をもとに店名・電話番号・住所を無料で確認。アンケート回答後は候補の保存、営業メモ、CSV・Excel出力を利用できます。','/restaurant-lists');
export default async function RestaurantLists(){
 const [stats,areas]=await Promise.all([one<{n:number,phones:number}>(`SELECT count(*) n,sum(CASE WHEN phone IS NOT NULL AND phone<>'' THEN 1 ELSE 0 END) phones FROM restaurants WHERE ${DIRECTORY_VISIBLE}`),directoryAreas()]);
 const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'東京都の飲食店リスト',item:ORIGIN+'/restaurant-lists'}]};
 return <><Breadcrumb items={[["東京都の飲食店リスト"]]}/><Title eyebrow="営業先の調査・リスト作成" title="東京都の飲食店リスト">店名・電話番号・住所を確認し、提案先の候補を整理できます。基本情報は登録なしで閲覧できます。</Title>
 <div className="actions-row guide-actions"><a className="button primary" href="/areas">地域から飲食店リストを見る</a><a className="button" href="/guides/restaurant-list">営業リストの作り方を読む</a></div><ScopeNote/><SampleCTA/><FeaturedAreas/>
 <div className="list-metrics"><div><strong>{formatNumber(stats?.n||0)}</strong><span>掲載施設</span></div><div><strong>{formatNumber(stats?.phones||0)}</strong><span>電話番号のある施設</span></div><div><strong>{areas.length}</strong><span>市町村</span></div></div>
 <p className="muted small-text">件数は現在の公開対象施設から集計。飲食店営業の許可施設には給食・ホテル等も含まれます。電話番号の掲載は、現在の営業や電話の接続を確認した意味ではありません。</p>
 <section className="panel inset"><h2>この飲食店リストで確認できる情報</h2><div className="table-wrap"><table className="guide-table"><thead><tr><th>情報・機能</th><th>利用できる範囲</th></tr></thead><tbody>
 <tr><th>店舗名・住所・電話番号・業態</th><td>店舗ページで無料公開。取得できていない項目は「未確認」と表示します。</td></tr>
 <tr><th>出典・確認日</th><td>各項目の出典と照合日を確認できます。台帳との照合と、現地の営業確認は区別しています。</td></tr>
 <tr><th>候補の保存・営業メモ</th><td>アンケート回答後、自分の営業リストへ追加できます。店舗ごとに進捗とメモを管理できます。</td></tr>
 <tr><th>CSV・Excel出力</th><td>自分の営業リストから出力できます。1ファイル5,000件までで、件数が多い場合は分割されます。</td></tr>
 <tr><th>運営会社・決裁者情報</th><td>申請後、店舗単位で開示を承認します。未取得の情報は承認後も未確認です。</td></tr>
 </tbody></table></div><p className="muted small-text">料金・今後の提供条件は<a href="/plans">料金プラン</a>をご確認ください。現在は決済・料金の請求を行っていません。</p></section>
 <section className="panel"><div className="section-head"><h2>市町村別の飲食店リスト</h2><a href="/areas">全ページの目次 →</a></div><div className="area-links">{areas.map(a=><a key={a.name} href={areaPath(a.name)}>{a.name}<span>{formatNumber(a.n)}施設 →</span></a>)}</div></section>
 <section className="panel inset"><h2>営業リストとして使うまでの流れ</h2><ol className="guide-steps"><li><strong>対象地域を決める。</strong>市町村の一覧、または<a href="/restaurants">飲食店検索</a>で候補を探します。業態「一般飲食店」などの区分で絞り込めます。</li><li><strong>店舗を確認する。</strong>所在地、電話番号、出典、確認日を見て、提案対象か判断します。営業時間などの未確認項目は店舗公式情報等で補います。</li><li><strong>候補を保存する。</strong>アンケートに回答して<a href="/lists">営業リスト</a>を作成し、検索結果の店舗を選んで追加します。</li><li><strong>確認・対応を記録する。</strong>営業ステータスとメモを更新し、必要に応じてCSV・Excelで出力します。</li></ol><a href="/guides/restaurant-list">項目の設計・重複確認・具体的な操作手順を見る →</a></section>
 <section className="panel inset"><h2>利用前によくある確認事項</h2><h3>全国や東京23区の飲食店リストもありますか？</h3><p>現時点ではありません。対象は東京都の多摩地域（八王子市・町田市を除く）と島しょ地域です。</p><h3>掲載されていれば営業中ですか？</h3><p>掲載の根拠は公的な許可台帳です。閉店・移転・電話番号の変更をすべて追跡したリストではありません。連絡前に営業状況を確認してください。</p><h3>Excelで自分のリストを作れますか？</h3><p>作れます。<a href="/guides/restaurant-list#template">記入用CSVテンプレート</a>をExcel等で開いて使う方法と、アンケートに回答して保存した店舗をExcel形式で出力する方法があります。</p><h3>情報の根拠はどこで確認できますか？</h3><p><a href="/data-sources">データの出典・掲載方針</a>と各店舗ページに、利用した資料・基準日・加工方法を掲載しています。</p></section>
 <div className="guide-byline">運営・編集：株式会社てんかい　公開：2026年10月27日</div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/><PublicResources/></>;
}
