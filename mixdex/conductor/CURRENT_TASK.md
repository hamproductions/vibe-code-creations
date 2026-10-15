# Current task

## 目的と権限
- 前Goalのコンテンツ再監査は完了。現在の依頼はMIXDEX変更をmainへcommit/pushし、作業ツリーをcleanにする。Goalは再開しない。
- 閉じた参照集合：既存コード、`conductor/data-source-audit.md`、保存MCH、既存で対応付けられたSho・Seesaa MIX Wiki・音質派・Ameba。関連組織や別プロジェクトへ広げない。
- 今turnでcommit/pushとclean化を許可。deploy/PR/外部投稿・本番書込み・OS/音声設定変更は未許可。新規テストファイルは追加しない。
- 最新の指示は認証ユーザーをhamzaabambooに切り替え、既存originへpushすること。リポジトリ所有権の移管・fork・remote変更は行わない。
- origin fetch済み。既存main commitは55bd78d。gh認証はhamzaabambooへ切替済み。同ユーザーは既存originへpush権限あり。
- commit identityはTanyawat Vittayapalotai <hamzaabamboo@gmail.com>。監査メディアはcommitせず保存し、対象ディレクトリをローカルGit除外へ登録する。
- 既存の未コミット変更を保持。前GoalのUX作業は完了済みで、今回のコンテンツ監査の代わりにはしない。
- 終了条件：今回の確定修正を実行・画面確認・独立レビューし、出典で解決できない読みは明示する。追加資料の許可待ちは解決済みと扱わない。

## 正本と既存成果
- 製品規則は `AGENTS.md`。三つの練習方式、有限な選択セッション、Learning初期フィルター、選択保持、既存foil、行境界、原文文字、出典別派生、学習進捗と復習の原子的保存を保持。
- 出典監査：`conductor/data-source-audit.md`、保存原文：`conductor/sources/masakimch.html`。
- 前Goalの結果：`dogfood-output/practice-audit/report.md`。カスタム編集の本文・読み・発動・注記・追加末尾の保持、全想起保存のトランザクション化、README/AGENTS更新は継承変更。
- 今回の証拠：`dogfood-output/content-audit/`。唯一のライブ記録は本ファイル。

## 今回の確定修正
- `src/kanjiDict.js`：生きる、お母さん、食べたい、風に、舞い、飛び、降りて、燃え上れ、お巡り、木下、誰ですか、緑の等を文脈単位で解決。は・へを含む既知の句の発音と、カタカナ接続前の不自然な分断も修正。単独の風・緑・皆・母等の既存読みを保持。
- `src/romaji.js`：漢字だけでなく仮名から始まる既知の辞書句も最長一致で解決。
- `src/ui.js`：同じ文脈句をrubyに反映。漢字を含まない辞書句はruby化しない。
- `src/catalogJa.js`：アイヌ末尾の採用表記についての誤訳を修正。ゼンキョウを出典のカタカナ表記に統一。MIXへの接続注記を英訳。
- `src/i18n.js`：Pre-introを前奏前に翻訳し、英語の接続注記を適用。
- `src/seed.js`：ガチ恋の出典引用末尾を対応記事の表記に修正。ゼンキョウの日本語タイトルを修正。seed v51。
- `sw.js`：cache v109。最終辞書追記後の画面に旧seedが残ったため、バージョン更新とSW更新を実施。v109のみのキャッシュと最新表示を再確認。
- `src/seedText.js`は無変更。全文・行・段落・任意末尾は監査前スナップショットと一致。

## 残る出典上の不確実性
- `manekecha-kimi` / `manekecha-kimiwazurai` の千愛：既存辞書はちあ。提供出典は漢字のみで発音を裏付けない。
- `banzai` の皆で：単独の九字用かいを流用した現表示は不適切。みな／みんなのどちらを実際に唱えるかは既存出典に記載なし。
- 公式アーティスト・実演資料へ参照集合を広げるか、ユーザーに任意質問を送信済み。未回答。未確認の読みへ置換していない。
- 園長、妹の特殊読み、猫・兎の特殊読みは出典で確認された派生／明示ヒントのため保持。

