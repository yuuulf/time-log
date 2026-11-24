# Design

## Context

- トップページの「今日の記録」は、サーバー部品の `TimeTracker`（`<Suspense>` の中で `await connection()`）が `listEntriesOfDay` で今日に開始した記録を新しい順に読み、`EntryList` に渡している。`EntryList` は見出し（`<h2>`）と横に置く要素（`headingAction`）、日付の見出しと合計時間、記録の行（`EntryItem`）を描く。`EntryList` には `"use client"` がなく、サーバー・クライアントのどちらからも使える
- 記録を作る処理は「開始」（`startEntry`。記録中の記録を作る）だけで、終了済みの記録を直接作る処理はない。修正は `updateEntryAction(id, prev, formData)`（`taskName`・`startedAt`・`endedAt`・`projectId`）で、`validateUpdateInput` が確かめ、`updateEntry` が日をまたぐときに `splitByJstDay` で日ごとに分ける。削除は `deleteEntryAction(id)` で、`EntryItem` は `window.confirm` で確認してから呼ぶ。どれも成功したら `refresh()` で画面を新しくする
- 時刻の入力欄は `datetime-local`（秒まで）で、値は `toDateTimeLocalValue`・`parseDateTimeLocalValue`（日本時間）で変換する
- プロジェクトのプルダウンは `ProjectPicker`（`value`・`projects`・`onChange`）。フォームでは `StartStopForm` のように選んだ id を hidden の `projectId` で送る。プロジェクトの色のクラスは `lib/projects/colors.ts`（`bg-project-*`・`text-project-*`）
- メニュー・プルダウンの開閉は `components/ui/usePopover.ts`（外側を押す・フォーカスが外に出る・Escape で閉じる）
- 表示の設定を保存している仕組みはまだない。`cookies()` は Cache Components では `<Suspense>` の中で呼べばその部分だけリクエスト時に描く（`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`）

## Goals / Non-Goals

**Goals:**
- 今日の記録を時間軸で見て、空き時間をそのまま選んで記録を足せるようにする
- 追加・修正の確かめ方と保存（日の分割）を、既存の修正と同じ規則にそろえる

**Non-Goals:**
- ドラッグでの移動・長さの変更、範囲を選ぶ追加
- 「過去の記録」ページのタイムライン
- 今の時刻の線を、時間の経過に合わせて動かし続けること（「記録の終了」の「経過時間を数え続ける表示はしない」に合わせ、描いた時点の時刻で置く）。記録中の帯は今の時刻に合わせて伸ばさず、終了するまで決まった高さにする

## Decisions

### 表示の設定は Cookie に保存し、サーバーで読んで最初から正しい表示を描く

切り替えのボタンを選んだら、クライアントで表示を切り替え、`document.cookie` に `timelog-today-view=timeline`（または `list`）を 1 年の期限で書く。`TimeTracker` は `cookies()` でこの値を読み、知らない値やないときは一覧にする。`TimeTracker` はもともと `<Suspense>` の中でリクエストごとに描いているので、`cookies()` を足してもページの描き方は変わらない。

代替案:
- **localStorage**: サーバーで読めないため、最初は一覧で描いてからタイムラインに変わる（ちらつく、hydration の食い違いを避ける工夫が要る）
- **URL のクエリ**: 開き直したときに覚えておけない（サイドバーの「今日の記録」のリンクはクエリなし）
- **Server Action で Cookie を書く**: サーバーへの往復が増えるだけで、得るものがない

### 「今日の記録」をクライアント部品 `TodayEntries` にまとめ、見出しの横に切り替えボタンを置く

`TodayEntries`（`"use client"`）が表示の状態（最初の値は `TimeTracker` から受け取る）を持ち、一覧なら今の `EntryList` を、タイムラインなら `EntryTimeline` を描く。切り替えのボタン `TodayViewToggle` は、両方の `headingAction` に渡して同じ見出しの横に置く。ボタンは lucide の `List` と `CalendarDays` を使った `IconButton` 2 つで、名前（`aria-label`・`title`）は「一覧」「カレンダー」。`aria-pressed` で選んでいるほうを示し、選んでいるほうは `primary`、もう一方は `secondary` の見た目にする。

