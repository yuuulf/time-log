# Proposal

## Why

Toggl のような時間記録アプリ「TimeLog」を作り始めるにあたり、リポジトリには README.md・mise.toml・OpenSpec の初期ファイルしかない。タイマーなどの機能を作る前に、アプリの土台（Next.js + Tailwind CSS + SQLite）と、開発ルール（フォーマット・lint・テスト・OpenSpec 運用・アーカイブ自動化）を整える。ここで仕組みとして固めておけば、以降の変更が同じ品質基準で進められる。

## What Changes

- `create-next-app` で Next.js（App Router）・React・TypeScript・Tailwind CSS・ESLint のプロジェクトを作り、既存リポジトリに取り込む。Node.js は既存の `mise.toml` で管理する
- Prettier を導入し、ESLint と衝突しないよう設定する。`format` / `format:check` / `lint` スクリプトを用意する
- SQLite への接続層（DB クライアント・スキーマ定義・マイグレーションの仕組み）を用意する。テーブルはまだ作らない
- 自動テストの基盤（ユニット/コンポーネントテスト）と `test` スクリプトを用意する
- 共通レイアウトとトップページを TimeLog 用に置き換え、UI 部品と文言を一か所で管理する仕組みを用意する
- `create-next-app` が生成する AGENTS.md に、プロジェクト固有の開発ルールを追記する
- GitHub Actions を 2 つ追加する
  - PR ごとに format チェック・lint・型チェック・テスト・ビルドを実行する CI
  - PR に `archive` ラベルが付いたら、その PR が含む OpenSpec change をアーカイブして PR ブランチにコミットするワークフロー。tasks.md に未完了のタスクが残っている change はアーカイブしない
- README.md をセットアップ手順と開発コマンドの説明に更新する

## Capabilities

### New Capabilities

- `app-shell`: アプリ全体の共通レイアウト、トップページ、アプリ名と日本語表示など、全画面で共通の振る舞い
- `development-workflow`: PR に対する自動チェックと、`archive` ラベルによる OpenSpec change のアーカイブ自動化

### Modified Capabilities

（なし。既存の spec はない）

## スコープ外

- タイマー、時間エントリ、プロジェクト、タグ、レポートなど TimeLog の機能そのもの（別の change で扱う）
- 認証・複数ユーザー対応
- 本番環境へのデプロイ設定
- E2E テストの導入（機能が増えた段階で検討する）
- main ブランチの保護ルール設定（GitHub のリポジトリ設定で行う。AGENTS.md には運用ルールとして書く）

## README.md の更新

必要。現在は見出しだけなので、アプリの概要、前提（mise）、セットアップ手順、開発コマンド（dev / test / lint / format）、OpenSpec の運用（`archive` ラベルと、未完了タスクがあるとアーカイブされないこと）を書く。

## Impact

- 新規ファイル: `app/`、`public/`、`package.json`、`tsconfig.json`、`next.config.ts`、ESLint / Prettier / PostCSS / テストの設定、`.github/workflows/`、AGENTS.md、CLAUDE.md、DB 関連ファイル
- 変更ファイル: README.md、`.gitignore`（SQLite のデータファイルを除外）
- 新しい依存パッケージ: Next.js 一式、Tailwind CSS、Prettier 関連、SQLite ドライバ/ORM、テストランナー関連
- GitHub 側: `archive` ラベルの作成、Actions にリポジトリへの書き込み権限が必要
