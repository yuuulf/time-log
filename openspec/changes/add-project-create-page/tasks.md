# Tasks

## 1. 共通の部品

- [x] 1.1 `components/ui/TextButton.tsx`（`TextButton`・`TextLink`）を作る（design 決定 4）。`TextButton.test.tsx` で、文字とアイコンの表示、`type` の既定、リンク先、variant の見た目をテストする（コミット: アイコンと文字のボタンを追加）
- [x] 1.2 `ProjectFields` を作り、`ProjectDetail` をそれを使う形にする。一覧へ戻るリンクを共通にする（design 決定 1）。`ProjectFields.test.tsx` でラベル・値・エラーの表示と `name` を、既存の `ProjectDetail.test.tsx` がそのまま通ることを確かめる（コミット: プロジェクトの項目の並びを共通にする）

## 2. 登録画面と一覧

- [x] 2.1 `ProjectForm` を登録画面のフォーム（戻るリンク・見出し・`ProjectFields`・「プロジェクトを作成」、成功で一覧へ移動）にし、`app/projects/new/page.tsx` を作る。`lib/messages.ts` の文言を整える（design 決定 2・5）。`ProjectForm.test.tsx` で、項目と最初の色、送る値、成功で `/projects` へ移動すること、エラーで値を残し移動しないこと、`app/projects/new/page.test.tsx` でページの構成とタイトルをテストする（コミット: プロジェクトの登録を登録画面に移す。2.2 と同じコミット）
- [x] 2.2 `ProjectsContent` から登録欄をなくし、一覧の見出しの横に「追加」のリンクを置く。プロジェクトがないときの文言を変える（design 決定 3）。`ProjectsContent.test.tsx` で、登録欄がないこと、「追加」のリンク先、ないときの文言をテストする（2.1 で一覧の登録欄が登録画面のフォームに変わり、一覧のテストが通らなくなるため、2.1 と同じコミットにした）

## 3. ドキュメントと確認

- [x] 3.1 README.md の使い方のプロジェクトの登録の説明を書き換える。README の記述と画面が一致していることを確認する（コミット: README をプロジェクトの登録画面に合わせる）
- [x] 3.2 `npm run build` したアプリをブラウザで開き、spec のシナリオ（一覧の「追加」、登録画面の並び、作成して一覧の最後に出ること、空の名前・重複・長すぎるときに値が残ること、戻るリンク、サイドバーの選ばれている表示、ないときの文言、詳細画面のその場の編集が今までどおり動くこと）を確認する。幅 375px・1024px で横スクロールが出ないこと、ライト・ダークで読めることも確認する
- [x] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する
