# TimeLog

作業にかかった時間を記録して、あとから振り返るための Web アプリです。

- Next.js（App Router）・React・TypeScript
- Tailwind CSS
- SQLite（better-sqlite3 + Drizzle ORM）

## 前提

- [mise](https://mise.jdx.dev/)（Node.js のバージョンを `mise.toml` で管理しています）
- GitHub CLI（`gh`。PR の作成やラベルの操作に使います）

## セットアップ

```bash
git clone https://github.com/yuuulf/time-log.git
cd time-log
mise trust      # 初回のみ。mise.toml を信頼する
mise install    # mise.toml の Node.js をインストール
npm ci          # 依存パッケージをインストール
cp .env.example .env   # 必要なら DATABASE_URL を変更
npm run dev
```

http://localhost:3000 を開くとトップページが表示されます。データベースは初めてアクセスしたときに自動で作られます。

mise が有効になっていないシェルでは、`mise exec -- npm run dev` のように `mise exec --` を付けて実行してください。

## 使い方

- 画面の左のサイドバーから「ホーム」「過去の記録」「プロジェクト」に移動できます。サイドバーには記録中のタスク（タスク名と開始時刻）も表示されます。幅の狭い画面では、左上のメニューボタン（≡）でサイドバーを開きます
- タスク名を入力して開始ボタン（▶）を押すと、その時刻から記録が始まります。タスク名は省略でき、過去に使ったタスク名が入力候補に出ます。プロジェクトも選べます（省略できます）
- 終了ボタン（■）を押すと、その時刻で記録が終わり、作業時間が表示されます。記録中の経過時間は表示しません
- 記録中に別のタスクを開始すると、記録中のタスクはその時刻で自動的に終了します（記録中のタスクは 1 つまで）
- 直近 30 日の記録が日付ごとに表示されます。修正ボタン（鉛筆）でタスク名・プロジェクト・開始時刻・終了時刻を直せ、削除ボタン（ごみ箱）で記録を消せます
- 終了した記録の再開ボタン（▶）を押すと、同じタスク名・プロジェクトで新しい記録が始まります。記録中のタスクがあれば、その時刻で自動的に終了します
- 30 日より前の記録は、サイドバーの「過去の記録」から見られます。月ごとに表示し、前の月・次の月のボタン（‹ ›）で切り替えます。開始日と終了日を入力して表示ボタン（虫めがね）を押すと、その期間（1 年以内）の記録を表示します
- サイドバーの「プロジェクト」で、プロジェクト（名前・色・クライアント名・説明）を登録・編集・削除できます。色は 10 色から選びます。記録が紐づいているプロジェクトは削除できません
- プロジェクトの紐づいた記録には、タスク名の右側にプロジェクトの色の丸が表示されます。ポインタを合わせるとプロジェクト名が表示されます。トップページの記録中の枠には、プロジェクト名も表示します
- 日付と時刻は日本時間で表示します
- ボタンはアイコンで表示しています。ポインタを合わせると名前（「開始」「削除」など）が表示されます

## 開発コマンド

| コマンド               | 内容                                           |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | 開発サーバーを起動する                         |
| `npm run build`        | 本番ビルドを作る                               |
| `npm test`             | 自動テスト（Vitest）を実行する                 |
| `npm run test:watch`   | 変更を監視してテストを実行する                 |
| `npm run lint`         | ESLint でチェックする                          |
| `npm run typecheck`    | TypeScript の型チェックをする                  |
| `npm run format`       | Prettier で整形する                            |
| `npm run format:check` | 整形されていないファイルがないか確認する       |
| `npm run db:generate`  | `lib/db/schema.ts` からマイグレーションを作る  |
| `npm run db:migrate`   | マイグレーションを手動で適用する（通常は不要） |

PR では GitHub Actions の CI が format:check・lint・typecheck・test・build と OpenSpec の検証を実行します。

## データベース

- データベースは SQLite のファイルです。場所は `.env` の `DATABASE_URL` で決まり、省略時は `data/timelog.db` です（`data/` は Git の管理外）
- テーブル定義は `lib/db/schema.ts` に書き、`npm run db:generate` で `drizzle/` にマイグレーションを作ってコミットします
- マイグレーションは、アプリが DB に接続するとき（初めてページを開いたとき）に自動で適用されます。テストでもインメモリの DB に同じマイグレーションが適用されます
- better-sqlite3 はネイティブモジュールです。Node.js のメジャーバージョンを上げたときは `npm rebuild better-sqlite3` を実行してください
- npm はインストールスクリプトを許可したパッケージだけ実行します（`package.json` の `allowScripts`）。better-sqlite3 などを更新して警告が出たら `npm install-scripts ls` で確認し、`npm install-scripts approve <パッケージ>` で許可してください

## 開発の進め方

開発ルールの詳細は [AGENTS.md](AGENTS.md) にあります。

### 仕様と計画（OpenSpec）

仕様と計画は [OpenSpec](https://github.com/Fission-AI/OpenSpec) で管理しています（`openspec/`）。

1. change を作り、proposal・specs・design・tasks を書く（`/opsx:propose`）
2. ブランチを切り、tasks.md に沿って実装する（`/opsx:apply`）
3. PR を作り、レビューで spec と実装が合っているかを確認する
4. tasks.md がすべて完了していることを確かめ、PR に `archive` ラベルを付ける

`archive` ラベルを付けると、GitHub Actions が PR に含まれる change をアーカイブし（`openspec/specs/` に反映し、`openspec/changes/archive/` に移す）、そのコミットを PR ブランチに追加します。tasks.md に未完了のタスクが残っているとき、またはアーカイブに失敗したときはコミットせず、理由を PR にコメントします。直したら、ラベルを外して付け直してください。

### ブランチとコミット

- main へ直接 push せず、ブランチを切って PR を作ります
- コミットメッセージは短い日本語で書き、1 コミット 1 目的にします。フォーマットだけの変更は機能変更と分けます

main ブランチは、GitHub のリポジトリ設定（Settings → Rules → Rulesets）で次のように保護することをおすすめします。

- PR を必須にする（直接 push を禁止）
- CI の `check` ジョブを必須のステータスチェックにする