`EntryTimeline` も `EntryList` と同じ見出し（`<h2>`「今日の記録」）と、日付の見出しと合計時間の行を描く。日付の見出しの行は `EntryList` から `DayHeading`（日付と合計時間）として切り出して両方で使う。今日の記録がないときの日付は、`TimeTracker` が渡す今日の日付を使う。

### 帯の位置と重なり、初期の時刻は `lib/time-entries/timeline.ts` の純粋な関数で求める

DOM から切り離してテストできるよう、計算はすべて純粋な関数にする。時刻は日本時間の 0 時からの分（0〜1440）で扱う。

- `minuteOfDay(date, dayStart)`: 0 時からの分（範囲外は 0〜1440 に丸める。この変更より前に保存された翌日に終わる記録は 24 時で切る）
- `layoutTimeline(entries, dayStart)`: 各記録の `startMinute`・`endMinute`（記録中は開始の 30 分後。`RUNNING_BLOCK_MINUTES = 30`）と、重なりの段 `column`・`columns` を返す。開始の早い順に並べ、時間が続けて重なる記録をひとまとまりにし、まとまりの中で空いている最も左の段に置く。帯の幅は `1 / columns`
- `rangeFromClick(minute, entries, now, dayStart)`: 選んだ分から入力欄の初期の開始・終了の日時を返す。今の時刻より後なら `null`。開始は 15 分単位に切り捨て、選んだ位置より前で終わる記録の終了のほうが遅ければそこにする。終了は開始の 30 分後と、選んだ位置より後で始まる記録の開始と、今の時刻（分に切り捨て）のうち最も早いもの。記録中の記録は終了時刻がないので「前で終わる記録」には数えない（その開始時刻は「後で始まる記録」として数える）
- `rangeBeforeNow(now)`: 「記録の追加」ボタン用。今の時刻（分に切り捨て）の 30 分前〜今の時刻

### タイムラインは 1 時間 48px の縦の格子を、高さを決めた枠の中でスクロールさせる

`EntryTimeline` は高さ 32rem ほどのスクロールする枠の中に、1440 分ぶん（1 時間 48px、合計 1152px）の格子を描く。左に「0:00」〜「23:00」の目盛り、右に帯を置く領域を並べる。帯は `top`・`height` を分から計算した値の `style` で置き、高さは最小 20px にする。帯の色はプロジェクトの色の背景（`bg-project-*` に透明度の修飾子）と左の線、プロジェクトがないときは `bg-muted` 系にする（色コードは書かない）。今の時刻の線は `bg-primary` の 1px の線で引く。最初に描いたときに、枠の `scrollTop` を今の時刻の 1 時間前の位置に合わせる。

帯は `<button>` にし、読み上げ名は「資料作成 09:15〜10:30」（記録中は「資料作成 13:00〜記録中」）のように時刻まで含める。

### 空いている場所の選択はポインタで扱い、キーボードは「記録の追加」ボタンで代える

帯を置く領域の背景の `onClick` で、`event.clientY` と領域の `getBoundingClientRect()` から分を求めて `rangeFromClick` に渡す。帯の `<button>` は `stopPropagation` して背景のクリックにしない。背景はフォーカスできる部品にしない（1 分ずつ選べるキーボード操作は重く、読み上げでも分かりにくい）代わりに、見出しの近くに `Plus` の `IconButton`「記録の追加」を置く。jsx-a11y のルールに背景の `onClick` を指摘されたら、キーボードの代わりがあることをコメントに書き、そのルールだけをその行で外す。

### 入力欄は 1 つの `TimelineEntryEditor` を追加と修正で使い分け、Server Action に送る

