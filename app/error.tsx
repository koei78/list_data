'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="gate panel"><h1>ページを読み込めませんでした</h1><p>時間をおいて再度お試しください。</p><button onClick={reset}>再読み込み</button></div>;}
