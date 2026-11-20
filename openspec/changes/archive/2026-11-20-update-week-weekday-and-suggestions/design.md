# Design

## Context

- 週ごとの集計の日付は `SummaryContent` で `t.weekRange(formatMonthDay(first), formatMonthDay(last))` として組み立てている。`formatMonthDay`（`lib/time.ts`）は「11月16日」を返す。同じファイルの `formatDateHeading` は、`weekdayFormatter`（`Intl.DateTimeFormat("ja-JP", { weekday: "short" })`、日本時間）で「2026年11月18日（水）」を作っている
- `formatMonthDay` は `lib/summary/summarize.test.ts` でも週の範囲の確認に使っている
- タスク名の候補は `listTaskNameSuggestions(db)`（`lib/time-entries/repository.ts`）が、タスク名ごとの最新の開始時刻（`max(startedAt)`）の新しい順に `SUGGESTION_LIMIT = 20` 件を返す。`TimeTracker` がリクエストごとに呼び、`StartStopForm` の `<datalist>` に渡している
- 日本時間の日の境目は `dayRange(date)`（その日の 0 時〜翌日 0 時）で求められる

## Goals / Non-Goals

**Goals:**

- 曜日付きの月日の表示を `lib/time.ts` の関数にし、日付の見出しと同じ曜日の表記を使う
- 候補の期間の基準時刻を引数で受け取り、テストで日付を固定できるようにする

**Non-Goals:**

- 期間・件数を設定にすること（proposal のスコープ外）

## Decisions

### 曜日付きの月日は `formatMonthDayWithWeekday` を新しく作る

- `lib/time.ts` に `formatMonthDayWithWeekday(date)`（「11月16日（月）」）を足し、`SummaryContent` の週の範囲で使う。曜日は既存の `weekdayFormatter` を使い回す
- `formatMonthDay` の中身を変える案は採らない。`formatMonthDay` は集計のテストなどでも使っており、意味を変えると影響が週ごとの集計の外に広がる。今のところ `formatMonthDay` の画面での利用は週ごとの集計だけになるが、関数は残す（テストでの利用があるため）
- `messages.summary.weekRange` は「〜」でつなぐだけなので変えない

### 候補は「今日を含む 30 日間」の開始時刻で絞る

- `listTaskNameSuggestions(db, now)` にし、`from = dayRange(now).from - 29 日` 以降に開始した記録だけを数える（`where startedAt >= from`）。並びは今と同じく、その期間内での最新の開始時刻の新しい順
- 日の境目は日本時間の 0 時にする。24 時間 × 30 の移動窓にしない理由: アプリの他の期間（今日の記録・月・期間の指定）がすべて日本時間の日付で区切っていて、「何日前まで出るか」が時刻によって変わらないほうが分かりやすい
- 30 日より前にも使ったタスク名は、期間内に 1 回でも使っていれば候補に出る。並びは期間内の最新の開始時刻で決まる
- `SUGGESTION_LIMIT` を 10 にし、期間の日数は `SUGGESTION_DAYS = 30` として同じファイルに置く
- `TimeTracker` は既に `now` を持っているので、それを渡す

### テスト

- `lib/time.test.ts`: `formatMonthDayWithWeekday` が日本時間の日付と曜日を返すこと（UTC では前日になる時刻を含む）
- `lib/time-entries/repository.test.ts`: 30 日目の 0 時ちょうどは含み、31 日目の 23:59 は含まないこと、上限 10 件
- `components/summary/SummaryContent.test.tsx`: 週の行が「11月2日（月）〜11月8日（日）」の形で表示されること

## Risks / Trade-offs

- [週の日付が長くなり、幅 375px で週の列が 2 行に折り返す] → 週の列は `whitespace-nowrap` を付けておらず、横スクロールにはならない。折り返しの見た目はブラウザで確認し、読みにくければ「〜」の後で折り返すよう調整する
- [30 日より前のタスク名をまた使いたいときに候補に出ない] → 一度入力して記録すれば次からは候補に出る。期間を設定にするのはスコープ外
