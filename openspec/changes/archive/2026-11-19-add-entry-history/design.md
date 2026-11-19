# Design

## Context

- トップページは `app/page.tsx` の `<Suspense>` の中で `TimeTracker`（async Server Component）が `connection()` の後に DB を読み、`StartStopForm` と `EntryList` を表示する。`next.config.ts` で `cacheComponents` が有効
- 一覧は `EntryList` が開始日（日本時間）ごとにまとめて `EntryItem` を並べる。見出し「記録」と、記録がないときの文言（開始ボタンの案内）は固定
- `lib/time-entries/repository.ts` の `listRecentEntries` が直近 30 日の記録を読む。`started_at` にはインデックスがある
- 日本時間の扱いは `lib/time.ts` にまとめてあり、日本時間は `+09:00` 固定（夏時間なし）
- 修正・削除・再開の Server Functions は `refresh()` で今いるページを更新するため、別のページからでもそのまま使える
- 要件は specs/time-tracking/spec.md と specs/app-shell/spec.md を参照

## Goals / Non-Goals

**Goals:**

- 月・期間の解釈と入力チェックを、画面から切り離した純粋な関数にしてテストしやすくする
- 一覧の表示と記録の操作は既存の `EntryList` / `EntryItem` を使い回す

**Non-Goals:**

- トップページの直近 30 日の一覧を月ごとの表示に置き換えること
- クライアント側だけでの絞り込み（表示する記録は毎回サーバーで読む）

## Decisions

### 1. ページと URL

- ページは `app/history/page.tsx`（パス `/history`）。月は `?month=2026-10`、期間は `?from=2026-10-01&to=2026-10-15` で指定する
- `from` か `to` のどちらかがあれば期間の表示、なければ月の表示とする。`month` が正しくない、または今月より先なら今月を表示する（エラーにはしない）
- 理由: URL に含めることで再読み込み・ブックマーク・ブラウザの戻るで同じ表示に戻れる。状態をクライアントに持たないので Server Component だけで書ける
- 代替案: 動的ルート `/history/2026/10` → 期間の指定と形がそろわないので不採用

### 2. `cacheComponents` での読み込み

- `page.tsx` はページ見出し「過去の記録」だけを静的に出し、`searchParams`（Promise）をそのまま `<Suspense>` の中の async Server Component `EntryHistory` に渡す。`EntryHistory` が `searchParams` を await し、トップページと同じく `connection()` の後に DB を読む
- 理由: `searchParams` はリクエスト時の値なので、await する場所を `<Suspense>` の中に閉じ込めると、見出しやヘッダーを静的な部分として先に返せる（Next.js のドキュメント「Maximizing the static shell」）

### 3. 月・期間の解釈（`lib/time-entries/history.ts`）

- `resolveHistoryQuery(params, now)` が URL のクエリと現在時刻から、次のどれかを返す
  - 月の表示: 読み込む範囲（`[from, to)`）、見出し、前の月、次の月（今月なら null）
  - 期間の表示: 読み込む範囲、見出し、入力欄に戻す値
  - 期間の入力エラー: 理由と入力欄に戻す値（記録は読まない）
- 期間のチェック: 空・形式の誤り・存在しない日付 → 「開始日と終了日を入力してください。」、終了日 < 開始日 → 「終了日は開始日以降にしてください。」、日数（両端を含む）> 366 → 「期間は366日以内にしてください。」
- 日本時間の日付・月の変換は `lib/time.ts` に足す: 「2026-10-01」を日本時間 0 時の `Date` にする関数、日本時間の今月（年・月）を返す関数、月の範囲・見出し「2026年10月」、期間の見出し「2026年10月1日〜2026年10月15日」の関数
- 理由: 境目（月末 23:30 の記録など）や入力チェックを、DB や画面なしで単体テストできる

### 4. 記録の読み込み

- repository に `listEntriesBetween(db, from, to)` を足し、`from <= started_at < to` の記録を `started_at` の新しい順（同時刻は id の新しい順）で返す。`started_at` のインデックスが使える
- 期間は最大 366 日に制限しているため、件数での分割（ページ送り）はしない

### 5. 画面の部品

- `EntryHistory`（`components/time-entries/EntryHistory.tsx`）は URL のクエリを解釈して記録を読むだけにし、表示は `HistoryContent`（`components/time-entries/HistoryContent.tsx`）に任せる。`HistoryContent` は上に月の切り替えまたは「月ごとの表示」、その下に期間の入力欄、その下に `EntryList` を置く
- 月の切り替え: 「前の月」「次の月」はリンクで、アイコン（lucide-react の `ChevronLeft` / `ChevronRight`）に `aria-label` と `title` を付ける。リンクを `IconButton` と同じ見た目で出すため、`components/ui/IconLink.tsx`（`next/link` を使う）を作り、見た目のクラスは `IconButton` と共有する。今月のときの「次の月」は無効にした `IconButton` を出す
- 期間の指定中は月の切り替えの代わりに「月ごとの表示」リンク（`CalendarDays` アイコン、`/history`）を出す
- 期間の入力欄: `next/form` の `<Form action="/history">` に `type="date"` の「開始日」「終了日」と、送信ボタン（`Search` アイコン、名前「表示」）を置く。送信は URL のクエリになり、ページの再読み込みなしで移動する。入力エラーは `EntryHistory` が `resolveHistoryQuery` の結果から表示する
- `EntryList` に `heading` と `emptyMessage` を任意の props として足す。省略時は今の「記録」と開始ボタンの案内のままにし、過去の記録では見出しに月・期間、空のときは「この期間の記録はありません。」を出す
- 理由: `next/form` は検索のように URL のクエリを更新するフォーム向けで、クライアント側の移動とプログレッシブエンハンスメントを持つ。新しい依存は要らない

### 6. ヘッダーのリンク

- `Header` のナビゲーションに、文字のリンク「過去の記録」（`/history`）を右寄せで置く。ボタンではなくページへの移動なので、文字で表示する
- 文言はすべて `lib/messages.ts` に足す

## Risks / Trade-offs

- [`type="date"` の見た目と入力方法はブラウザごとに違う] → 値は `YYYY-MM-DD` に統一されるので、解釈はサーバーで行い、形式が違えば入力エラーにする
- [366 日分の記録を一度に表示すると長くなる] → 一人で使う記録なので 1 年分でも数千件程度。重くなるようならページ送りを別の change で検討する
- [過去の記録から再開すると、記録中のタスクはトップページでしか見えない] → 再開は既存の振る舞いのままとし、今回は変えない
