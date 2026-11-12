import {areaDetail,phoneRate,samplePath} from '../lib/public-data';
import {formatNumber} from './components';
import {safeUrl} from '../lib/normalize';

export async function AreaListDetails({name,total,phones}:{name:string,total:number,phones:number}){
 const {sources,categories,preview}=await areaDetail(name);
 return <section className="panel inset area-list-details" id="list-download"><h2>{name}の営業用飲食店リストを確認する</h2>
 <div className="list-metrics"><div><strong>{formatNumber(total)}</strong><span>公開対象の許可施設</span></div><div><strong>{formatNumber(phones)}</strong><span>電話番号のある施設</span></div><div><strong>{phoneRate(phones,total)}%</strong><span>電話番号掲載率</span></div></div>
 {phones>0&&<p><a className="button primary" href={samplePath(name)}>{name}の無料CSVを取得 →</a></p>}
 <p>食品・備品の提案先や、訪問営業の候補をこの地域から探せます。まず「一般飲食店」を選び、給食施設・ホテルなどを含めるかを判断してください。施設数は営業中の飲食店数ではなく、許可台帳を整理した公開対象の数です。</p>
 <div className="table-wrap"><table className="guide-table"><caption>{name}の許可台帳区分と電話番号の掲載状況</caption><thead><tr><th>許可台帳の区分</th><th>施設数</th><th>電話番号あり</th><th>サンプル</th></tr></thead><tbody>{categories.map(c=><tr key={c.name}><th>{c.name||'未分類'}</th><td>{formatNumber(c.n)}</td><td>{formatNumber(c.phones||0)}</td><td>{c.phones>0?<a href={samplePath(name,c.name)}>この条件で取得</a>:'対象なし'}</td></tr>)}</tbody></table></div>
 {preview.length>0&&<><h3>{name}のリスト見本（公開情報から3件）</h3><div className="table-wrap"><table className="guide-table"><thead><tr><th>店舗名</th><th>住所</th><th>電話番号</th></tr></thead><tbody>{preview.map(r=><tr key={r.id}><th><a href={'/restaurant/'+r.id}>{r.name}</a></th><td>{r.address}</td><td>{r.phone}</td></tr>)}</tbody></table></div><p className="muted small-text">電話番号がある一般飲食店を店舗ID順に表示。おすすめ順位や営業確認済みの店舗ではありません。</p></>}
 <h3>CSVで受け取れる項目と条件</h3><p>店舗名・住所・電話番号・許可台帳の区分・市町村・出典名・出典URL・台帳基準日・照合日の9項目。無料サンプルは最大30件で、条件に合う電話番号掲載施設が30件未満ならその件数です。フォーム送信後、その場で取得できます。</p>
 {phones>0&&<div className="actions-row"><a className="button primary" href={samplePath(name)}>{name}の無料CSVを取得</a><a className="button" href="/guides/restaurant-list#worked-example">Excelでの完成例を見る</a></div>}
 <h3>この地域の情報の確かめ方</h3><ul>{sources.map(s=><li key={s.url}><a href={safeUrl(s.url)||'/data-sources'} rel="noreferrer" target="_blank">{s.name}</a>：台帳基準日 {s.record_date||'未確認'}</li>)}</ul>
 <p>台帳の照合は、電話の接続・現在の営業・カフェや居酒屋などの料理ジャンル・開業日の確認とは異なります。公式情報で確認した内容と確認日を、<a href="/templates/sales-list">営業管理用テンプレート</a>へ記録してから候補を選べます。</p><p><a href="/reports/restaurant-data">37市町村の掲載件数・電話番号掲載率を比較する →</a></p></section>;
}
