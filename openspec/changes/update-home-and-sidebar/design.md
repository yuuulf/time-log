# Design

## Context

- トップページの `TimeTracker` は `listRecentEntries(db, now)`（現在時刻から 30×24 時間前以降に開始した記録）を読み、`EntryList` に渡している。`EntryList` は開始日ごとに見出し（「2026年11月20日（金）」）を付けて並べ、一覧の見出しの既定は「記録」
- `listRecentEntries` と `RECENT_DAYS` はトップページだけで使っているが、`repository.test.ts`・`actions.test.ts` でも記録を読み直すのに使っている
- 期間の記録は `listEntriesBetween(db, from, to)` で読める。日本時間の日付の区切りは `lib/time.ts`（`toDateKey`・`parseDateValue` など）にある
- サイドバー（`components/layout/Sidebar.tsx`）は、アプリ名 → 記録中のタスク（サーバー部品 `RunningTask` → 表示の `RunningTaskView`、`<Suspense>` の中）→ ページのリンク（クライアント部品 `SidebarNav`、`usePathname` で今いるページに `aria-current="page"`）の順
- 幅 768px 未満で開いたサイドバーは、中のリンク（`a` 要素）が押されると閉じる（`SidebarShell`）

## Goals / Non-Goals

**Goals:**

- トップページの記録の読み込みを今日の範囲だけにする
- 記録中のタスクの枠をリンクにしても、今の表示（見出し・開始時刻・プロジェクトのアイコン・タスク名）と読み上げの順を崩さない

**Non-Goals:**

- `EntryList` の作りの変更（「過去の記録」と共通のため）

## Decisions

### 1. 今日の記録は `listEntriesOfDay(db, now)` で読む

`lib/time.ts` に、日本時間のその日の 0 時から翌日 0 時までの範囲を返す `dayRange(date)` を足す（`parseDateValue(toDateKey(date))` と、その 24 時間後）。`repository.ts` の `listRecentEntries`・`RECENT_DAYS` を、`listEntriesBetween` で `dayRange(now)` の範囲を読む `listEntriesOfDay(db, now)` に置き換える。

- `listRecentEntries` を使っていたテストは `listEntriesOfDay` に移す。テストの記録の時刻と `now` が同じ日になっていない箇所は、`listEntriesBetween` で読むか時刻を合わせる
- 別案: `listRecentEntries` を残す。使う所がなくなるため残さない

### 2. 一覧の見出しと空のときの文言

`TimeTracker` から `EntryList` に `heading`（「今日の記録」）と `emptyMessage`（「今日の記録はまだありません。タスク名を入力して開始ボタンを押すと記録が始まります。」）を渡す。日付ごとの見出し（今日の日付）は `EntryList` のまま残す（何日の記録かが分かるため）。

- 文言は `messages.timeEntries` の `listHeading`・`empty` を書き換える。「過去の記録」は独自の文言を渡しているので影響しない

### 3. 記録中のタスクの枠をリンクにする

`RunningTaskView` の中身全体を `next/link` の `Link`（`href="/"`）で包む。今いるページを知るため、リンクの部分はクライアント部品 `RunningTaskLink` に分け、`usePathname()` が `/` のとき `aria-current="page"` と選ばれている見た目（`SidebarNav` と同じ `bg-border/60`）を付ける。それ以外はポインタを合わせたときの背景（`hover:bg-border/40`）を付ける。

- `RunningTaskView`（サーバーで描く表示）は、`RunningTaskLink` の子として今の表示を渡す。データの読み込みはサーバー部品のまま
- `usePathname` は動的なパラメータのページでプリレンダー中に止まるため、`SidebarNav` と同じく `<Suspense>` で囲み、フォールバックでは選ばれている表示なしのリンクを出す。記録中のタスクはもともと `<Suspense>` の中にあるので、その中に置けば足りる
- リンクの中に見出し（`h2`「記録中のタスク」）を置いたままにする。HTML ではリンクの中に見出しを置ける。読み上げではリンクの名前が「記録中のタスク 開始時刻 09:10 （プロジェクト名） 資料作成」のように中身の順で読まれる
- 余白: 今は外側の `div` に `px-3` を付けている。これをやめてリンクに `block rounded-md px-3 py-2` を付ける。文字の左の位置はアプリ名・ページのリンクとそろったまま、選ばれている表示やポインタを合わせたときの背景が、ページのリンクと同じ形で出る
- 幅 768px 未満のサイドバーは、リンクが `a` 要素なので今の仕組みで閉じる

### 4. ページのリンクから「ホーム」をなくす

`SidebarNav` の `pages` から `/` を外す。「ホーム」の文言（`messages.nav.home`）はトップページの読み上げ用の見出し（`h1`）で使っているので残す。

## Risks / Trade-offs

- [昨日から記録中の記録は、今日の一覧に出ない] → 記録中の枠には出るので終了はできる。終了後の記録は「過去の記録」で直せる（spec のシナリオに明記）
- [トップページから昨日の記録を直すには「過去の記録」へ移る必要がある] → 一覧を今日だけにする目的どおり。README で案内する
- [サイドバーの記録中のタスクがリンクになり、読み上げの名前が長くなる] → 中身をそのまま読む形で、何のリンクかは見出しの「記録中のタスク」で分かる
