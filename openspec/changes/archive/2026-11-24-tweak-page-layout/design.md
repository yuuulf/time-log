# Design

## Context

- 帯は `TimelineBoard` の `DayColumn` で `<button>` として描き、中身は 1 行の `<span class="block truncate">`。`<button>` は既定で中身を上下の真ん中に置くため、高さのある帯では文字が真ん中に出る
- 「過去の記録」の見出しの横の要素は `HistoryContent` の `headingAction`（`HistoryViewToggle` と `IconDownloadLink` の並び）で、`EntryList`・`WeekCalendar` の見出しの行（`flex items-center gap-3`）に入る
- ページの見出しは各ページ（`app/history/page.tsx` など）と `ProjectDetail`・`ProjectForm` に `text-3xl font-bold` で直接書いてあり、`<main>` は `py-12`、見出しの下の内容は `mt-8`（プロジェクトの詳細・作成は見出しを含む `space-y-6` の中）

## Goals / Non-Goals

**Goals:**
- 帯の文字を開始時刻の近くに出す
- 「CSV 出力」を表示の切り替えと離す
- 見出しと余白を小さくし、本文に使える縦の幅を広げる
- 空いた縦の幅と、画面の高さの余りをカレンダーの枠に回す

**Non-Goals:**
- 見出しを共通の部品にまとめ直すこと（クラスの変更だけにとどめる）

## Decisions

### 帯の `<button>` を `flex items-start` にして中身を上端に寄せる

`<button>` の既定の上下の真ん中寄せは、`display: flex` と `align-items: flex-start` で上端寄せにできる。中身の `<span>` は `min-w-0 w-full` にして、今までどおり 1 行で省略（`truncate`）されるようにする。短い帯（最小 20px）では見た目は変わらない。

### 「CSV 出力」は `ml-auto` で見出しの行の右端に寄せる

見出しの行は `flex` なので、`IconDownloadLink` に `ml-auto` を付ければ右端に寄る（`EntryList`・`WeekCalendar` の見出しの行の作りは変えない）。表示の切り替えは見出しの横に残す。

### 見出しは `text-xl`、ページの上下は `py-6`、見出しの下は `mt-4` にそろえる

- 見出し: `text-3xl`（30px）→ `text-xl`（20px）。一覧の見出し（`text-lg`、18px）より少し大きく、ページの見出しと分かる大きさ
- `<main>`: `py-12`（48px）→ `py-6`（24px）。トップページも同じにする。「集計」の `print:py-0` はそのまま
- 見出しの下: `mt-8`（32px）→ `mt-4`（16px）。プロジェクトの詳細・作成は見出しと戻るリンクのまとまり（`space-y-2`）の下が `space-y-6` なので、ここは変えない（見出しの文字だけ小さくする）

各ページに直接書いているクラスを変える。共通の部品にすると変更が広がるため、今回は行わない。

### タイムラインの枠の高さは、最小 560px で画面の下端まで広げる

`TimelineBoard` の枠（スクロールする領域）は `max-h-[32rem]`（512px）の固定だった。

- 最小: 見出しと余白を小さくして空く縦の幅（`<main>` の上 24px・見出しの行の高さ 8px・見出しの下 16px の合わせて 48px）を足した 560px（`max-h-[35rem]`）。サーバーで描いた最初の表示もこの高さ
- 画面が高いとき: 開いたとき・画面の大きさが変わったときに、枠のページの上端からの位置を測り、`max(560, 画面の高さ − 枠の上端の位置 − 24)` px を `style.maxHeight` にする（24px は `<main>` の下の余白）。枠の下端が、ページを上までスクロールした状態の画面の下端に届く
- CSS だけ（`100dvh` からの計算）にしないのは、枠の上にある要素の高さがページ（今日は記録の開始の欄、過去の記録は期間の指定）で違い、固定の値を引けないため。測った値を使う
- 今日のタイムラインと週のカレンダーは同じ `TimelineBoard` なので、どちらも同じ動きになる

## Risks / Trade-offs

- [見出しのクラスを直接書いているので、新しいページで大きさがずれる] → 今回は 6 か所で、テストで見出しのクラスを確かめる。ずれが増えたら共通の部品にする

## Migration Plan

見た目の調整だけで、データ・URL は変わらない。
