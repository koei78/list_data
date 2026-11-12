import {FeaturedAreas} from '../featured-areas';
import {SampleCTA} from '../sample-cta';
import {PublicResources} from './../public-resources';

import {directoryAreas,areaPath,jsonLd} from '../../lib/directory';
import {ORIGIN} from '../../lib/config';
import {publicMetadata} from '../../lib/seo';
import {Breadcrumb,Title,ScopeNote} from '../components';

export const metadata=publicMetadata('飲食店リストを無料検索｜東京・神奈川・埼玉・千葉のCSV・Excel出力','東京・神奈川・埼玉・千葉の飲食店リストを店名・電話番号・地域から無料検索。住所と出典を確認し、アンケート回答後は営業先の保存・メモ管理・CSVやExcelへの出力ができます。','/restaurant-lists');
export default async function RestaurantLists(){
 const areas=await directoryAreas();
 const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'飲食店リスト',item:ORIGIN+'/restaurant-lists'}]};
 return <><Breadcrumb items={[["飲食店リスト"]]}/><Title eyebrow="営業先の調査・リスト作成" title="飲食店リストを無料検索・CSV／Excel出力">東京都・神奈川県・埼玉県・千葉県の店舗名・電話番号・住所を確認し、提案先の候補を整理できます。基本情報は登録なしで閲覧できます。</Title>
 <div className="actions-row guide-actions"><a className="button primary" href="/areas">地域から飲食店リストを見る</a><a className="button" href="/guides/restaurant-list">営業リストの作り方を読む</a></div><ScopeNote/><SampleCTA/><FeaturedAreas/>

 <p className="muted small-text">業態の詳細は未確認です。電話番号の掲載は、現在の営業や電話の接続を確認した意味ではありません。</p>
 <section className="panel inset"><h2>この飲食店リストで確認できる情報</h2><div className="table-wrap"><table className="guide-table"><thead><tr><th>情報・機能</th><th>利用できる範囲</th></tr></thead><tbody>
 <tr><th>店舗名・住所・電話番号・業態</th><td>店舗ページで無料公開。取得できていない項目は「未確認」と表示します。</td></tr>
 <tr><th>出典・確認日</th><td>各項目の出典と照合日を確認できます。原本との照合と、現地の営業確認は区別しています。</td></tr>
 <tr><th>候補の保存・営業メモ</th><td>アンケート回答後、自分の営業リストへ追加できます。店舗ごとに進捗とメモを管理できます。</td></tr>
 <tr><th>CSV・Excel出力</th><td>自分の営業リストから出力できます。1ファイル5,000件までで、件数が多い場合は分割されます。</td></tr>
 <tr><th>運営会社・決裁者情報</th><td>申請後、店舗単位で開示を承認します。未取得の情報は承認後も未確認です。</td></tr>
 </tbody></table></div><p className="muted small-text">料金・今後の提供条件は<a href="/plans">料金プラン</a>をご確認ください。現在は決済・料金の請求を行っていません。</p></section>
 <section className="panel"><div className="section-head"><h2>市町村別の飲食店リスト</h2><a href="/areas">全ページの目次 →</a></div><div className="area-links">{areas.map(a=><a key={a.name} href={areaPath(a.name)}>{a.name}<span>一覧を見る →</span></a>)}</div></section>
 <section className="panel inset"><h2>営業リストとして使うまでの流れ</h2><ol className="guide-steps"><li><strong>対象地域を決める。</strong>市町村の一覧、または<a href="/restaurants">飲食店検索</a>で候補を探します。業態の登録区分でも絞り込めます。</li><li><strong>店舗を確認する。</strong>所在地、電話番号、出典、確認日を見て、提案対象か判断します。営業時間などの未確認項目は店舗公式情報等で補います。</li><li><strong>候補を保存する。</strong>アンケートに回答して<a href="/lists">営業リスト</a>を作成し、検索結果の店舗を選んで追加します。</li><li><strong>確認・対応を記録する。</strong>営業ステータスとメモを更新し、必要に応じてCSV・Excelで出力します。</li></ol><a href="/guides/restaurant-list">項目の設計・重複確認・具体的な操作手順を見る →</a></section>
 <section className="panel inset"><h2>飲食店リストを探す・作る・出力する</h2><div className="resource-cards"><a href="/restaurants"><h3>店舗名・電話番号で候補を探す</h3><p>具体的な店舗が決まっている場合は、店名や電話番号から店舗ページへ進み、所在地と出典を確認できます。</p></a><a href="/guides/restaurant-list"><h3>営業リストの作り方を確認する</h3><p>必要項目の設計、情報の確認、重複整理、Excelへの読み込みまで、実際の画面に沿って説明します。</p></a><a href="/templates/sales-list"><h3>無料Excel・CSVテンプレートを使う</h3><p>自分で入力して整理したい場合は、電話番号や出典、次の対応を記入する空のテンプレートを使えます。</p></a></div></section><section className="panel inset"><h2>利用前によくある確認事項</h2><h3>全国や東京23区の飲食店リストもありますか？</h3><p>東京23区を含む東京都・神奈川県・埼玉県・千葉県のデータを収録しています。全国の施設は網羅していません。</p><h3>掲載されていれば営業中ですか？</h3><p>利用者指定のCSVから取り込んだ情報です。閉店・移転・電話番号の変更をすべて追跡したリストではありません。連絡前に営業状況を確認してください。</p><h3>Excelで自分のリストを作れますか？</h3><p>作れます。<a href="/guides/restaurant-list#template">記入用CSVテンプレート</a>をExcel等で開いて使う方法と、アンケートに回答して保存した店舗をExcel形式で出力する方法があります。</p><h3>情報の根拠はどこで確認できますか？</h3><p><a href="/data-sources">データの出典・掲載方針</a>と各店舗ページに、利用した資料・基準日・加工方法を掲載しています。</p></section>
 <div className="guide-byline">運営・編集：株式会社てんかい　公開：2026年10月27日</div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/><PublicResources/></>;
}
