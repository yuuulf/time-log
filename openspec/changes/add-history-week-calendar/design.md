# Design

## Context

- 「過去の記録」は `app/history/page.tsx` → `EntryHistory`（サーバー部品、`<Suspense>` の中で `searchParams` を待ち、`connection()`）→ `HistoryContent`（`PeriodControls` と `EntryList`、見出しの横に「CSV 出力」）の構成。表示する範囲は `lib/time-entries/history.ts` の `resolveHistoryQuery(params, now)` が `month`・`range`・`rangeError` のどれかに決める。`PeriodControls` は「集計」ページでも使っている
- 「今日の記録」のタイムラインは `EntryTimeline`（クライアント部品）が 1 日ぶんの格子・帯・今の時刻の線・今より後の透明な領域・背景のクリック・入力欄（`TimelineEntryEditor`）の開閉をまとめて持つ。帯の位置と段は `layoutTimeline(entries, dayStart)`、初期の時刻は `rangeFromClick(minute, entries, now, dayStart)`（`lib/time-entries/timeline.ts`）
- 表示の切り替えは `TodayEntries` が状態を持ち、`IconButtonGroup` で切り替えて Cookie `timelog-today-view` に書く。`TimeTracker` が `cookies()` で読み、`parseTodayView` で最初の表示を決める（`lib/time-entries/today-view.ts`）
- 「CSV 出力」は `/history/export` に `month` か `from`・`to` を渡し、`resolveHistoryQuery` と同じ範囲の記録を返す。ファイル名は見出しから作る
- 日付の関数は `lib/time.ts`（`jstWeekdayFromMonday`・`dayRange`・`parseDateValue`・`formatRangeHeading` など）

## Goals / Non-Goals

**Goals:**
- 1 週間の記録を曜日の列のタイムラインで見て、今日のタイムラインと同じ操作で追加・修正・削除できるようにする
- 今日のタイムラインと見た目・操作をそろえ、部品を共通にする（今日の記録の振る舞いは変えない）

**Non-Goals:**
- 月のマス目、複数週の縦並び、週の始まりの設定
- 期間の指定（`from`・`to`）のカレンダー表示

## Decisions

### 週の表示は URL の `week` で決め、何も指定がないときだけ Cookie を見る

`resolveHistoryQuery(params, now, preferred)` に、Cookie から読んだ表示 `preferred`（`"list" | "timeline"`）を渡す。決め方は次の順。

1. `from` か `to` があれば期間（今までどおり）
2. `week` があれば週（`mode: "week"`）。日付として正しくなければ、または今週より先なら今週。月曜日でなければその日を含む週
3. `month` があれば月（今までどおり）
4. 何もなければ、`preferred` が `timeline` なら今週、それ以外は今月

`HistoryView` に `{ mode: "week"; heading; range; week: "2026-11-16"; prevWeek: string; nextWeek: string | null; days: Date[] }` を足す（`days` は月〜日の各日の 0 時）。見出しは `formatRangeHeading(月曜日, 日曜日)`。

URL を表示の決め手にすることで、週を再読み込みやリンクで開き直せ、サーバーが最初から正しい週の記録を読める。Cookie はサイドバーの「過去の記録」（クエリなし）で開いたときの表示だけに使う。

代替案:
- **表示も URL（`view=calendar`）に入れる**: 「最後に選んだ表示を覚えておく」をサイドバーのリンクで満たせない
- **カレンダーの週をクライアントで切り替える**: 週ごとの記録の読み込みに別の API が要る。今の「URL → サーバー部品で読む」の流れに乗せたほうが単純

### 切り替え先の URL はサーバーで求め、切り替えボタンは Cookie を書いてから移動する

`historySwitchHrefs(view, now)` を `history.ts` に置き、一覧・カレンダーそれぞれの行き先を返す。
- 一覧 → カレンダー: 月・期間の最後の日（`range.to` の前の日）を含む週の月曜日（今週より先なら今週）で `/history?week=…`
- カレンダー → 一覧: 週の月曜日を含む月で `/history?month=…`
- 期間の入力に誤り（`rangeError`）のときは、カレンダーは今週

クライアント部品 `HistoryViewToggle` が `IconButtonGroup`（今日の記録と同じ「一覧」「カレンダー」）を描き、選んだら Cookie `timelog-history-view` を書いて `router.push(href)` する。Cookie は今日の記録と別の名前にして、別々に覚える。`today-view.ts` を表示の設定の共通の置き場とし、`HISTORY_VIEW_COOKIE` と `viewCookie(name, view)` を足す（`todayViewCookie` はこれを使う形にする）。

### タイムラインの格子を `TimelineBoard` に切り出し、今日（1 日）と週（7 日）で使う

`EntryTimeline` から、見出し以外の部分（スクロールする枠・目盛り・日の列・帯・今の時刻の線・今より後の透明な領域・背景のクリック・入力欄の状態）を `TimelineBoard` に移す。

