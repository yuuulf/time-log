# Design

## Context

- リポジトリにあるのは `README.md`（見出しのみ）、`mise.toml`（`node = "24"`）、`openspec/`、`.claude/`（OpenSpec のコマンドとスキル）だけで、アプリのコードはまだない
- `create-next-app` は、作成先に許可リスト外のファイル（`README.md`、`mise.toml`、`openspec/`、`.claude/`）があると作成を中止する
- 動機とスコープは proposal.md、満たすべき振る舞いは `specs/app-shell` と `specs/development-workflow` を参照

## Goals / Non-Goals

**Goals:**

- Next.js 公式の構成と既定値からなるべく外れない土台にする（独自の構成は最小限）
- フォーマット・lint・型・テストを、ローカルでも CI でも同じ npm スクリプトで実行できるようにする
- 以降の機能 change が DB・UI 部品・文言・テストをすぐ使える状態にする

**Non-Goals:**

- アプリのテーブル設計（タイマー・時間エントリの change で行う）
- デザインシステムやコンポーネントライブラリの導入
- fork からの PR でのアーカイブ（個人リポジトリのため同一リポジトリのブランチだけを対象にする）

## Decisions

### 1. プロジェクト作成: 一時ディレクトリで `create-next-app` を実行して取り込む

一時ディレクトリで `npx create-next-app@latest timelog --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm` を実行し、生成物（`.git` を除く）をリポジトリ直下にコピーする。`README.md` は生成物で上書きせず、既存の内容をベースに書き直す。生成された `AGENTS.md` と `CLAUDE.md` はそのまま取り込み、AGENTS.md に追記する。

- 代替案: 手作業で package.json などを作る → 公式の既定値と食い違いやすいので不採用
- `src/` は使わない: 公式の既定（`--no-src-dir`）に合わせる。ルート直下に `app/`・`components/`・`lib/` を置く

### 2. Node.js とパッケージマネージャ: mise + npm

既存の `mise.toml`（Node 24 LTS）をそのまま使う。CI でも `jdx/mise-action` で同じ `mise.toml` を読むので、ローカルと CI でバージョンが一致する。パッケージマネージャは Node 同梱の npm を使い、追加ツールを増やさない。`package.json` の `engines.node` に `>=24` を書いて取り違えに気付けるようにする。

### 3. フォーマットと lint: Prettier + ESLint（flat config）

- `create-next-app` が生成する `eslint.config.mjs`（`eslint-config-next`）をベースにする
- `prettier` と `eslint-config-prettier` を追加し、ESLint の整形系ルールを無効化して役割を分ける（整形は Prettier、品質ルールは ESLint）
- `prettier-plugin-tailwindcss` を追加し、Tailwind のクラス順を機械的にそろえる（UI の書き方の統一）
- スクリプト: `format`（書き込み）/ `format:check`（確認のみ）/ `lint`（`eslint .`）/ `typecheck`（`tsc --noEmit`）

### 4. SQLite: better-sqlite3 + Drizzle ORM

- `better-sqlite3` をドライバ、`drizzle-orm` をクエリとスキーマ定義、`drizzle-kit` をマイグレーション生成に使う
- 選定理由: better-sqlite3 は Next.js の `serverExternalPackages` の既定リストに入っていて追加設定なしでサーバー側から使える。Drizzle は TypeScript のスキーマから型が得られ、SQL に近く軽い
- 代替案: Prisma → 生成ステップとエンジンが増えて SQLite 1 ファイルの用途には重い。`node:sqlite` → Node 24 では安定版でなく、ORM 側の対応も限られる
- 配置: `lib/db/index.ts`（接続、`server-only` を import してクライアントへの混入を防ぐ）、`lib/db/schema.ts`（この change では空）、`drizzle/`（マイグレーション）、`drizzle.config.ts`
- DB ファイルのパスは環境変数 `DATABASE_URL`（既定 `data/timelog.db`）。`data/` は `.gitignore` に入れる。`.env.example` を置く
- スクリプト: `db:generate`（マイグレーション生成）/ `db:migrate`（適用）

### 5. 自動テスト: Vitest + Testing Library

- Next.js 公式のテストガイドにある Vitest 構成（`vitest`、`@vitejs/plugin-react`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`vite-tsconfig-paths`）を使う
- テストは対象ファイルの隣に `*.test.ts(x)` で置く
- 制約: Vitest は async Server Components を描画できない。必要になった時点で E2E（Playwright）を検討する（proposal のスコープ外）
- 画面幅への対応（`app-shell` の要件）は jsdom では確かめられないため、この change ではブラウザでの目視確認とする

### 6. UI 部品と文言の統一

