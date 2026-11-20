# Design

## Context

- 「過去の記録」（`app/history/page.tsx`）は、URL のクエリ（`month` または `from`・`to`）を `lib/time-entries/history.ts` の `resolveHistoryQuery` で月・期間・入力の誤りに分け、`listEntriesBetween` で期間に開始した記録をプロジェクト付きで読む
- 月の切り替えと期間の入力欄は `components/time-entries/HistoryContent.tsx` の中に直接書かれ、行き先は `/history` に決め打ちしている
- `listEntriesBetween` はプロジェクトを結合して読むため、アーカイブしたプロジェクトの名前と色もそのまま得られる
- 時刻は UTC で保存し、日付の区切りと表示は日本時間（`lib/time.ts`）で行う。日本時間には夏時間がないので、1 日はいつも 24 時間として計算できる
- 作業時間の表示は `formatDuration`（分に切り捨てて「1時間5分」「5分」）。記録中の記録は作業時間を持たない（spec「作業時間の表示」）

## Goals / Non-Goals

**Goals:**

- 期間の決め方と切り替えの UI を「過去の記録」と共通にし、2 つのページで動きがずれないようにする
- 集計の計算を DB や画面から切り離した純粋な関数にし、境目（週・期間・秒の切り捨て）をテストしやすくする

**Non-Goals:**

- SQL の集計関数（`SUM`・`GROUP BY`）での集計。期間は最大 366 日で、記録の件数も個人の利用では多くないため、読んだ記録を JavaScript で集計する
- 集計結果のキャッシュ

## Decisions

### 1. 期間の決め方は `resolveHistoryQuery` をそのまま使う

「集計」でも `resolveHistoryQuery(params, now)` を呼び、同じ `HistoryView`（見出し・範囲・前後の月・入力の値・誤り）を得る。

- 決め方（今月より先に進めない、366 日まで、誤りの文言）が 1 か所にまとまり、2 つのページで食い違わない
- 別案: 名前を `resolvePeriodQuery` などに変えて `lib/` の別の場所に移す。名前は少し「過去の記録」寄りだが、移すと変更が広がるため、今回は名前を変えない

### 2. 期間の切り替えの UI を `PeriodControls` に切り出す

`HistoryContent` の中の月の切り替え・「月ごとの表示」・期間の入力欄（`RangeForm`）を `components/time-entries/PeriodControls.tsx` に移し、行き先のパス（`/history` または `/summary`）を引数で受け取る。「過去の記録」もこの部品を使う。

- 入力欄の `id` は `history-from` などから `period-from` などに変える（1 ページに 1 つしか置かないため）
- 文言は今の `messages.history` のものを使い回す（「前の月」「表示」など、同じ役割の同じ言葉）
- 先に「過去の記録」だけで切り出し、見た目と動きが変わらないことを今のテストで確かめてから「集計」で使う

### 3. 集計は `lib/summary/summarize.ts` の純粋な関数で行う

`summarize(entries, range)` は、記録（開始時刻・終了時刻・プロジェクト）と集計の範囲を受け取り、次を返す。

- `totalMs`: 終了済みの記録の作業時間（ミリ秒）の合計
- `workDays`: 記録（記録中を含む）を開始した日（日本時間の `toDateKey`）の数
- `weeks`: `{ first, last, totalMs }` の配列（古い順）。範囲の初日から 1 日ずつ進め、月曜日だけで区切る（月の境目では区切らない）。`last` は日曜日か範囲の最終日の早い方。月を集計するときは範囲が 1 日〜月末なので、週は自然に月をまたがない。期間を指定したときは、月をまたぐ週も 1 つの週になる
- `projects`: `{ project, totalMs }` の配列。`project` が null は「プロジェクトなし」。`totalMs` が 1 分未満のものは除き、長い順、同じなら登録順（プロジェクトの id の小さい順、「プロジェクトなし」は最後）

分への切り捨ては表示のときに `formatDuration` で行い、計算はミリ秒のまま足す（spec「秒は足してから切り捨てる」）。

- 「0分のプロジェクトは表示しない」は「表示すると 0分 になるもの」を除くという意味なので、1 分未満で判定する
- 週の曜日と日付の表示のため、`lib/time.ts` に日本時間の曜日（月曜を 0）を返す関数と「11月16日」の形で表示する関数を足す
- 期間の終わりをまたぐ記録は、開始した日の週・期間にすべての時間を数える（記録の読み方が「期間に開始した記録」のため）

### 4. ページと部品の構成

- `app/summary/page.tsx`: 見出し「集計」と `<Suspense>`。中に `SummaryView` を置く（「過去の記録」と同じく、`searchParams` の `await` と DB の読み込みは `<Suspense>` の中で行う）
- `components/summary/SummaryView.tsx`（サーバー部品）: `resolveHistoryQuery` → `listEntriesBetween` → `summarize` を行い、`SummaryContent` に渡す
- `components/summary/SummaryContent.tsx`: `PeriodControls`、期間の見出し、合計時間と稼働日数の 2 つの数字、週ごとの表、プロジェクトごとの表を上から並べる
  - 合計時間と稼働日数は見出し付きの大きな数字で並べる（幅 375px では縦に並べる）
  - 週ごと・プロジェクトごとは `<table>` にして、行と列の関係を読み上げで分かるようにする。時間は右寄せにする
  - プロジェクトは `ProjectIcon`（`decorative`）と名前を並べる。「プロジェクトなし」は記録の一覧と同じ文言を使う
- サイドバーの `SidebarNav` の `pages` に「集計」（`/summary`）を「過去の記録」と「プロジェクト」の間に足す
- 本文の幅は最大 768px（`max-w-3xl`）。表は数列なので 1024px まで広げる必要がない
- 新しい文言は `messages.summary` にまとめる（タイトル「集計」、各欄の見出し、「12日」の形の日数、記録がないときの文言など）

## Risks / Trade-offs

- [週の始まりを月曜日に決め打ちしている] → 日本の仕事の週に合わせた。日曜始まりが必要になったら `summarize` の区切りの曜日を引数にすれば済む
- [記録中の記録を合計に含めないため、今日の作業中の時間は集計に出ない] → spec のとおり。稼働日数には数えるので「今日働いている」ことは分かる
- [期間の終わりをまたぐ記録（月末の深夜など）は、次の期間の分も前の期間に数える] → 「過去の記録」の一覧と同じ数え方にそろえた。ずれは記録 1 件の一部に限られる
- [1 年分の記録を読むと件数が多くなる] → 個人の記録なので数千件程度と見込み、JavaScript での集計で十分。遅くなったら SQL の集計に置き換える