## 現在の検証
- 最終内容で既存 `UV_THREADPOOL_SIZE=1 node tests/check-seed.mjs`、`engine.test.mjs`、`roundtrip.test.mjs` が成功。新規テストなし。
- 一回限りの比較で全文・追加末尾・行配列の不変を確認。読み差分は `reading-changes.json`。文脈読みと単独の元素／MIX用読みを直接assertして成功。
- 親が実ブラウザーのEN/JA Browse、学習準備カード、390×844モバイルを操作し、保存スクリーンショットを自分で表示して確認。
- お母さん／食べたいの失敗を修正前画面で再現。修正後EN/JA、桜並木のBrowse/Learn、アイヌ出典disclosure、前奏前、英語接続注記、緑のたぬきを確認。JSブラウザーエラーなし。
- 新規の独立読取レビュー：今回の変更に確定欠陥なし。親は決定的な原文・差分・画面を別途確認。未確認の名前・掛け声はレビュー合意を根拠に確定していない。
- `git diff --check` 成功。最終バージョンで構文・差分・機密パターン確認も成功。

## 環境と所有権
- enclosing checkout `main`、HEAD `1632c90132f970205d82f27426fd2de5b45dcbdc`。今turnでorigin fetch済み。変更は55bd78dとしてmainへcommit済み。最新指示で既存originへのpushを許可。
- 継承dirty：AGENTS/README/app/db/engine/i18n/practice/seed/state/ui/style/SW/task、practice-audit。今回追加：catalogJa/kanjiDict/romaji/content-audit、上記対象の追記。別パスを操作しない。
- 既存4176サーバーPID24860は他の継続作業由来。変更・停止しない。初回画面でモジュール読込みが止まった原因は未確定。
- 今回所有：`python3 -m http.server 4177 --bind 127.0.0.1`、exec session34875。停止済み。4177にLISTENなし。
- 今回ブラウザー `mixdex-content-1015` は閉鎖済み。最終session listから除去されたことを確認。`mixdex-council-review10` 等の別コントローラー所有セッションは触らない。
- 全agent-browserコマンドに `AGENT_BROWSER_ARGS="--use-mock-keychain,--password-store=basic,--mute-audio"`。非HTTP(S)リンクの操作禁止。最後に所有セッションを閉じ、一覧確認。
- ディスク最終確認5.7GiB空き。動画・大規模並列実行なし。

## スキルと読取範囲
- この会話で1–EOF：using-superpowers1–65＋Codex参照、handing-off-pro-max1–167、the-council1–59、agent-browser1–52＋完全CLI core、real-testing-evidence1–70、look-at-the-screen1–60、verification-before-completion1–120、surgical-patch1–16、systematic-debugging1–283、writing-for-agents1–81、今回stop-inventing1–79。配送turnでcaveman-commit1–63とverification-before-completion1–120をEOFまで再確認。
- 今回親：catalogJa1–53、ui1–127、i18n1–233、kanjiDict1–310、romaji1–122、onboarding1–68、data-source-audit1–133をEOFまで読取。全カタログの漢字トークン／実生成読みを検査し、確定候補のseed/MCH該当箇所を直接照合。
- 読取担当：seed1–271、seedText1–1436、保存MCH1–1393、上記辞書・翻訳・監査を全文確認。親は返却仮説を原文または実行で検証。
- 外部は対応済みのガチ恋記事、Sho、MIX Wikiの対象記述のみ。Wiki全4308行を読了とは扱わない。

## 即時の次アクション
MIXDEXの追跡済み変更は既存三チェック、構文、差分、機密パターンを検証してmainへ保存する対象。監査メディアは保存したままGitローカル除外を適用。次は認証ユーザーを確認して既存originへpushし、fetch後の同期とcleanを確認する。
既存の参照集合内での再監査・確定修正・検証・清掃を完了。報告書は `dogfood-output/content-audit/report.md`。千愛・皆での未解決点は追加資料の任意範囲確認が未回答のため明示。回答があれば許可範囲だけで追加検証する。

## 修正ゲート
- 誤り：remoteの所有組織とGitHubの認証ユーザーを同一視し、不要な確認でpushを止めた。
- 根拠：ghの認証は別ユーザーだったが、hamzaabambooへ切替後に既存repoへのadmin/push権限を確認。
- 規則：所有権の移管と認証ユーザーの切替を区別し、明示された既存originへのpushを実行する。
- 対応：ghをhamzaabambooへ切替。SSHユーザーを確認し、mainへpushする。
- 読取：get-your-shit-together1–27をEOFまで確認。
