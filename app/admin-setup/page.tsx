import {OwnerPasswordSetup} from './setup-form';
export const metadata={title:'管理者パスワードの設定',robots:{index:false,follow:false}};
export default function Page(){return <section className="panel inset narrow"><h1>管理者パスワードの設定</h1><p>管理者メールアドレスは登録済みのものを使います。</p><p>パスワードはこのブラウザー内で検証値に変換します。入力したパスワードを送信・保存することはありません。</p><OwnerPasswordSetup/></section>;}
