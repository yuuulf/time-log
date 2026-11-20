# Tasks

## 1. タイトル

- [ ] 1.1 `app/layout.tsx` の `metadata.title` を「TimeLog」だけにし、`app/history`・`app/summary`・`app/projects`・`app/projects/new`・`app/projects/[id]`・`app/projects/archived` の `page.tsx` から `metadata` を削除する（design 決定 1）。`app/layout.test.tsx` でタイトルが「TimeLog」であること、各ページの `page.test.tsx` で `metadata` を export していないことをテストする（design 決定 2）。`npm run build` が通り、出力された各ページの HTML の `<title>` が `TimeLog` であることを確かめる（コミット: タブのタイトルをアプリ名だけにする）

## 2. ドキュメントと確認

- [ ] 2.1 README.md の更新が必要か確認する（proposal の見込みでは不要）。必要なら同じ PR で更新する
- [ ] 2.2 `npm run build` したアプリをブラウザで開き、トップページ・「過去の記録」・「集計」・「プロジェクト」・プロジェクトの詳細画面・登録画面・アーカイブ済みの画面で、タブのタイトルが「TimeLog」だけであることを確認する
- [ ] 2.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
