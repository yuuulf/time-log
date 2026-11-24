# Design

## Context

- 帯は `TimelineBoard` の `DayColumn` で `<button>`（`absolute flex items-start overflow-hidden px-2 py-0.5 text-xs`）として描き、中身は 1 行の `<span class="block w-full min-w-0 truncate">`（タスク名と時刻）
- 帯の高さは `max(MIN_BLOCK_PX, 分 × MINUTE_PX)` で決まる（`MINUTE_PX = 0.8`、`MIN_BLOCK_MINUTES = 25` で最小 20px。記録中は 30 分ぶん）。今日のタイムラインと週のカレンダーは同じ `TimelineBoard`
- 帯の記録（`EntryItemData`）には `project?: { id, name, color } | null` があり、アーカイブしたプロジェクトの名前も入っている
- 帯の名前は `messages.timeEntries.timeline.entryLabel(taskName, range)`（「資料作成 09:15〜10:30」）

## Goals / Non-Goals

**Goals:**
- 帯でプロジェクト名を読めるようにする
- 高さのある帯では行を分けて、タスク名・プロジェクト名が省略されにくくする

**Non-Goals:**
- 帯の高さ・幅・並べ方を変えること
- CSS のコンテナクエリで高さに合わせること（下記）

## Decisions

### 入る行数は帯の高さから計算で求める

`text-xs` の 1 行は 16px、上下の余白（`py-0.5`）は合わせて 4px なので、入る行数は `floor((高さ − 4) / 16)`（最小 1）。`lib/time-entries/timeline.ts` に `blockLineCount(heightPx)` を置き、`TimelineBoard` が描くときの高さを渡す。

- 1 行: 20〜35px（25〜44 分。記録中の 30 分の帯もここ）
- 2 行: 36〜51px（45〜64 分）
- 3 行以上: 52px〜（65 分〜）

CSS のコンテナクエリ（高さの `@container`）でも切り替えられるが、帯の高さは描くときに分かっていて、計算で決めればテストで並べ方を確かめられるため、計算で決める。

### 行数ごとの並べ方

`<button>` の中に、行数に合わせて次の中身を置く（どの行も `block truncate` で、幅に入らない部分は「…」で省略）。

- 1 行: `<span truncate>`タスク名・プロジェクト名・時刻`</span>`（今までの 1 行にプロジェクト名を足す）
- 2 行以上: `<button>` の中身を `flex-col` の 1 つの `<span>` にまとめ（`h-full` で高さいっぱい）、時刻の行は `mt-auto` で帯の下端に寄せる。帯の高さは行数ぶんちょうどではない（2 行の帯は 36〜51px）ので、下端に寄せて時刻の位置を終了時刻の近くにそろえる
  - 2 行: タスク名とプロジェクト名の行・時刻の行
  - 3 行以上: タスク名の行・プロジェクト名の行・時刻の行

文字の見た目は今までの考え方に合わせ、タスク名は `font-medium`、プロジェクト名と時刻は `text-muted`（時刻は `tabular-nums`）。並べる要素の間は半角の空白。プロジェクトがないときはプロジェクト名の要素を描かない（3 行以上でも時刻は下端なので、2 行目は空く）。

### 帯の名前にプロジェクト名を入れる

省略されたときにポインタを合わせれば全部読めるよう、`entryLabel(taskName, projectName, range)` にし、プロジェクトがあれば「資料作成 社内ツール 09:15〜10:30」、なければ今までどおり「資料作成 09:15〜10:30」にする。テストで帯を名前で探しているところは、この形に合わせる。

## Risks / Trade-offs

- [行数の計算は 1 行 16px を前提にしており、文字の大きさを変えるとずれる] → 1 行の高さを定数にして計算とクラスの近くに置き、文字の大きさを変えるときは一緒に直す
- [帯の名前が変わり、既存のテストの多くが帯を名前で探している] → 名前を作る関数を共通にして、テストもそれを使う

## Migration Plan

見た目の変更だけで、データ・URL は変わらない。
