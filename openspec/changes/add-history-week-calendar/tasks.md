# Tasks

## 1. 週の表示の決め方

- [x] 1.1 `lib/time.ts` に `weekStart(date)`（日本時間の月曜日の 0 時）と `formatShortDayHeading(date)`（「11/16（月）」）を足し、`time.test.ts` でテストする。`lib/time-entries/history.ts` に、`week` のクエリと Cookie の表示 `preferred` を解釈する `resolveHistoryPageQuery` を加え（`resolveHistoryQuery` は「集計」・CSV でも使うので変えない）、`mode: "week"`（見出し・範囲・前後の週・各日）を返す（design「週の表示は URL の `week` で決め…」）。`history.test.ts` で、spec「週の切り替え」のシナリオ（月曜日でない日付・正しくない日付・今週より先・前後の週・今週は次の週なし）と、指定がないときに Cookie で今週か今月になること、`from`・`to` が `week` より優先され、`month` の指定は Cookie より優先されることをテストする（コミット: 過去の記録の週の表示を解釈する）
- [x] 1.2 `history.ts` に `historySwitchHrefs(view, now)` を、`today-view.ts` に `HISTORY_VIEW_COOKIE` と `viewCookie(name, view)` を足す（design「切り替え先の URL はサーバーで求め…」）。`history.test.ts` で spec「過去の記録の表示の切り替え」の行き先（月・期間・今月・範囲の誤り → 週、週 → 月）を、`today-view.test.ts` で Cookie の文字列をテストする（コミット: 過去の記録の表示を切り替える行き先と Cookie を追加）
- [x] 1.3 `lib/time-entries/timeline.ts` に `initialScrollMinute(days, now)` を足し、`timeline.test.ts` で今日を含む・含まない（いちばん早い記録）・記録がない（8 時）をテストする（design「開いたときのスクロールの位置は純粋な関数で求める」）（コミット: タイムラインの最初のスクロールの位置を求める関数を追加）

## 2. 週のカレンダー

- [x] 2.1 `EntryTimeline` から格子・日の列・帯・今の時刻の線・今より後の領域・背景のクリック・入力欄の状態を `TimelineBoard` に切り出し、`EntryTimeline` はそれを 1 日で使う形にする（design「タイムラインの格子を `TimelineBoard` に切り出し…」）。既存の `EntryTimeline.test.tsx` を変えずに通すことで今日の記録が変わらないことを確かめる（コミット: タイムラインの格子を部品に切り出す）
- [x] 2.2 `TimelineBoard` を複数の日に対応させ（列ごとの帯・今日の列だけの今の時刻の線・明日以降の列全体の今より後の領域・列見出し・`gutter`・入力欄の横の位置）、`WeekCalendar` を作る。`TimelineBoard.test.tsx`・`WeekCalendar.test.tsx` で spec「週のカレンダーの表示」のシナリオ（列と見出し・帯の列と位置・日ごとの合計時間・今週の今の時刻・最初のスクロール）をテストする（コミット: 週のカレンダーを追加）
- [x] 2.3 `WeekControls`（「前の週」「次の週」）と `HistoryViewToggle`（Cookie を書いて移動）を作り、`EntryHistory` で Cookie を読んで週の記録と入力候補を渡し、`HistoryContent` で週なら `WeekControls` と `WeekCalendar`、それ以外は今までの表示を出す。週の「CSV 出力」は `from`・`to` のリンクにする。文言は `lib/messages.ts` に置く（design「週の切り替えは `WeekControls` にし…」「週のカレンダーは `EntryHistory` で…」）。`WeekControls.test.tsx`・`HistoryViewToggle.test.tsx`・`HistoryContent.test.tsx` で、週の切り替えのリンク、今週の「次の週」が押せないこと、週のときに月・期間の切り替えを出さないこと、切り替えで Cookie を書いて行き先へ移動すること、週の CSV のリンクをテストする（コミット: 過去の記録を週のカレンダーに切り替えられるようにする）
- [x] 2.4 週のカレンダーでの追加・修正・削除を確かめ、足りないところを直す（その日の列の記録からの初期の時刻、明日以降の列で開かないこと）。`WeekCalendar.test.tsx` で spec「週のカレンダーでの記録の操作」のシナリオをテストする（コミット: 週のカレンダーから記録を追加・修正できるようにする）
- [x] 2.5 README.md の「使い方」の「過去の記録」の説明に、一覧とカレンダー（週）の切り替え（今日の記録とは別に覚える）、週の切り替え、カレンダーからの追加・修正・削除、週の CSV 出力を追記する（コミット: README に過去の記録のカレンダーを追記）

- [ ] 2.6 `lib/time.ts` に `calendarWeeks(year, month)`（月曜日始まりで、その月を含む週ごとの日付）を足して `time.test.ts` でテストし、`components/ui/WeekPicker.tsx`（入力欄の見た目のボタン、月のカレンダー、行ごとの強調、今週より先は選べない、キーボード操作、hidden の値）を作って `WeekPicker.test.tsx` で spec「週の指定」のシナリオをテストする（design「週の指定は自前の月のカレンダー `WeekPicker` で選ぶ」）（コミット: 週を選ぶ入力欄を追加）
- [ ] 2.7 `WeekControls` に `WeekPicker` と「表示」ボタンのフォームを足し、文言を `lib/messages.ts` に置く。`WeekControls.test.tsx`・`HistoryContent.test.tsx` を合わせ、README に週の指定を追記する（コミット: 週のカレンダーで週を指定できるようにする）

## 3. 確認

- [ ] 3.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [ ] 3.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: 表示の切り替えと行き先・覚えておくこと（今日の記録と別）、週の列・見出し・合計時間・帯・今の時刻の線・最初のスクロール、週の切り替えと URL、週のカレンダーからの追加・修正・削除、明日以降の列で追加できないこと、週の CSV、今日の記録のタイムラインが変わっていないこと、ライト・ダークの見た目
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`add-history-week-calendar`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
