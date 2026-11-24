# Tasks

## 1. 今月・今週の値

- [ ] 1.1 `lib/time-entries/history.ts` の月の表示に `thisMonth`、`WeekView` に `thisWeek` を足す（design「行き先は今月・今週の値を明示した URL にする」）。`history.test.ts` の期待値を合わせ、過去の月・週でも今月・今週の値が入ることをテストする（コミット: 月と週の表示に今月と今週の値を追加）

## 2. ボタン

- [ ] 2.1 `PeriodControls` の月の切り替えに「今月」（`TextLink`、今月なら押せない `TextButton`）を「前の月」「次の月」の右に置き、`WeekControls` に「今週」を同じく「前の週」「次の週」の右に置く。文言は `lib/messages.ts` に置く（design「『今月』『今週』は文字のボタンにし…」）。`PeriodControls.test.tsx`・`WeekControls.test.tsx`・`HistoryContent.test.tsx`・`SummaryContent.test.tsx` で、行き先（`/history?month=…`・`/summary?month=…`・`/history?week=…`）、並び順、今月・今週で押せないこと、期間の指定中は出ないことをテストする（コミット: 過去の記録と集計に今月と今週のボタンを追加）
- [ ] 2.2 README.md の「使い方」の「過去の記録」と「集計」の説明に「今月」「今週」のボタンを追記する（コミット: README に今月と今週のボタンを追記）

## 3. 確認

- [ ] 3.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [ ] 3.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: 「過去の記録」の一覧（カレンダーを覚えているときも一覧の今月になること）・週のカレンダー・「集計」で今月・今週に戻ること、今月・今週で押せないこと、期間の指定中は出ないこと、ライト・ダークの見た目
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`add-current-period-button`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
