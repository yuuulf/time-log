# Tasks

## 1. プロジェクト作成と開発ルール

1.1〜1.2 の時点では `test` スクリプトがまだないため、`npm test` による確認は 1.3 の完了時から行う。

- [x] 1.1 作業ブランチ `bootstrap-project` を作成し、`git branch --show-current` で main 以外にいることを確認する
- [ ] 1.2 一時ディレクトリで `create-next-app`（design 決定 1 のフラグ）を実行し、`.git` と `README.md` 以外の生成物をリポジトリ直下にコピーする。`mise exec -- npm run dev` で初期ページが表示されることを確認する（コミット: Next.js プロジェクトを作成）
- [ ] 1.3 Next.js 公式ガイドの構成で Vitest と Testing Library を導入し、`vitest.config.mts` と `test` スクリプトを追加する。仮のテスト 1 件で `npm test` が通ることを確認する（コミット: Vitest を導入）
- [ ] 1.4 AGENTS.md の生成部分の後に「## プロジェクトのルール」節（design 決定 7 の全項目と各コマンド）を追記し、ユーザー指定の 11 項目がすべて含まれていることを確認する。以降のタスクのコミットはこのルールに従う（コミット: AGENTS.md に開発ルールを追記）
- [ ] 1.5 `package.json` に `engines.node: ">=24"` を追加し、`mise exec -- node -v` が 24 系で `npm ci` と `npm test` が通ることを確認する

## 2. フォーマットと lint

- [ ] 2.1 `prettier`・`eslint-config-prettier`・`prettier-plugin-tailwindcss` を追加し、`.prettierrc`・`.prettierignore`・`eslint.config.mjs` を設定、`format` / `format:check` / `lint` / `typecheck` スクリプトを追加する。`npm run lint` と `npm run typecheck` が通ることを確認する（コミット: Prettier と lint スクリプトを追加）
- [ ] 2.2 `npm run format` で既存ファイルを整形し、整形だけを別コミットにする。`npm run format:check` が通ることを確認する（コミット: Prettier で整形）

## 3. 共通レイアウトとトップページ（app-shell）

- [ ] 3.1 `lib/messages.ts` に文言定数（アプリ名・説明・ナビゲーション）を作り、`app/globals.css` の `@theme` に色とフォントのトークンを定義する。`npm run typecheck` が通ることを確認する
- [ ] 3.2 `components/layout/Header.tsx` を作り、アプリ名「TimeLog」を `/` へのリンクとして表示する。リンク先とアプリ名を確かめるテストを書き、`npm test` が通ることを確認する
- [ ] 3.3 `app/layout.tsx` を `lang="ja"`・タイトルに「TimeLog」を含む metadata・Header 付きのレイアウトに書き換える。metadata のタイトルを確かめるテストを書き、`npm test` が通ることを確認する
- [ ] 3.4 `app/page.tsx` を TimeLog のトップページ（アプリ名と日本語の説明）に置き換え、不要になった `public/` のテンプレート画像を削除する。アプリ名と説明が表示され、Next.js の初期表示がないことを確かめるテストを書き、`npm test` が通ることを確認する
- [ ] 3.5 `npm run dev` で開き、ブラウザの開発者ツールで幅 375px とデスクトップ幅のどちらでも横スクロールが出ないことを目視で確認する

## 4. SQLite 接続層

- [ ] 4.1 `better-sqlite3`・`drizzle-orm`・`drizzle-kit`・`server-only` を追加し、`lib/db/index.ts`・`lib/db/schema.ts`・`drizzle.config.ts`・`.env.example` を作成、`data/` を `.gitignore` に追加する。`db:generate` / `db:migrate` スクリプトを追加する（コミット: SQLite の接続層を追加）
- [ ] 4.2 一時ファイルの DB に接続して `select 1` が実行できることを確かめるテストを書き、`npm test` と `npm run build` が通ることを確認する

## 5. CI

- [ ] 5.1 `@fission-ai/openspec` を devDependency に追加し、`npx openspec validate --all --strict` が通ることを確認する
- [ ] 5.2 `.github/workflows/ci.yml`（design 決定 8）を作成する。ローカルで同じ手順（`format:check` → `lint` → `typecheck` → `test` → `build` → `openspec validate --all --strict`）を順に実行してすべて通ることを確認する（コミット: CI を追加）

## 6. archive ラベルによるアーカイブ

- [ ] 6.1 `scripts/openspec-archive.mjs` に、差分のパス一覧と存在するディレクトリからアーカイブ対象の change 名を求める関数を実装する。対象 1 つ・複数・なし・`archive/` 配下のみ・アーカイブ済み（ディレクトリが存在しない）のケースをテストし、`npm test` が通ることを確認する
- [ ] 6.2 同スクリプトに、`openspec list --json` の `completedTasks` / `totalTasks` から未完了タスクのある change を求める関数を実装する。全完了・一部未完了・複数のうち 1 つだけ未完了のケースをテストし、`npm test` が通ることを確認する
- [ ] 6.3 同スクリプトに、未完了タスクのある change が 1 つでもあれば何もアーカイブせず PR にコメントする処理、対象ごとの `openspec archive <name> --yes` 実行、全成功時のコミット・push、失敗時と対象なし時の PR コメント（`gh pr comment`）、push 後の `gh workflow run ci.yml` を実装する。外部コマンドの呼び出しを差し替えて、成功時にコミットされ、未完了タスクがある場合と失敗時にはコミットされないことをテストし、`npm test` が通ることを確認する
- [ ] 6.4 `.github/workflows/openspec-archive.yml`（design 決定 9: `labeled` トリガー、権限、concurrency）を作成し、`npx --yes actionlint` などでワークフローの構文エラーがないことを確認する（コミット: archive ラベルでのアーカイブを追加）
- [ ] 6.5 `gh label create archive` でラベルを作成し、`gh label list` に表示されることを確認する

## 7. ドキュメント

- [ ] 7.1 README.md に概要・前提（mise）・セットアップ・開発コマンド・DB・OpenSpec の運用（`archive` ラベルと、未完了タスクがあるとアーカイブされないこと）・main 保護の推奨設定を書き、README の手順どおりにクローン直後の状態から `npm run dev` まで進められることを確認する（コミット: README を更新）

## 8. 結合確認

- [ ] 8.1 PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認し、tasks.md がすべて完了していることを確かめてから、PR に `archive` ラベルを付ける。この change がアーカイブされ、`openspec/specs/app-shell` と `openspec/specs/development-workflow` ができることと、アーカイブ後に CI が再実行されることを確認する
- GitHub のリポジトリ設定で main のブランチ保護（PR 必須、CI を必須チェックに設定）を行う
