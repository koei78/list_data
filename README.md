# 東京飲食店データベース

## Vercelへの移行準備（2026-11-12）

Vercelの公開先は https://list-data-eight.vercel.app/ です。Neonの無料PostgreSQL（`list-data-postgres`）をVercelの本番環境に接続済みです。利用者指定CSVの全258,405行を保存し、258,404店舗・有効な電話番号174,561件を取り込みました。店舗名が空の1行も原本行として保持し、全行のチェックサムを照合済みです。データは東京・神奈川・埼玉・千葉にまたがります。以下のNetlify公開情報は移行前の運用記録です。

旧NetlifyのDBは利用上限によって無効化されており、直接の旧DB複製ではありません。旧環境の会員・問い合わせ・営業リストなどCSVに含まれない情報は取得できていません。元CSVは変更していません。`source_import_rows`が元の各項目・行番号・変換時の確認事項を保持します。

Vercelの管理者認証は`ADMIN_BOOTSTRAP_EMAIL`と`ADMIN_PASSWORD_HASH`を使います。`/admin-setup`で本人がパスワードを入力し、ブラウザー内で生成した検証値だけをVercelのProduction環境変数へSecretとして設定します。パスワード自体は設定生成処理で送信・保存しません。設定後にProductionを再デプロイしてください。セッションは12時間有効で、DBにはトークンのハッシュだけを保存します。ログアウト・ユーザー無効化・パスワード検証値変更でアクセスを失います。Vercel以外では従来のNetlify認証を維持しています。

バックアップはVercelの非公開Blobストア`list-data-backups`に保存します。接続情報は本番環境に限定し、原本行もバックアップ対象です。バックアップAPIは管理者認証を要求します。

Vercelのビルドは`npm run vercel:build`です。`db:migrate`が`DATABASE_URL_UNPOOLED`（なければ`DATABASE_URL`）を使い、適用履歴・チェックサム・排他ロックを管理して未適用のSQLだけをトランザクションで適用します。既存テーブルを削除したり、店舗データを初期化する処理はありません。DB接続情報はVercelの連携が秘密の環境変数として管理し、ソースには含めません。

1. VercelでGitHubリポジトリ`koei78/list_data`を接続し、プロジェクトルートをこのフォルダーに設定します。Node.jsは22.xを使用します。
2. `DATABASE_URL`に既存PostgreSQLの接続情報、`NEXT_PUBLIC_SITE_URL`にVercelの正式URLを設定します。既存DBを使う場合、初期化や初期データ投入は実行しません。新しいDBの場合は`netlify/database/migrations`のSQL適用と既存データ移行が別途必要です。
3. `ADMIN_BOOTSTRAP_EMAIL`、`IMPORT_TOKEN`を安全に設定します。検証中は`PUBLIC_INDEXING=0`、`SURVEY_NOTIFICATIONS_ENABLED=0`にします。
4. Netlify Identity、Netlify Blobs、Netlify FormsはVercelへ自動移行されません。管理者ログイン・バックアップ・通知の接続対応が必要です。既存ユーザーや権限を失わないよう、これらの確認前に旧環境を停止しないでください。
5. `npm ci`、`npm run typecheck`、`npm run build`を実行し、Vercelのプレビューで`/api/health`、検索、アンケート、管理者ログイン、バックアップを確認してから本番に昇格します。

Vercelのローカル接続情報（`.vercel/`）と環境変数ファイルはGit管理対象外です。

公開URL: https://tenkai-restaurant-db.netlify.app/

株式会社てんかいの営業用データベース。Next.js App Router、Netlify Identity、Netlify Database（PostgreSQL）、Netlify Blobsを使用します。

## 公開済みの状態

