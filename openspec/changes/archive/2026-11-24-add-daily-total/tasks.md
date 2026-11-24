# Tasks

## 1. 作業時間の計算をまとめる

- [x] 1.1 `lib/time.ts` に `entryDurationMs({ startedAt, endedAt })`（作業時間を分に切り捨てたミリ秒。記録中は 0）を追加し、`lib/summary/summarize.ts` の `durationMs` をこれに置き換える（design「記録 1 件の作業時間の関数を `lib/time.ts` に置き、集計と共有する」）。`lib/time.test.ts` で、秒の切り捨て・記録中は 0・終了が開始より前でも負にならないことをテストし、既存の `summarize.test.ts` が変更なしで通ることを確かめる（コミット: 記録の作業時間の計算を共通にする）

## 2. 日ごとの合計時間

- [x] 2.1 `EntryList.tsx` の日付のまとまりに合計を持たせ、見出しの行の右端に `formatDuration` で表示する。読み上げ専用の「合計」を前に付け、文言は `lib/messages.ts` の `timeEntries.dayTotal` に置く（design「合計は `EntryList` の日付のまとまりごとに計算する」「表示は見出しの行の右端に合計だけを出し、読み上げには「合計」を添える」）。`EntryList.test.tsx` で、日ごとの合計（複数の日）・秒を記録ごとに切り捨てて足すこと・記録中の記録を含めないこと・記録中だけの日は「0分」・合計に「合計」が添えられること・見出しの名前が日付のままであることをテストする。`npm test` が通ることを確かめる（コミット: 記録の一覧に日ごとの合計時間を表示する）
- [x] 2.2 README.md の「使い方」の記録の一覧の説明に、日付の見出しの右端にその日の合計時間（記録中の記録は含めない）が出ることを追記する（コミット: README に日ごとの合計時間を追記）

## 3. 確認

- [x] 3.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [x] 3.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: トップページと「過去の記録」で日付の見出しの右端に合計が出ること、記録中の記録が含まれないこと、記録の終了・削除で再読み込みなしに合計が変わること、幅 375px で見出しの行が崩れず横スクロールが出ないこと
- [x] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`add-daily-total`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
