# Tasks

## 1. CSV の作成

- [x] 1.1 `lib/time-entries/csv.ts` に `toEntriesCsv(entries)` を作る。BOM・列名の行・記録の行（古い順）を CRLF でつなぎ、値の囲みと中のダブルクォートの重ねは RFC 4180 に従う。列名は `lib/messages.ts` に置く（design「CSV の文字列は `lib/time-entries/csv.ts` の純粋な関数で作る」「BOM 付きの UTF-8 にする」）。`csv.test.ts` で、spec「CSV の形式」のシナリオ（記録の行・古い順・記録中・カンマとダブルクォート・タスク名とプロジェクトがない記録）と、BOM と CRLF、記録がないときは列名の行だけになることをテストする（コミット: 記録を CSV にする関数を追加）
- [ ] 1.2 `app/history/export/route.ts` に `GET` を作る。クエリを `resolveHistoryQuery` で解釈し、`listEntriesBetween` で読んだ記録を `toEntriesCsv` で CSV にして、`Content-Type: text/csv; charset=utf-8` と、「記録 <期間の見出し>.csv」の `Content-Disposition`（`filename*` と ASCII の `filename`）を付けて返す。`rangeError` なら 400 を返す。ファイル名の文言は `lib/messages.ts` に置く（design「CSV はサーバーの Route Handler で作る」「ファイル名は…`filename*` で渡す」）。`route.test.ts` で、月・期間それぞれで範囲内の記録だけが入ること、ヘッダー、範囲の誤りで 400 になることを、テスト用の DB でテストする（コミット: 過去の記録の CSV を返す Route Handler を追加）

## 2. CSV 出力のボタン

- [ ] 2.1 `HistoryView` の `month` モードに表示中の月の値（`month`）を加え、`history.test.ts` で値を確かめる。`components/ui/IconDownloadLink.tsx`（`iconControlClassName` の見た目の `<a download>`。`aria-label` と `title` を付ける）を作り、`IconDownloadLink.test.tsx` でテストする。`EntryList` に `headingAction` を加え、`HistoryContent` から「CSV 出力」（`FileSpreadsheet`）のリンクを期間の見出しの横に渡す。リンク先は月なら `/history/export?month=…`、期間なら `/history/export?from=…&to=…` にする（design「ボタンは `<a download>` のアイコンリンクにし、期間の見出しの横に置く」）。`HistoryContent.test.tsx` で、月・期間それぞれのリンク先、名前が「CSV 出力」であること、範囲の誤りではボタンが出ないことをテストし、`EntryList.test.tsx` でトップページの使い方（`headingAction` なし）では何も出ないことを確かめる。`npm test` が通ることを確かめる（コミット: 過去の記録に CSV 出力のボタンを追加）
- [ ] 2.2 README.md の「使い方」の「過去の記録」の説明に、CSV 出力ボタンで表示中の月・期間の記録を CSV に保存できること、列、古い順であること、記録中の記録の扱いを追記する（コミット: README に CSV 出力を追記）

## 3. 確認

- [ ] 3.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [ ] 3.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: 月と期間のそれぞれで「CSV 出力」から期間の見出しの付いた名前のファイルが保存されること、中身が画面の記録と一致すること（古い順）、Excel（または Numbers）で開いて日本語が文字化けしないこと、範囲の誤りでボタンが出ないこと
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`add-history-csv-export`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