- Netlify Freeプランの既存チームへ公開済み。21,875施設、電話番号16,861件、取り込み拒否0件。
- 公開HTTP/SEOの20項目、ローカルPostgreSQL互換環境の権限・CRM等15項目に合格。
- 旧chatgpt.siteの閲覧URLは新サイトへ301転送。旧データは保持。
- 新URLのSearch Console所有権確認・サイトマップ送信は完了。Googleでサイトマップインデックスの正常処理を確認済み。各ページの検索登録は処理待ち。
- 実ユーザーのメール確認・ログイン・再設定、全体バックアップからの本番復元は未実施。

## 開発と公開

Node.js 22.13以上とnpmを使用します。

    npm ci
    npm run typecheck
    npm run build
    netlify link --id 4afa5aef-b54c-4cb7-91ec-86ba94fb4a99
    netlify deploy --prod --context production

設定はnetlify.toml、スキーマはnetlify/database/migrationsにあります。Netlifyが公開時にマイグレーションを適用します。適用済みのファイルは変更せず、新しいマイグレーションを追加してください。

WindowsでNetlifyのNode版proxyのパッケージングが失敗したため、現行Next.jsでサポートされているEdge版middleware.tsを使用しています。Next.jsから非推奨の警告は出ますが、本番でヘッダー処理を確認済みです。将来の更新時にランタイム互換性を再確認してください。

## 環境変数と認証

- NEXT_PUBLIC_SITE_URL: 正式なHTTPS公開URL。canonicalと送信元検証に使用。
- ADMIN_BOOTSTRAP_EMAIL: 確認済みメールで初回ログインする所有者のメール。
- IMPORT_TOKEN: 管理者用取り込みAPIのSecret。本番環境にのみ設定。値をログ・引数・ソースへ書かない。
- PUBLIC_INDEXING: 本番は1。確認環境は0。
- GOOGLE_SITE_VERIFICATION: Search Consoleの公開メタタグ値。
- Database接続情報はNetlifyから実行環境へ供給されます。

Identityの登録はOpen、メール確認必須です。Netlifyの管理アカウントとは別に本サイトでの会員登録が必要です。初回管理者はADMIN_BOOTSTRAP_EMAILに一致し、Identityでメール確認済みの場合だけ付与します。旧サービスの認証ヘッダーは使用しません。

フォームのOriginは、Netlifyアダプターの内部リクエストURLではなく、正式な公開URLに照合します。会員向けHTML/APIは共有キャッシュに保存しません。CSV/XLSXはリスト所有権と店舗単位の開示許可を検証します。

## データ取り込みとテスト

本番データは許諾確認済みのNDJSONと出典情報を/api/ingestへ100件ずつPOSTして取り込みました。Authorization: BearerのSecretが必要です。管理画面からの取り込みは/api/actionの管理者権限チェックを通ります。取り込み用の生データをpublic/へ置かないでください。

scripts/seed.tsは既存情報を保持する汎用インポート、scripts/seed-initial.tsは新規初期DB用の一括インポートです。直接実行するには書込権限のあるPostgreSQL接続が必要です。今回、CLIで得た接続は読取専用だったため、本番への書込はアプリの認証付きAPIを使用しました。

ローカルDBは次のコマンドで用意します。

    npm run db:local

NETLIFY_LOCAL_DB=1をローカルプロセスだけに設定して実行します。本番には設定しないでください。

    node --conditions=react-server --import=tsx scripts/seed.ts <app-import.ndjson> <source.json>
    node --conditions=react-server --import=tsx tests/postgres.ts

公開HTTP検証:

    node tests/seo.mjs https://tenkai-restaurant-db.netlify.app <app-import.ndjson> <結果JSON>
    node tests/migration-http.mjs

tests/postgres.tsのIdentityはローカルの検証済みランタイムコンテキストを模したテスト用データで、本番ログインの代用ではありません。作成したローカル会員・申請・リストは終了時に削除します。

## 出典と運用

東京都保健医療局の2026年9月30日時点の食品関係営業台帳を加工しています。多摩地域（八王子市・町田市を除く）・島しょ地域の21,875施設が対象で、23区は未収録です。出典とライセンスは/data-sourcesに表示します。

