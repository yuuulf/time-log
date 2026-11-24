# Tasks

## 1. ロゴの表示

- [x] 1.1 `components/layout/AppLogo.tsx` の 2 つの `Image` に `unoptimized` を付け、`/icon-light.png`・`/icon-dark.png` を直接読むようにする（design「`AppLogo` の `Image` に `unoptimized` を付ける」）。`AppLogo.test.tsx` で、`src` が `/icon-light.png`・`/icon-dark.png` そのもの（`/_next/image` を通らない）であることを確かめるようにテストを直す。`npm test` が通ることを確かめる（コミット: アプリ名のロゴを縮小せずに表示する）

## 2. ドキュメントと確認

- [x] 2.1 README.md の更新が必要か確認する（proposal の見込みでは不要）。必要なら同じ PR で更新する
- [x] 2.2 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [x] 2.3 `npm run build` したアプリを開き、サイドバーのロゴの `<img>` の `src` が `/icon-light.png`・`/icon-dark.png` であること、ライト・ダークでロゴが出ることを確かめる
- [ ] 2.4 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`fix-app-logo-cache`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
- マージ後に `npm run local:update` で普段使いの TimeLog を更新し、サイドバーのロゴが新しい絵になることを確かめる
