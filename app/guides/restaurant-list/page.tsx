import {WorkedExample} from './worked-example';
import {PublicResources} from './../../public-resources';
import {SampleCTA} from '../../sample-cta';
import {Breadcrumb,Title} from '../../components';
import {publicMetadata} from '../../../lib/seo';
import {ORIGIN} from '../../../lib/config';
import {jsonLd} from '../../../lib/directory';

const title='飲食店の営業リストの作り方｜必要項目・Excel用テンプレート・管理手順';
const description='飲食店の営業リストを作る手順を解説。対象地域の決め方、店名・電話番号・出典などの項目、重複確認、営業メモの残し方と、このサイトの操作手順を紹介します。記入用CSVテンプレート付き。';
export const metadata=publicMetadata(title,description,'/guides/restaurant-list');
const fields=[
 ['店舗ID・店舗ページURL','店名が同じ施設を区別し、元情報へ戻れるようにする。'],
 ['店舗名・市町村・住所','チェーン名だけでまとめず、支店名と所在地まで確認する。'],
 ['電話番号','先頭の0を保持するため、表計算ソフトでは文字列として扱う。未確認なら推測せず空欄にする。'],
 ['業態・対象理由','一般飲食店、ホテル、給食などを区別し、自社の提案対象に含めた理由を記録する。'],
 ['出典URL・情報確認日','情報を取得した場所と確認した日を残す。営業確認日と台帳の基準日は分ける。'],
 ['営業状況・連絡前の確認事項','営業中か、移転していないか、適切な窓口かなどを確認する。分からないものは未確認にする。'],
 ['営業ステータス・最終連絡日・次の対応日','誰に何を伝え、次に何をするかを整理する。断りや連絡不要の意思があった場合も記録する。'],
 ['営業メモ','確認できた事実と自分の仮説を分け、対応の重複を防ぐ。'],
];
export default function ListGuide(){
 const schema={'@context':'https://schema.org','@graph':[
 {'@type':'Article',headline:title,description,datePublished:'2026-10-27',dateModified:'2026-10-28',inLanguage:'ja',mainEntityOfPage:ORIGIN+'/guides/restaurant-list',author:{'@type':'Organization',name:'株式会社てんかい',url:ORIGIN+'/'},publisher:{'@id':ORIGIN+'/#publisher','@type':'Organization',name:'株式会社てんかい',url:ORIGIN+'/'}},
 {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'トップ',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'飲食店リスト',item:ORIGIN+'/restaurant-lists'},{'@type':'ListItem',position:3,name:'営業リストの作り方',item:ORIGIN+'/guides/restaurant-list'}]}
 ]};
 return <><Breadcrumb items={[["飲食店リスト","/restaurant-lists"],["営業リストの作り方"]]}/><Title eyebrow="飲食店向け営業の準備" title="飲食店の営業リストの作り方">候補を集めるところから、情報の確認・重複整理・対応記録まで。Excel等で作る方法と、このサイトで作る方法を説明します。</Title>
 <p className="guide-byline">編集：株式会社てんかい　公開：2026年10月27日 ／ 更新：2026年10月28日</p>
 <SampleCTA/>
 <div className="guide-layout"><nav className="panel inset guide-toc" aria-label="記事の目次"><h2>この記事の内容</h2><a href="#purpose">1. 対象を決める</a><a href="#collect">2. 候補を集める</a><a href="#fields">3. 項目をそろえる</a><a href="#verify">4. 情報・重複を確認する</a><a href="#manage">5. 営業の進捗を管理する</a><a href="#site-steps">このサイトでの作り方</a><a href="#template">CSVテンプレート</a><a href="#worked-example">三鷹市の記入例</a><a href="#excel-import">Excelへの読み込み</a><a href="#duplicate-example">重複整理の判断例</a></nav>
 <article className="panel guide-article">
 <p className="guide-lead">飲食店の営業リストは、提案先の店舗と、確認した情報・次の対応をまとめた一覧です。最初に対象地域と業態を決め、店名・所在地・電話番号に加えて出典と確認日をそろえると、候補を選び直したり情報を更新したりしやすくなります。</p>
 <section id="purpose"><h2>1. 提案する相手と対象地域を決める</h2><p>まず「何を、どのような店舗へ提案するか」を一文にします。地域、施設の種類、提案との関係を決めてから探すと、対象外の店舗を集め続けることを防げます。</p><div className="guide-example"><strong>条件の決め方の例</strong><p>「自社の訪問可能な地域にある一般飲食店を候補とし、店舗の公式情報で提案との関係を確認してから連絡する」。配達範囲が限られるサービスなら地域を先に絞り、ホテルや給食施設を対象に含めるかも決めます。</p></div><p>このサイトの「業態」は許可台帳に基づく区分です。「一般飲食店」を選んでも、和食・居酒屋・カフェといった料理ジャンルまでは確定しません。必要な条件は追加で確認します。</p></section>
 <section id="collect"><h2>2. 候補店舗を集める方法を選ぶ</h2><div className="table-wrap"><table className="guide-table"><thead><tr><th>方法</th><th>使いどころ</th><th>確認すること</th></tr></thead><tbody><tr><th>店舗の公式サイト等から手作業で整理</th><td>候補が少なく、個別の情報を詳しく確認したい場合。</td><td>同名店・支店の違い、掲載日の古さ、情報の利用条件。</td></tr><tr><th>自治体等の公開データから整理</th><td>地域の許可施設を一定の基準で把握したい場合。</td><td>対象地域・基準日・許可区分・利用条件。営業許可の記録を、現在営業中の証明にしない。</td></tr><tr><th>店舗検索・リスト作成サービスを使う</th><td>条件検索や保存、対応管理をまとめて行いたい場合。</td><td>収録範囲、欠損項目、更新方法、出力できる項目、提供条件。</td></tr></tbody></table></div><p>このサイトは公的な許可台帳を加工した<a href="/restaurant-lists">東京都の飲食店リスト</a>を提供しています。現在の収録範囲は多摩・島しょ地域で、23区・八王子市・町田市・他県は含みません。取得元と基準日は<a href="/data-sources">データの出典</a>で確認できます。</p></section>
 <section id="fields"><h2>3. リストの項目をそろえる</h2><p>Excelやスプレッドシートでは、1行を1施設、1列を1項目にします。会社単位で管理したい場合も、店舗の一覧と運営会社の情報を混同しないようにします。</p><div className="table-wrap"><table className="guide-table"><thead><tr><th>項目</th><th>記録のポイント</th></tr></thead><tbody>{fields.map(([name,point])=><tr key={name}><th>{name}</th><td>{point}</td></tr>)}</tbody></table></div><p>最初から埋められない項目があっても構いません。「未確認」と、確認の結果「対象外」になったものを区別して残します。</p></section>
 <section id="verify"><h2>4. 情報の鮮度と重複を確認する</h2><ol className="guide-steps"><li><strong>同名店を区別する。</strong>店舗名だけで重複と判断せず、市町村・住所・支店名を照合します。同じ電話番号が複数施設で使われる場合も、番号だけで統合しません。</li><li><strong>連絡先と営業状況を確認する。</strong>台帳の電話番号が現在も使われているとは限りません。店舗の公式情報等を確認し、確認日と根拠を残します。</li><li><strong>日付の意味を分ける。</strong>営業許可日、開業日、資料の基準日、情報を確認した日は別の項目です。許可日だけで新規開店と決めつけません。</li><li><strong>連絡済みの記録と照合する。</strong>既存顧客や連絡不要の記録を先に確認し、担当者間の重複連絡を防ぎます。</li></ol></section>
 <section id="manage"><h2>5. 営業の進捗と次の対応を管理する</h2><p>候補を保存した後は「未接触」「アプローチ済み」「商談予定」「商談済み」「成約」「失注」など、チーム内で意味をそろえた状態で管理します。最終連絡日と次に行うことを残すと、一覧を見た人が対応を引き継ぎやすくなります。</p><div className="guide-example"><strong>メモの書き方の例（架空の例）</strong><p>「10月27日：公式ページで所在地を確認。営業時間は未確認。次の対応：訪問前に受付窓口と連絡可能時間を確認する。」</p></div><p>連絡不要と伝えられた店舗は、対象から外すことが分かるよう記録します。更新の頻度は営業活動に合わせて決め、古い情報をそのまま引き継がないようにします。</p></section>
 <section id="site-steps"><h2>このサイトで飲食店リストを作る手順</h2><ol className="guide-steps"><li><strong>地域と店舗を調べる。</strong><a href="/areas">地域別一覧</a>または<a href="/restaurants">飲食店検索</a>を開きます。検索では店名・電話番号・市町村・業態を指定できます。</li><li><strong>アンケートに回答してリストを作る。</strong><a href="/lists">営業リスト管理</a>で、アンケート回答後に名前を入力して「リストを作成」を押します。例：「三鷹市・提案候補」。</li><li><strong>検索結果から追加する。</strong>飲食店検索で店舗をチェックし、「追加先リスト」を選んで「リストに追加」を押します。全選択は表示中のページの店舗が対象です。続きのページはページを進めて追加します。</li><li><strong>ステータスとメモを更新する。</strong>営業リスト管理で店舗ごとに編集します。同じ店舗IDを同じリストへ重複して追加することはありません。</li><li><strong>必要なら出力する。</strong>自分のリストの「CSV」または「Excel」を選びます。1ファイル5,000件までで、出力時の閲覧権限に応じて項目が含まれます。</li></ol><p className="muted">運営会社・決裁者情報は店舗単位の開示承認が必要です。情報が取得されていない場合は、承認後も未確認です。営業時間・駅・開業日など未取得の項目に検索条件を指定すると、候補が出なくなる場合があります。</p></section>
 <section id="template"><h2>Excel等で使える記入用CSVテンプレート</h2><p>店舗名・住所・電話番号・出典URL・確認日・営業ステータスなどの列を用意した空のテンプレートです。登録なしでダウンロードできます。店舗データは含みません。</p><a className="button primary" href="/templates/restaurant-sales-list.csv" download>記入用CSVテンプレートをダウンロード</a><p className="muted small-text">ExcelではCSVのインポート時に電話番号・店舗IDの列を文字列に指定すると、先頭の0等を保持できます。列の型を指定せず開くと、数字が変換される場合があります。独自管理用の列を含むため、本サイトへの取り込み用ファイルではありません。</p></section>
 <section><h2>まずは対象地域の候補を確認する</h2><p>条件に合う施設が含まれるか、出典や未確認項目を確認してからリストに保存してください。</p><div className="actions-row"><a className="button primary" href="/areas">地域別の飲食店一覧へ</a><a className="button" href="/restaurant-lists">収録範囲・利用できる機能を見る</a></div></section>
 <WorkedExample/></article></div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/><PublicResources/></>;
}