`EntryTimeline` が「開いている入力欄」の状態（`{ mode: "create", startedAt, endedAt, top }` か `{ mode: "edit", entry, top }`、または閉じている）を 1 つだけ持つ。入力欄は帯の領域の中に絶対位置で置き、`top` は選んだ位置（帯ならその帯）に合わせ、下にはみ出さないよう格子の高さで丸める。

入力欄はタスク名（`datalist` で候補）・`ProjectPicker`（`variant="field"`、hidden の `projectId`）・開始時刻・終了時刻（`datetime-local`、`step=1`）と、ボタン（「追加」または「保存」、修正なら「削除」、「閉じる」）を持つフォーム。ボタンは `IconButton`（`Check`・`Trash2`・`X`）にする。`useActionState` で、追加なら新しい `createEntryAction`、修正なら既存の `updateEntryAction.bind(null, id)` を呼び、`ok` なら閉じる。誤りは欄ごとに表示し、入力した値はフォームに残す（`defaultValue` を使い、送信で消さない）。記録中の記録の修正では終了時刻の欄を出さない（`updateEntryAction` は空の `endedAt` を受け付ける）。修正のプロジェクトの初期値は記録の `project` をそのまま渡し、アーカイブしたプロジェクトも名前を出す（`EntryItem` と同じ）。削除は `window.confirm(t.confirmDelete)` のあとで `deleteEntryAction` を呼ぶ。

閉じ方は `usePopover` と同じ考え方（`pointerdown` が入力欄の外なら閉じる、Escape で閉じる）を入力欄の中で持つ。ボタンで開くとは限らないため `usePopover` の `triggerRef` は使わず、開く直前の `document.activeElement`（帯か「記録の追加」ボタン、背景のクリックなら `body`）を覚えておき、Escape・「閉じる」で閉じたときにそこへフォーカスを戻す。開いたらタスク名の入力欄にフォーカスする。背景の別の場所を選んだときは、外側の `pointerdown` で閉じたあと、その場所の入力欄を開く。

### 終了済みの記録の追加は `createEntry`・`createEntryAction` を新しく作る

- `validateCreateInput`: `validateUpdateInput(input, { isRunning: false, now })` と同じ確かめ方なので、それを呼ぶだけの関数にする（名前で用途を分ける）
- `createEntry(db, { taskName, projectId, startedAt, endedAt }, now)`: トランザクションの中で `splitByJstDay` の区間ごとに記録を足し、開始日の記録を返す。記録中の記録には触れない
- `createEntryAction(prev, formData)`: 入力を確かめ、`readProjectId` でプロジェクトを読み（削除されていれば `projectNotFound`）、`createEntry` で保存して `refresh()` する

代替案:
- **`startEntry` と `updateEntry` を続けて呼ぶ**: 記録中の記録を終了させてしまううえ、2 回に分かれて途中で失敗したときに記録中の記録が残る

### 文言

`lib/messages.ts` の `timeEntries` に足す。
- `view`: `{ label: "表示", list: "一覧", timeline: "カレンダー" }`
- `timeline`: `{ add: "記録の追加", editorLabel: "記録の入力", create: "追加", save: "保存", close: "閉じる", entryLabel: (taskName, range) => ... }`

## Risks / Trade-offs

- [jsdom には配置の計算がない] → 位置の計算は純粋な関数でテストし、部品のテストでは `getBoundingClientRect` をスタブにしてクリックの位置を与える
- [帯が短いとタスク名が入らない] → 最小の高さを 20px にし、1 行で省略（`truncate`）して、全体は読み上げ名と `title` で分かるようにする
- [重なる記録が多いと帯が細くなる] → 1 人の記録なので重なりは少ない。細くても読み上げ名と `title` で分かる
- [入力欄が帯の上に重なり、下の帯を選べない] → 入力欄を閉じれば選べる。入力欄は幅を領域の一部（右寄せ・最大幅）にする
- [今の時刻の線は描いた時点のまま] → 記録の操作や再読み込みで新しくなる。動かし続けないことは Non-Goals に書いたとおり

## Migration Plan

DB のスキーマは変わらない。Cookie がないときは一覧なので、今までの表示のまま使い始められる。
