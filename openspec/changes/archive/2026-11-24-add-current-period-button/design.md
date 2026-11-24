# Design

## Context

- 月の切り替えは `PeriodControls`（「過去の記録」の一覧と「集計」で共通。`basePath` で行き先を変える）で、`view.mode === "month"` のときに「前の月」「次の月」の `IconLink`（今月なら「次の月」は押せない `IconButton`）を並べる。期間のときは「月ごとの表示」の `IconLink`（`basePath` へ）
- 週の切り替えは `WeekControls` で、「前の週」「次の週」と週の指定を並べる
- 月・週の表示は `lib/time-entries/history.ts` の `HistoryView`（`month`・`prevMonth`・`nextMonth`）と `WeekView`（`week`・`prevWeek`・`nextWeek`）。今月・今週かどうかは `nextMonth`・`nextWeek` が `null` かで分かるが、今月・今週の値そのものは持っていない
- 文字のボタン・リンクは `components/ui/TextButton.tsx` の `TextButton`・`TextLink`（高さ `h-10`、アイコンのボタンとそろう）

## Goals / Non-Goals

**Goals:**
- 1 回で今月・今週に戻れるようにする

**Non-Goals:**
- 期間の指定中の操作の変更

## Decisions

### 「今月」「今週」は文字のボタンにし、前後のアイコンのボタンの右に置く

AGENTS.md はボタンを原則アイコンにするが、「今月」「今週」はアイコンだけでは意味が伝わりにくいため、ユーザーの判断で文字のボタンにする。`TextLink`（`secondary`）で `‹ › 今月` の並びにする（ユーザーの指定）。今月（今週）を表示しているときは、同じ見た目の押せない `TextButton`（`disabled`）にして、位置を変えない（「次の月」と同じ扱い）。

### 行き先は今月・今週の値を明示した URL にする

`HistoryView` の月の表示に `thisMonth`（「2026-11」）、`WeekView` に `thisWeek`（「2026-11-23」）を足し、「今月」は `${basePath}?month=${thisMonth}`、「今週」は `/history?week=${thisWeek}` にする。

`basePath` だけ（クエリなし）にすると、「過去の記録」で表示にカレンダーを覚えているときに今週のカレンダーになってしまう（`resolveHistoryPageQuery` の決め方）。月を明示すれば、一覧の今月が必ず出る。今月・今週かどうかは、表示中の値と比べて求める（`nextMonth === null` と同じ意味）。

### 文言

`lib/messages.ts` の `history` に `thisMonth: "今月"`・`thisWeek: "今週"` を足す。

## Risks / Trade-offs

- [日付が変わったあとに開いたままのページで押すと、描いた時点の今月に移る] → 描いた時点の今月・今週のリンクになる。月や週の境目で開いたままのときだけで、押した先のページは新しい今月を基準に「次の月」が押せるので、もう 1 回で今に戻れる

## Migration Plan

画面のボタンを足すだけで、DB・URL の形は変わらない。
