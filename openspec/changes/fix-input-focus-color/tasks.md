# Tasks

## 1. 共通のフォーカスのスタイル

- [x] 1.1 `components/ui/fieldStyles.ts` を作り、`fieldFocusClassName`（`focus:border-primary focus:outline-none`）と `fieldFocusVisibleClassName`（`focus-visible:` 版）を export する。用途をコメントに書く（design「フォーカスのクラスを定数にする」）。`npm run typecheck` が通ることを確認する（コミット: 入力欄のフォーカスのスタイルを共通化する定数を追加）

## 2. 各入力欄に適用する

- [x] 2.1 `StartStopForm` のタスク名の入力欄に `fieldFocusClassName` を足す。`StartStopForm.test.tsx` で、タスク名の入力欄に `focus:border-primary` のクラスが付いていることをテストする（コミット: 記録の開始フォームのフォーカスの枠を primary 色にする）
- [x] 2.2 `PeriodControls` の開始日・終了日の入力欄に `fieldFocusClassName` を足す。`PeriodControls.test.tsx` で、両方の入力欄に `focus:border-primary` のクラスが付いていることをテストする（コミット: 期間の指定のフォーカスの枠を primary 色にする）
- [x] 2.3 `ProjectFields` の名前・クライアント名・説明の入力欄に `fieldFocusClassName` を足す。`ProjectFields.test.tsx` で、3 つの欄に `focus:border-primary` のクラスが付き、エラーのある欄に `aria-invalid="true"` が付いたままであることをテストする（コミット: プロジェクトのフォームのフォーカスの枠を primary 色にする）
- [x] 2.4 `ProjectPicker` の `field`・`inline` の両方に `fieldFocusVisibleClassName` を使う（`inline` の `focus-visible:border-border` を置き換える）。`ProjectPicker.test.tsx` で、両方の表示のボタンに `focus-visible:border-primary` のクラスが付いていることをテストする（コミット: プロジェクトのプルダウンのフォーカスの枠を primary 色にする）
- [x] 2.5 `EntryItem` の入力欄の `focus:border-primary focus:outline-none` を `fieldFocusClassName` に置き換える（見た目は変わらない）。`EntryItem.test.tsx` で、タスク名の入力欄に `focus:border-primary` のクラスが付いていることをテストし、既存のテストが通ることを確認する（コミット: 記録一覧の入力欄のフォーカスのスタイルを共通の定数にする）
- [x] 2.6 `npm run build` で生成された CSS で、`aria-[invalid=true]:border-danger` が `focus:border-primary` より後に出てエラーの枠が優先されることを確認する。優先されない場合は design のとおり `focus:not-aria-[invalid=true]:border-primary` に切り替え、テストを合わせる（コミットは切り替えた場合のみ: 入力エラーの枠をフォーカスより優先する）
- [x] 2.7 `npm run format` を実行し、整形の差分があれば機能変更とは別にコミットする（コミット: フォーマットを適用）。`npm run lint`・`npm run typecheck`・`npm test` が通ることを確認する

## 3. ボタン・リンクのフォーカスリング

- [ ] 3.1 `app/globals.css` の `@layer base` に、`:focus-visible` の outline を primary 色（`2px solid var(--primary)`、オフセット 2px）にする規則を足す（design「ボタン・リンクのフォーカスリングは `globals.css` の base レイヤーで一括指定する」）。`app/globals.test.ts` で、base レイヤーにその規則があることをテストする。`npm run build` で生成された CSS で、入力欄・メニュー項目の `focus:outline-none` がこの規則より優先される（utilities レイヤーにある）ことを確認する（コミット: ボタンとリンクのフォーカスリングを primary 色にする）
- [ ] 3.2 `npm run format`・`npm run lint`・`npm run typecheck`・`npm test` が通ることを確認する。整形の差分があれば別にコミットする

## 4. ドキュメントと確認

- [x] 4.1 README.md の更新が必要か確認する（proposal のとおり使い方・設定は変わらないので不要の見込み）。必要なら同じ PR で更新する
- [ ] 4.2 `npm run build` したアプリをブラウザで開き、spec のシナリオを確認する: トップページのタスク名、過去の記録の開始日・終了日、プロジェクトの登録画面の名前・クライアント名・説明、プロジェクトのプルダウン（Tab キーでフォーカス、クリックでは枠が残らない）、記録一覧のタスク名でフォーカスの枠がテーマ色になり、青い枠が出ないこと。名前を空にして登録したエラーの欄はフォーカス中もエラーの色であること。Tab キーでボタン（記録の開始・その他の操作など）とリンク（サイドバーのリンク・記録中のタスクの枠）に移るとテーマ色の枠が出て、クリックでは出ないこと。入力欄・メニュー項目・色の選択に二重の枠が出ないこと。ライト・ダークの両方で確認する
- [ ] 4.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