バックアップはNetlify Blobsに500件ずつ保存します。復元は主キーで追加・更新し、後から作成したレコードを削除しません。分割バックアップは全体の同一時点スナップショットではないため、大規模更新との同時実行を避け、厳密な復旧点にはDatabase側のバックアップを使用します。

会社のメール窓口・個人情報保存期間は確定待ちです。検索順位・インデックス登録時期は保証されません。

node_modules、生成物、ローカルDB、原本NDJSON、.netlifyの認証状態、Secretはこのソース配布に含めません。


文字表示の修正（2026-10-26）
元CSV・Excelに含まれる外字を表示時に空白へ置換。店名48件・所在地3件に影響し、公開51施設ページで特殊文字が出ないことを確認しました。「梅ちゃんの台所」は三鷹市の公表資料で住所・電話番号と照合し、表示と前方一致検索を修正。残る47件の店名は未判読部分を空白表示し、詳細ページで確認中と明示します。店名全体が外字の場合は「店名確認中」と表示します。元のDB値、出典、店舗IDは保持しています。本文・タイトル・構造化データ・検索結果・営業リスト・出力ファイルに表示処理を適用し、管理画面の編集値とバックアップは原文を保持します。
本番deploy: 6adf2e8110ea90be22ffd387

## 2026-10-27 SEO更新

- トップページタイトル：東京飲食店データベース｜店名・電話番号・地域で検索。WebSite/Organization構造化データと共有用メタデータを追加。
- Googleサイトマップ再送信成功、検出URL 22,118件（施設21,875件＋一覧等243件）。検出は検索登録を意味しません。
- 新URLライブテストは登録可能。個別インデックス登録はGoogleの当日上限により未受理。
- 旧サイトは301転送をHTTP検証済み。Googleアドレス変更ツールの検証に合格し、2026-10-27に移転申請が受理されました（「このサイトは現在移行中です」）。

## 2026-10-27 検索流入ページと店舗一覧の改善

- `/restaurant-lists`: 収録範囲、現在の施設数・電話番号件数、リスト管理と出力方法を説明する公開ページ。
- `/guides/restaurant-list`: 対象の決め方、項目設計、情報と重複の確認、実装済み機能の操作手順を説明する公開ガイド。記入用の空CSVを配布。
- `/areas` から全238の地域一覧ページへ直接リンク。各一覧の100件の店舗リンクと合わせ、全21,875施設がトップから3リンク以内の経路を持つことを確認。
- 新しい2ページをサイトマップ、トップページ、共通フッターへ追加。サイトマップは計22,120 URL（施設21,875件とその他245件）。Googleの検出件数・インデックス登録件数とは別。
- 公開記事にサイト固有のタイトル、canonical、OG情報、Article・Breadcrumb構造化データ、編集主体と公開日を設定。
- 個人の営業リスト・実データの出力はログインと権限確認を維持。公開CSVには項目名だけを含み、店舗データは含まない。
- ローカルPGliteを使用する場合だけWASMのネイティブ読込を有効化。本番のDB設定は変更していない。

検証：`tests/directory-coverage.ts` はローカルDBの全施設と一覧経路を照合。`tests/search-growth.mjs <URL> <結果JSON>` は公開HTML・サイトマップ・テンプレート・匿名権限制御を検証する。

Googleの実地テストで「魚味幸」の店舗ページは登録可能と確認。Googleインデックス上はURL未認識で、全体レポートは処理中。これらの変更は発見経路と情報の有用性を改善するもので、検索掲載・順位・反映時期を保証しない。

## 2026-10-27 無料ツールと検索入口の拡張

