# Tasks

## 1. DB

- [x] 1.1 `lib/db/schema.ts` に `projects` テーブルと `time_entries.project_id`（外部キー、`ON DELETE RESTRICT`、インデックス）を足し、`npm run db:generate` でマイグレーションを作る（design 決定 1）。`client.test.ts` で、`projects` テーブルができること、記録が紐づいたプロジェクトを DB で消そうとするとエラーになることをテストする。既存の DB のコピーにマイグレーションを適用し、記録が残ることを確認する（コミット: プロジェクトのテーブルを追加）

## 2. プロジェクトのロジック

- [x] 2.1 `lib/projects/colors.ts` に 10 色のキー・名前・クラスを置き、`app/globals.css` に色のトークン（ライト・ダーク）を足す。色の名前とプロジェクトの文言を `lib/messages.ts` に足す（design 決定 2・6）。`colors.test.ts` で、10 色すべてに名前とクラスがあること、キーかどうかの判定をテストする（コミット: プロジェクトの色を追加）
- [x] 2.2 `lib/projects/validation.ts` に `validateProjectInput` と `parseProjectId` を作る（design 決定 3）。`validation.test.ts` で、名前の空・100 文字と 101 文字、前後の空白、色のキー以外、クライアント名・説明の上限、`projectId` の空・数・不正な値をテストする（コミット: プロジェクトの入力チェックを追加）
- [x] 2.3 `lib/projects/repository.ts` を作る（design 決定 3）。`repository.test.ts` で、登録順の一覧、登録・編集・取得、名前での検索、記録が紐づいていないときの削除と紐づいているときの `"in-use"` をテストする（コミット: プロジェクトの読み書きを追加）
- [x] 2.4 `lib/projects/actions.ts` を作る（design 決定 3）。`actions.test.ts` で、登録・編集・削除の成功と `refresh()`、入力エラー、名前の重複（編集では自分以外）、見つからない id、紐づいた記録があるときの削除をテストする（コミット: プロジェクトの登録・編集・削除の処理を追加）

## 3. プロジェクトの画面

- [x] 3.1 `components/projects/ProjectIcon.tsx` と、色の選択を含む `ProjectForm.tsx`（登録）を作る（design 決定 2・5）。`ProjectIcon.test.tsx` で名前の読み上げと `title`、`decorative` のときに読み上げの対象から外れること、`ProjectForm.test.tsx` で色の選択肢 10 個と最初の選択、入力エラーの表示と入力値の保持をテストする（コミット: プロジェクトの登録欄を追加）
- [x] 3.2 `components/projects/ProjectItem.tsx`（表示・編集・削除）と `ProjectsContent.tsx`（登録欄と一覧、ないときの文言）を作る（design 決定 5）。`ProjectItem.test.tsx` で表示、編集フォームの開閉と初期値、削除の確認と取り消し、削除できないときの理由の表示を、`ProjectsContent.test.tsx` で一覧の順とないときの文言をテストする（コミット: プロジェクトの一覧を追加）
- [x] 3.3 `ProjectsView.tsx` と `app/projects/page.tsx` を作り、`SidebarNav` に「プロジェクト」を足す（design 決定 5）。`app/projects/page.test.tsx` でページ見出し、`SidebarNav.test.tsx` でリンク先と今いるページの表示、`app/layout.test.tsx` でサイドバーの並びをテストする。`npm run build` が `cacheComponents` のエラーなく通ることを確認する（コミット: プロジェクトのページを追加）

## 4. 記録への紐づけ

- [x] 4.1 `lib/time-entries/repository.ts` の `startEntry`・`updateEntry` に `projectId` を足し、記録を読む関数がプロジェクトを付けて返すようにする（design 決定 4）。`repository.test.ts` で、プロジェクト付きの開始・修正・外すこと、一覧と記録中の記録にプロジェクトが付くこと、プロジェクトを編集すると記録の読み込み結果にも反映されることをテストする（コミット: 記録にプロジェクトを紐づけて読み書きする）
- [x] 4.2 `startEntryAction`・`updateEntryAction` で `projectId` を受け付ける（design 決定 4）。`actions.test.ts` で、プロジェクト付きの開始・修正、「プロジェクトなし」、存在しないプロジェクト・不正な値のときに保存しないことをテストする（コミット: 記録の開始と修正でプロジェクトを受け付ける）
- [x] 4.3 `components/projects/ProjectSelect.tsx` を作り、`StartStopForm` にプロジェクトの選択と、記録中の枠のアイコンとプロジェクト名を足す。`TimeTracker` がプロジェクトの一覧を渡す（design 決定 5）。`ProjectSelect.test.tsx` で選択肢の並びと初期値、`StartStopForm.test.tsx` で選択肢の表示、開始後に「プロジェクトなし」に戻ること、記録中の枠にアイコンとプロジェクト名の文字が出ることをテストする（コミット: 記録の開始でプロジェクトを選べるようにする）
- [x] 4.4 `EntryItem` にプロジェクトのアイコン、修正フォームのプロジェクトの選択、再開のフォームの `projectId` を足し、`EntryList`・`TimeTracker`・`EntryHistory`・`HistoryContent` でプロジェクトの一覧を渡す（design 決定 4・5）。`EntryItem.test.tsx` で、アイコンの有無と名前、修正フォームの初期値、再開で `projectId` を送ることをテストし、`EntryList.test.tsx`・`HistoryContent.test.tsx` が通ることを確認する（コミット: 記録の一覧と修正でプロジェクトを扱う）
- [x] 4.5 `RunningTask` / `RunningTaskView` にプロジェクトのアイコンを足す（design 決定 5）。`RunningTaskView.test.tsx` でアイコンの有無と名前をテストする（コミット: サイドバーの記録中のタスクにプロジェクトを表示）

## 5. ドキュメント

- [ ] 5.1 README.md の使い方に、サイドバーの「プロジェクト」からプロジェクトを登録・編集・削除できること（記録が紐づいたプロジェクトは削除できない）、記録の開始・修正でプロジェクトを選べること、一覧などに色のアイコンが出てポインタを合わせると名前が出ることを追記する。README の記述と画面の表示が一致していることを確認する（コミット: README にプロジェクトを追記）

## 6. 結合確認

- [ ] 6.1 `npm run build` したアプリをブラウザで開き、spec のシナリオ（プロジェクトの一覧・登録・入力エラー・重複・編集と記録への反映・削除と取り消し・記録が紐づいたときの削除の拒否、プロジェクトを選んだ開始・選ばない開始、修正で変える・外す、再開での引き継ぎ、一覧・記録中の枠・サイドバーのアイコンとポインタを合わせたときの名前、記録中の枠だけにプロジェクト名の文字が出ること、サイドバーからの移動）を確認する。ライト・ダークで 10 色が見分けられること、幅 375px で 3 つのページに横スクロールが出ないことも確認する
- [ ] 6.2 PR を作成し、CI のチェックがすべて成功することを確認する
