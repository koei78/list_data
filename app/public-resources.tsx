export const resources=[
  {path:'/reports/restaurant-data',label:'市町村別の飲食店データ調査',tag:'独自集計・無料CSV',text:'施設数・電話番号掲載率・台帳区分を地域ごとに比較。'},
  {path:'/sample-list',label:'飲食店リストの無料サンプルCSV',tag:'店舗データ・最大30件',text:'掲載中の多摩・島しょ地域を選び、店名・住所・電話番号・出典をその場で保存。'},
  {path:'/phone-search',label:'電話番号から店舗を探す',tag:'電話番号検索',text:'番号のハイフン・全角半角をそろえて、掲載施設の名前と住所を確認。'},
  {path:'/templates/sales-list',label:'営業リストの無料テンプレート',tag:'Excel・CSV',text:'電話番号の0を保持し、営業状況を選べる記入用ファイル。'},
  {path:'/tools/phone-cleaner',label:'電話番号の整理・重複チェック',tag:'無料ツール',text:'貼り付けるだけで表記をそろえ、重複する番号を確認。'},
];
export function PublicResources({exclude}:{exclude?:string}){return <section className="panel inset"><h2>飲食店リスト作成に使える無料サンプル・ツール</h2><div className="resource-cards tool-cards">{resources.filter(r=>r.path!==exclude).map(r=><a key={r.path} href={r.path}><span className="badge">{r.tag}</span><h3>{r.label}</h3><p>{r.text}</p><span>開く →</span></a>)}</div><p className="resource-bottom"><a href="/guides/restaurant-list">飲食店の営業リストの作り方</a>　<a href="/areas">地域別の飲食店一覧</a></p></section>;}
