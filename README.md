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
npm run db:migrate     # データベースを作成・更新
npm run dev
```

http://localhost:3000 を開くとトップページが表示されます。

mise が有効になっていないシェルでは、`mise exec -- npm run dev` のように `mise exec --` を付けて実行してください。

## 開発コマンド

| コマンド               | 内容                                          |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | 開発サーバーを起動する                        |
| `npm run build`        | 本番ビルドを作る                              |
| `npm test`             | 自動テスト（Vitest）を実行する                |
| `npm run test:watch`   | 変更を監視してテストを実行する                |
| `npm run lint`         | ESLint でチェックする                         |
| `npm run typecheck`    | TypeScript の型チェックをする                 |
| `npm run format`       | Prettier で整形する                           |
| `npm run format:check` | 整形されていないファイルがないか確認する      |
| `npm run db:generate`  | `lib/db/schema.ts` からマイグレーションを作る |
| `npm run db:migrate`   | マイグレーションをデータベースに適用する      |

PR では GitHub Actions の CI が format:check・lint・typecheck・test・build と OpenSpec の検証を実行します。

## データベース

- データベースは SQLite のファイルです。場所は `.env` の `DATABASE_URL` で決まり、省略時は `data/timelog.db` です（`data/` は Git の管理外）
- テーブル定義は `lib/db/schema.ts` に書き、`npm run db:generate` で `drizzle/` にマイグレーションを作ってコミットします
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