```
TimelineBoard props:
  days: { dayStart: Date; entries: EntryItemData[] }[]   // 1 日か 7 日
  now: Date
  dayHeaders?: { label: string; totalMs: number }[]      // 週のときだけ。列の上に固定して出す
  gutter: string                                           // 帯の右に残す幅（今日 2rem、週 1rem）
  scrollToMinute: number                                   // 開いたときに枠の上端にする分
  projects, suggestions
```

- 日の列ごとに `layoutTimeline(entries, dayStart)` で帯を置く。背景のクリックはその列の `dayStart` と記録で `rangeFromClick` を呼ぶ（`new Date()` を今として渡すのは今までどおり）
- 今より後の透明な領域は、今日の列は今の時刻から下、明日以降の列は列全体、昨日以前の列はなし。今の時刻の線は今日の列にだけ引く
- 入力欄は板全体で 1 つ。上端は今までどおり選んだ位置に合わせる。横は選んだ列の左端に合わせ、右にはみ出さないよう `left: min(列の左端, 100% - 入力欄の幅)` にする（今日の 1 列では今までどおり右寄せになる）
- 週の列見出し（「11/16（月）」と合計時間）は、スクロールする枠の上に `sticky` で置き、目盛りの列と幅をそろえる

`EntryTimeline`（今日）は見出し・`DayHeading` と `TimelineBoard`（1 日、`gutter="2rem"`、列見出しなし）を並べるだけになる。既存の `EntryTimeline.test.tsx` がそのまま通ることで、今日の記録が変わっていないことを確かめる。

`WeekCalendar`（週）は見出し（週の期間）と横に置く要素（切り替え・CSV 出力）、`TimelineBoard`（7 日、`gutter="1rem"`、列見出しあり）を並べる。

代替案:
- **週のカレンダーを別に書く**: 帯・入力欄・今より後の扱いが 2 か所に分かれ、片方だけ直す漏れが起きる

### 開いたときのスクロールの位置は純粋な関数で求める

`initialScrollMinute(days, now)` を `timeline.ts` に置く。今日を含めば今の時刻、含まなければ表示する記録でいちばん早い開始（日の 0 時からの分）、記録がなければ 8 時（480 分）を返す。`TimelineBoard` はそこから 60 分前を枠の上端にする（今までの「今の時刻の 1 時間前」と同じ）。

### 週の切り替えは `WeekControls` にし、カレンダーのときは `PeriodControls` の代わりに出す

`WeekControls` は「前の週」「次の週」の `IconLink`（`ChevronLeft`・`ChevronRight`、今週なら「次の週」は押せない `IconButton`）。`PeriodControls` は「集計」でも使うので手を入れない。`HistoryContent` は `view.mode === "week"` なら `WeekControls` と `WeekCalendar`、それ以外は今までの `PeriodControls` と `EntryList` を出す。どちらも見出しの横に `HistoryViewToggle` と「CSV 出力」を置く。

週の「CSV 出力」のリンクは `/history/export?from=<月曜日>&to=<日曜日>` にする。Route Handler は変えずに期間として解釈され、ファイル名は「記録 2026年11月16日〜2026年11月22日.csv」になる。

### 週のカレンダーは `EntryHistory` で記録と入力候補を読む

週のときは `listEntriesBetween(db, range.from, range.to)` で週の記録を読み、`WeekCalendar` に渡す前に開始日ごとに分ける（`toDateKey` で `days` に振り分ける）。入力欄のために `listTaskNameSuggestions(db, now)` も読む。追加・修正・削除の Server Action は今のまま `refresh()` するので、`EntryHistory` が読み直して反映される。

### 文言と日付の表示

- `lib/time.ts` に `weekStart(date)`（日本時間の月曜日の 0 時）と `formatShortDayHeading(date)`（「11/16（月）」）を足す
- `lib/messages.ts` の `history` に `weekNav: "表示する週"`・`prevWeek: "前の週"`・`nextWeek: "次の週"` を足す。切り替えのボタンの名前は今日の記録と同じ `timeEntries.view` を使う

## Risks / Trade-offs

- [7 列だと帯が細く、タスク名が読めない] → 1 行で省略し、`title` と読み上げ名で全体が分かる（今日と同じ）。帯の右に残す幅は週では 1rem に狭める
- [入力欄（幅 18rem）が列より広い] → 列の左端に合わせ、右にはみ出すときは板の右端に寄せる。隣の列の帯に重なるが、閉じれば選べる（今日と同じ考え方）
- [`EntryTimeline` の切り出しで今日の記録が変わる] → 既存のテストを変えずに通し、ブラウザでも今日の記録を確かめる
- [Cookie と URL の両方が表示に関わり分かりにくい] → 「URL に指定があれば URL、なければ Cookie」の 1 つの規則にし、`resolveHistoryQuery` のテストで確かめる

## Migration Plan

DB は変わらない。Cookie がないときは今までどおり一覧で開く。