- `/phone-search`: 電話番号から公表施設を検索する無料ページ。全角・ハイフン・+81表記を正規化し、無効入力時は検索しない。結果クエリはnoindex、入口URLへcanonicalを設定。
- `/templates/sales-list`: 16項目・200行の空Excelと既存CSVテンプレートを配布。電話番号列を文字列に設定し、営業状況・営業ステータスのドロップダウン、フィルター、見出しと識別列の固定を付与。実データを含まない。
- `/tools/phone-cleaner`: ブラウザー内で電話番号の表記統一・重複確認と結果CSVを生成。最大2,000行・160,000文字。入力を送信・保存せず、自動削除もしない。CSV数式のエスケープ、曖昧な入力の除外を検証。
- 全37地域の一覧1ページ目に、実データの許可業態別件数・絞り込みリンク・電話番号掲載率を追加。
- トップ・既存ガイド・地域ページ・フッターから新しい3ページへ案内。サイトマップ計22,123 URL（施設21,875、地域一覧等239、その他9）。
- `tests/phone-tools.ts` が表記揺れ・重複・空行・上限・CSV安全性を検証。`tests/public-tools.mjs <URL> <結果JSON>` が公開メタデータ・検索・配布ファイル・匿名権限を検証。
- Netlify Web Analyticsは既に有効。今回の作業で計測サービス契約・有料プラン変更は行っていない。2026-10-27 16:59までの24時間表示は224PV、ユニーク訪問者53、google.com参照5。テストアクセス等を含み、実人数・自然検索流入・施策の効果とは区別する。

## アンケート・機能リクエスト（2026-10-27）

- 一般利用者は会員登録・パスワードなしで利用アンケートに回答し、営業リスト、保存店舗、検索条件、CSV・Excel出力を使えます。公的な店舗情報と無料テンプレート・番号整理ツールは従来どおり公開です。
- 営業リストへのアクセスは、ランダムな256bitトークンのHttpOnly/Secure/SameSite Cookieで30日間管理。DBにはトークンのハッシュだけを保存します。Cookie削除・期限切れ・利用終了後の復元や別端末への引き継ぎには対応しません。
- 回答メールが既存会員と一致しても、既存データや管理者権限は継承しません。アンケートでは非公開の店舗情報・人物情報の閲覧権限を与えません。管理者・既存会員のIdentity認証と店舗ごとの権限は維持しています。
- /contact?type=feature から欲しい機能・情報をリクエストできます。電話番号は任意（電話での回答を選択した場合のみ必須）。確認・回答の連絡方法と任意の営業案内の受け取り希望を分け、未チェックを初期値にしています。連絡不要も選べます。
- 回答はsurvey_leads、利用状態はsurvey_sessions、短期の送信制限はsurvey_rate_limitsへ保存。新規マイグレーションは202610270001_surveys.sql。バックアップ対象に回答と利用状態を追加しています。
- 管理者は/admin?tab=leadsで内容、連絡方法、案内の希望、対応状況を確認・更新できます。
- Netlify Formsのフォーム検出を有効化。public/__forms.htmlを公開し、SURVEY_NOTIFICATIONS_ENABLED=1（production・全スコープ（現在のプランで選択可能な設定））で回答をusage-surveyフォームへ転送します。DBが正式な受付記録です。転送失敗時も受付を失わず、管理者から再試行できます。acceptedはFormsへの受付で、メール配送確認ではありません。
- 担当者へのメール通知は未設定です。通知先アドレスが決まったら、Netlify > このプロジェクト > Forms > Add notificationから設定してください。担当者アドレスを公開ページに埋め込む必要はありません。
- Netlify管理アカウントは既存のログインでFormsを閲覧できます。サイト内管理画面のIdentityアカウントは別です。一般向けの会員登録ボタンを撤去しており、管理者アカウントの新規追加にはNetlify Identityの招待を使います。
- tests/survey.tsで同意・連絡希望・セッション・権限・再送・送信制限・転送失敗を検証。tests/survey-http.mjsは公開サイトへ明示的なテスト回答を1件保存し、一時リストを削除、利用状態を終了します。回答記録は「公開動作確認（実際の問い合わせではありません）」として残します。
