import {publicAreaStats} from '../lib/public-data';
import {areaPath} from '../lib/directory';

export async function FeaturedAreas(){const all=await publicAreaStats();const rows=['三鷹市','武蔵野市','調布市'].map(name=>all.find(r=>r.name===name)).filter(r=>!!r);return <section className="panel inset"><h2>地域の飲食店営業リストを探す</h2><p>対象地域と実際のデータ見本を確認して、地域を指定した無料CSVへ進めます。</p><div className="resource-cards">{rows.map(r=><a key={r.name} href={areaPath(r.name)}><span className="badge">{r.name}</span><h3>{r.name}の飲食店リスト</h3><p>店舗名・住所・電話番号と出典を確認できます。</p><span>見本・収録区分・無料CSVを見る →</span></a>)}</div><p className="resource-bottom"><a href="/reports/restaurant-data">地域ごとの掲載情報を確認</a> ／ <a href="/areas">全地域から探す</a></p></section>;}
