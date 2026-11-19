# Tasks

## 1. データと読み書き

- [x] 1.1 `lib/db/schema.ts` の `projects` に `archivedAt` を足し、`npm run db:generate -- --name add_project_archived_at` でマイグレーションを作る（design 決定 1）。`lib/db/client.test.ts` で、マイグレーション後に `archived_at` 列があり既定が null であることをテストする。既存の DB のコピーにマイグレーションを当て、プロジェクトと記録が残ることを確かめる（コミット: プロジェクトにアーカイブした日時を足す）
- [ ] 1.2 `listProjects` にアーカイブの有無の引数を足し、`setProjectArchived` を作る。呼び出し（`ProjectsView`・`TimeTracker`・`EntryHistory`）を合わせる（design 決定 2・4）。`repository.test.ts` で、未アーカイブ・アーカイブ済みの一覧が登録順に分かれること、アーカイブと解除、見つからないとき、アーカイブ済みとも名前が重複できないことをテストする（コミット: プロジェクトをアーカイブ・解除して読み分ける）
- [ ] 1.3 `archiveProjectAction`・`unarchiveProjectAction` を作る（design 決定 2）。`actions.test.ts` で、成功と `refresh()`、不正な id、見つからないときをテストする（コミット: プロジェクトのアーカイブと解除の処理を追加）

## 2. 画面

- [ ] 2.1 `ProjectItem` のメニューに「アーカイブ」（アーカイブ済みでは「アーカイブ解除」）を足し、一覧の見出しの横に「アーカイブ済み」のアイコンボタンを置く。文言を足す（design 決定 3・5）。`ProjectItem.test.tsx` でメニューの項目の並びと、選ぶと確認なしで処理を呼ぶこと、失敗の理由、`ProjectsContent.test.tsx` でボタンのリンク先と名前をテストする（コミット: プロジェクトの一覧からアーカイブできるようにする）
- [ ] 2.2 `app/projects/archived/page.tsx` と `ArchivedProjectsView`・`ArchivedProjectsContent` を作る（design 決定 3）。`ArchivedProjectsContent.test.tsx` で、戻るリンク・見出し・登録順の一覧・メニュー（「アーカイブ解除」「削除」）・ないときの文言、`page.test.tsx` でページの構成をテストする。`npm run build` が通ることを確認する（コミット: アーカイブ済みのプロジェクトの画面を追加）
- [ ] 2.3 詳細画面にアーカイブ済みである旨を出す（design 決定 3）。`ProjectDetail.test.tsx` で、アーカイブ済みのときだけ出ることをテストする（コミット: 詳細画面にアーカイブ済みであることを表示する）
- [ ] 2.4 `ProjectPicker` で、今の値が選択肢にないとき、ボタンに今の値を出し、どの選択肢も選ばれている表示にしない（design 決定 4）。`ProjectPicker.test.tsx` と `EntryItem.test.tsx` で、アーカイブしたプロジェクトの記録のボタンの表示と、タスク名の保存でプロジェクトの id がそのまま送られることをテストする（コミット: 選択肢にない今のプロジェクトをプルダウンで表示する）

## 3. ドキュメントと確認

- [ ] 3.1 README.md の使い方の「プロジェクト」に、アーカイブ・アーカイブ済みの画面・解除と、アーカイブしたプロジェクトが選択肢に出ないことを追記する。README の記述と画面が一致していることを確認する（コミット: README にプロジェクトのアーカイブを追記）
- [ ] 3.2 `npm run build` したアプリをブラウザで開き、spec のシナリオ（一覧からのアーカイブ、アーカイブ済みの画面、解除、アーカイブ済みからの削除、選択肢に出ないこと、紐づいた記録の表示とタスク名の修正・再開、詳細画面の表示、同じ名前での作成の拒否、サイドバーの選ばれている表示）を確認する。幅 375px・1024px で横スクロールが出ないこと、ライト・ダークで読めることも確認する
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する