- 共通 UI 部品は `components/ui/`、レイアウト部品は `components/layout/` に置く
- 画面の文言は `lib/messages.ts` に日本語の定数としてまとめ、コンポーネントとテストの両方から参照する。言語は日本語だけなので i18n ライブラリは入れない
- 色やフォントは Tailwind CSS v4 の `@theme`（`app/globals.css`）にトークンとして定義し、コンポーネントでは直接の色コードを使わない
- 文言のトーン（です・ます調、ボタンは動詞で終える、など）は AGENTS.md に書く

### 7. AGENTS.md への追記

生成された内容は残し、末尾に「## プロジェクトのルール」節を追加する。内容はユーザーが指定した次の項目: mise による Node 管理 / Next.js 公式に従う構成と規約 / Prettier・ESLint による強制 / UI・文言の統一（決定 6 の置き場所とトーン）/ 自動テスト / OpenSpec による仕様と計画の管理 / `archive` ラベルによるアーカイブ / README.md 更新要否の確認 / 短い日本語のコミットメッセージ / main への直接 push 禁止 / 1 コミット 1 目的（フォーマットのみの変更は分ける）。各項目には実行するコマンドを添える。

### 8. CI ワークフロー（`.github/workflows/ci.yml`）

- トリガー: main 向けの `pull_request`、main への `push`、`workflow_dispatch`
- 手順: checkout → `jdx/mise-action` → `npm ci` → `format:check` → `lint` → `typecheck` → `test` → `build` → `openspec validate --all --strict`
- `workflow_dispatch` は決定 9 のアーカイブ後に CI を再実行するために使う

### 9. アーカイブワークフロー（`.github/workflows/openspec-archive.yml`）

- トリガー: `pull_request` の `labeled`。`github.event.label.name == 'archive'` のときだけ実行する。push では起動しないため、アーカイブ後に PR を更新しても再実行されない（二重実行防止の要件）
- 権限: `contents: write`、`pull-requests: write`、`actions: write`。`concurrency` を PR 番号単位にして同時実行を防ぐ
- 対象の決め方: PR ブランチを checkout し、`git diff --name-only origin/main...HEAD -- openspec/changes/` から `openspec/changes/<name>/` の `<name>` を取り出す。`archive/` 配下は除き、作業ツリーに `openspec/changes/<name>/` が存在するものだけを対象にする。すでにアーカイブ済みなら対象がなくなるので、ラベルを付け直しても重複しない
- 未完了タスクの確認: アーカイブの前に `openspec list --json` を実行し、対象の change の `completedTasks` が `totalTasks` より少なければ未完了とする。1 つでも未完了があれば、何もアーカイブせず change 名と未完了件数を PR にコメントして終了する（全部か無しか）
  - 代替案: tasks.md のチェックボックスを自前で数える → OpenSpec の完了判定（`x` だけを完了とみなす）とずれる恐れがあるので、CLI の集計を使う
  - `openspec archive --yes` は未完了タスクがあっても確認を飛ばして進むため、この確認はワークフロー側で行う
- これらの判定ロジックは `scripts/openspec-archive.mjs` に関数として切り出し、Vitest でテストする。ワークフローはこのスクリプトを呼ぶだけにする
- 実行: 対象ごとに `npx openspec archive <name> --yes` を実行する。OpenSpec CLI は devDependency としてバージョンを固定する
- 全部成功したら、`<name> をアーカイブ` という日本語メッセージで 1 コミットにまとめて PR ブランチに push する。1 つでも失敗したらコミットせず、`gh pr comment` で change 名とエラー出力を PR にコメントする。対象がない場合もコメントする
- `GITHUB_TOKEN` による push では他のワークフローが起動しないため、push 後に `gh workflow run ci.yml --ref <branch>` で CI を明示的に起動する（`workflow_dispatch` は `GITHUB_TOKEN` からでも起動できる）

## Risks / Trade-offs

- [`create-next-app@latest` の生成内容がバージョンで変わる] → 取り込んだ時点の Next.js のバージョンを package.json に固定し、AGENTS.md の生成部分も取り込んだ内容をそのまま正とする
- [better-sqlite3 はネイティブモジュールで、Node のメジャー更新時に再ビルドが必要] → Node は mise で固定。更新時は `npm rebuild` を README に書く
- [アーカイブ後の CI を `workflow_dispatch` で起動するため、PR 画面のチェック表示が push 起点と少し異なる] → 同じジョブ名で head のコミットに結果が付くので、必須チェックの判定には使える。気になる場合は GitHub App のトークンに切り替える
- [main の保護はリポジトリ設定に依存し、この change では強制できない] → AGENTS.md と README.md にルールと設定手順（PR 必須、CI 必須チェック）を書く
- [`archive` ラベルが存在しないと付けられない] → タスクで `gh label create archive` を実行する

## Migration Plan

新規作成のため移行対象はない。CI とアーカイブのワークフローは、この change の PR 自身で動作確認する（CI が通ること、`archive` ラベルでこの change がアーカイブされること）。問題があればワークフローファイルを revert すればよい。
