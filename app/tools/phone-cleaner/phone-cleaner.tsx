'use client';
import {useState} from 'react';
import {checkPhoneLines,phoneRowsCSV,PHONE_INPUT_LIMIT} from '../../../lib/phone-tools';

export default function PhoneCleaner(){
  const [input,setInput]=useState('');
  const [result,setResult]=useState<ReturnType<typeof checkPhoneLines>|null>(null);
  const [error,setError]=useState('');
  function check(e:React.FormEvent){e.preventDefault();try{setResult(checkPhoneLines(input));setError('');}catch(e){setResult(null);setError(e instanceof Error?e.message:'入力内容をご確認ください。');}}
  function download(){if(!result)return;const url=URL.createObjectURL(new Blob([phoneRowsCSV(result.rows)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='phone-check.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section className="panel inset phone-tool"><form onSubmit={check}><label className="field" htmlFor="phone-lines"><span>電話番号を1行に1件ずつ貼り付け</span><textarea id="phone-lines" rows={7} maxLength={PHONE_INPUT_LIMIT} value={input} onChange={e=>{setInput(e.target.value);setResult(null);setError('');}} placeholder={'03-1234-5678\n０３（１２３４）５６７８\n+81 90 1234 5678'}/></label><p className="muted small-text">例は形式の見本です。空行は飛ばし、元の行番号を残します。最大2,000行。</p><div className="flex"><button className="primary" type="submit">番号を整理・重複を確認</button><button type="button" onClick={()=>{setInput('');setResult(null);setError('');}}>クリア</button></div></form>{error&&<p className="notice" role="alert">{error}</p>}{result&&<div className="tool-result"><p role="status">入力 {result.total} 件 ／ 異なる番号 {result.unique} 件 ／ 2回目以降の重複 {result.duplicates} 件 ／ 要確認 {result.invalid} 件</p>{result.rows.length>0&&<><button onClick={download}>確認結果をCSVで保存</button><p className="muted small-text">CSVをExcelに取り込むときは「数字だけの番号」列を文字列に指定してください。先頭の0を保持できます。</p><div className="table-wrap"><table className="guide-table phone-results"><thead><tr><th>元の行</th><th>入力値</th><th>数字だけの番号</th><th>確認結果</th></tr></thead><tbody>{result.rows.slice(0,100).map(r=><tr key={r.line}><td>{r.line}</td><td>{r.input}</td><td>{r.normalized||'—'}</td><td>{r.status}{r.firstLine?`（${r.firstLine}行目と一致）`:''}</td></tr>)}</tbody></table></div>{result.rows.length>100&&<p>画面には先頭100件を表示しています。CSVには全{result.total}件を保存します。</p>}</>}</div>}<noscript><p>番号の整理にはJavaScriptを有効にしてください。</p></noscript></section>;
}
