import {csvCell} from './normalize';

export const PHONE_LINE_LIMIT=2000;
export const PHONE_INPUT_LIMIT=160000;
export type PhoneRow={line:number,input:string,normalized:string,status:'確認可'|'重複'|'要確認',firstLine:number|null};

// Checks formatting only. It does not establish ownership, allocation or reachability.
export function normalizePhoneInput(value:string):string|null {
  if(value.length>80)return null;
  let s=value.normalize('NFKC').trim().replace(/[‐‑‒–—―ー−]/g,'-');
  if(!s||!/^[+\d\s().-]+$/.test(s))return null;
  s=s.replace(/[\s().-]/g,'');
  if(s.startsWith('+81'))s='0'+s.slice(3).replace(/^0/,'');
  return /^0\d{9,10}$/.test(s)?s:null;
}

export function checkPhoneLines(input:string){
  if(input.length>PHONE_INPUT_LIMIT)throw new Error('入力が長すぎます。2,000行・160,000文字以内に分けてください。');
  const lines=input.split(/\r\n|\r|\n/);
  if(lines.length>PHONE_LINE_LIMIT)throw new Error('一度に処理できるのは2,000行までです。分けて貼り付けてください。');
  const first=new Map<string,number>();
  const rows:PhoneRow[]=[];
  lines.forEach((value,i)=>{
    if(!value.trim())return;
    const normalized=normalizePhoneInput(value),firstLine=normalized?first.get(normalized):undefined;
    rows.push({line:i+1,input:value,normalized:normalized||'',status:normalized?(firstLine?'重複':'確認可'):'要確認',firstLine:firstLine??null});
    if(normalized&&!firstLine)first.set(normalized,i+1);
  });
  return {rows,total:rows.length,unique:first.size,duplicates:rows.filter(r=>r.status==='重複').length,invalid:rows.filter(r=>r.status==='要確認').length};
}

export function phoneRowsCSV(rows:PhoneRow[]){
  const data=[['元の行','入力値','数字だけの番号','確認結果','最初に出た行'],...rows.map(r=>[r.line,r.input,r.normalized,r.status,r.firstLine??''])];
  return '\uFEFF'+data.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
