<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## プロジェクトのルール

TimeLog は時間を記録・管理する Web アプリです。Next.js（App Router）・React・TypeScript・Tailwind CSS・SQLite で作ります。

### 開発環境

- Node.js のバージョンは mise で管理する（`mise.toml`）。`mise install` で揃え、コマンドは mise が有効なシェルか `mise exec -- <コマンド>` で実行する
- パッケージマネージャは npm。依存の追加・更新では `package-lock.json` も一緒にコミットする

### ディレクトリ構成とコーディング規約

- ディレクトリ構成とコーディング規約は Next.js 公式ドキュメントに従う。迷ったら上記の `node_modules/next/dist/docs/` を確認する
- ルーティングは `app/`、共通 UI 部品は `components/ui/`、レイアウト部品は `components/layout/`、ロジックや DB は `lib/` に置く

### フォーマットと lint

- フォーマットは Prettier、静的解析ルールは ESLint で機械的に強制する。手で揃えず、ツールの結果に従う
- コミット前に実行する: `npm run format` / `npm run lint` / `npm run typecheck`
- PR の CI でも `npm run format:check`・`npm run lint`・`npm run typecheck` を実行して確認する

### UI と文言の統一

- 画面の文言は `lib/messages.ts` にまとめ、コンポーネントに直接書かない
- 文言はです・ます調。括弧は全角（「（）」）を使う
- ボタンは原則アイコンで表示し、`components/ui/IconButton.tsx` を使う（アイコンは lucide-react）。名前を読み上げ用（`aria-label`）とポインタを合わせたときの説明（`title`）の両方に付ける
- ボタンやリンクの名前・ラベルは「保存」「削除」のような名詞形にし、「する」を付けない
- 色・フォントは `app/globals.css` の `@theme` に定義したトークンを使い、色コードを直接書かない
- 同じ役割の UI は `components/ui/` の部品を使い回す

### 自動テスト

- 振る舞いを変える変更には自動テスト（Vitest + Testing Library）を伴わせる。テストは対象ファイルの隣に `*.test.ts(x)` で置く
- `npm test` が通らない状態でコミットしない

### 仕様と計画（OpenSpec）

- 仕様と計画は OpenSpec で管理する（`openspec/`）。機能の追加・変更は change を作り、proposal・specs・design・tasks を書いてから実装する
- 実装が spec と食い違う場合は、コードで勝手に解決せず、先に計画を更新する
- アーカイブは手で行わない。レビューで spec と実装の整合を確認し、tasks.md がすべて完了してから PR に `archive` ラベルを付けると GitHub Actions がアーカイブする

### README

- 変更のたびに README.md の更新が必要か確認し、必要なら同じ変更（同じ PR）で更新する

### Git

- コミットメッセージは短い日本語で書く（例: 「タイマー開始ボタンを追加」）
- main へ直接 push しない。ブランチを切って PR を作る
- 1 コミット 1 目的にする。フォーマットだけの変更は機能変更と別のコミットにする
