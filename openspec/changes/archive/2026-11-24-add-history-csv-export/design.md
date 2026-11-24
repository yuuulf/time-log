# Design

## Context

- 「過去の記録」ページは、URL のクエリ（`month`、または `from`・`to`）を `lib/time-entries/history.ts` の `resolveHistoryQuery` で解釈し、`month`・`range`・`rangeError` のどれかの表示を決める。記録は `listEntriesBetween(db, range.from, range.to)` で新しい順に読む（`components/time-entries/EntryHistory.tsx`）
- 期間の見出し（「2026年11月」など）は `EntryList` の `<h2>` に `heading` として渡している。「集計」ページは見出しの横に「PDF 出力」ボタン（`SummaryPdfButton`）を置いている
- `next.config.ts` で Cache Components が有効。`GET` の Route Handler は、リクエストのクエリや `connection()` を使えばリクエスト時に動く（`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`「With Cache Components」）
- 時刻の表示用の関数は `lib/time.ts` にある（`toDateTimeLocalValue` は日本時間の「2026-11-18T09:05:30」を返す）。作業時間の分への切り捨ては `entryDurationMs`

## Goals / Non-Goals

**Goals:**
- 画面に表示している範囲と同じ記録を、表計算ソフトでそのまま使える CSV で渡す

**Non-Goals:**
- 大量の記録（数万件）のストリーミング出力。期間は最大 366 日で、1 人分の記録なので一度に作れば足りる

## Decisions

### CSV はサーバーの Route Handler（`GET /history/export`）で作る

`app/history/export/route.ts` に `GET` を置き、ページと同じクエリを `resolveHistoryQuery` で解釈して、`listEntriesBetween` で読んだ記録から CSV を作って返す。応答には `Content-Type: text/csv; charset=utf-8` と `Content-Disposition: attachment` を付け、ブラウザにファイルとして保存させる。`rangeError` のときは 400 を返す。

範囲の解釈をページと同じ関数にすることで、画面に出ている記録と CSV の記録が必ず一致する。DB を読むのはサーバーなので、`await connection()` でリクエスト時に動かす（ページの `EntryHistory` と同じ）。

代替案:
- **クライアントで、ページに渡された記録から CSV を作り Blob で保存する**: サーバーの追加は要らないが、`EntryList` に渡している記録はサーバー部品からクライアントに送る形が変わり、記録の一覧の部品が出力の責務まで持つことになる。Route Handler なら URL を開くだけで同じ CSV が得られ、テストもしやすい
- **Server Action で返す**: Server Action はデータの変更向けで、ファイルのダウンロードには向かない

### CSV の文字列は `lib/time-entries/csv.ts` の純粋な関数で作る

`toEntriesCsv(entries)` が記録の配列（新しい順で受け取る）から、BOM・列名の行・記録の行（古い順）を CRLF でつないだ文字列を返す。値はカンマ・ダブルクォート・CR・LF を含むときだけダブルクォートで囲み、中のダブルクォートは 2 つ重ねる（RFC 4180）。列名は `lib/messages.ts` に置く。Route Handler は読み込みと応答の組み立てだけにし、形式のテストはこの関数に対して行う。

- 日付・時刻は `toDateTimeLocalValue` の結果を「T」で分けて使う（日本時間）
- 作業時間（分）は `entryDurationMs(entry) / 60000`。記録中は空
- 古い順にするのは、表計算ソフトで行を追うときや日付で集計するときに時系列のほうが扱いやすいため。画面（新しい順）とは逆になる

### BOM 付きの UTF-8 にする

Excel は BOM のない UTF-8 の CSV を Shift_JIS として読み、日本語が文字化けする。BOM（`﻿`）を先頭に付ければ Excel も UTF-8 として読み、Numbers や Google スプレッドシートも BOM 付きを問題なく読める。Shift_JIS で出す案は、絵文字など Shift_JIS にない文字を含むタスク名を失うので採らない。

### ファイル名は「記録 <期間の見出し>.csv」にし、`filename*` で渡す

「集計」の PDF の既定のファイル名（「集計 2026年11月」）に合わせる。日本語のファイル名は `Content-Disposition` の `filename*=UTF-8''<パーセントエンコード>`（RFC 6266 / 5987）で渡し、古いブラウザ向けに ASCII の `filename="timelog.csv"` も添える。

### ボタンは `<a download>` のアイコンリンクにし、期間の見出しの横に置く

「CSV 出力」はページの移動ではなくファイルの取得なので、`next/link`（`IconLink`）ではなく、`IconButton` と同じ見た目（`iconControlClassName`）の素の `<a href="/history/export?..." download>` にする。`next/link` はプリフェッチやクライアント側の遷移をするため、ファイルの取得には向かない。アイコンは lucide-react の `FileSpreadsheet`、名前は `aria-label` と `title` に「CSV 出力」を付ける（`components/ui/` に `IconDownloadLink` として置き、同じ見た目の部品を使い回す）。

置き場所は「集計」の PDF 出力と同じく期間の見出しの横にする。`EntryList` に見出しの横に置く要素を受け取る `headingAction` を加え、`HistoryContent` から渡す。トップページの「今日の記録」は渡さないので変わらない。リンク先のクエリは表示中の `view` から作る（月なら `?month=2026-11`、期間なら `?from=…&to=…`）。今月を表示しているときも `month` を明示し、日付をまたいだあとに開いても画面と同じ月になるようにする。そのため `HistoryView` の `month` モードに表示中の月の値（`month: "2026-11"`）を加える。

## Risks / Trade-offs

- [タスク名が `=` や `+` で始まると、表計算ソフトが数式として扱う（CSV インジェクション）] → 自分の Mac で自分の記録を出すだけのアプリで、他人の入力が混ざらないので対策しない。値を書き換える（先頭に `'` を付けるなど）と、データとしての正しさが崩れる
- [画面は新しい順、CSV は古い順で、並びが逆] → spec と README に古い順と明記する
- [記録中の記録は作業時間が空で、表計算で合計すると記録中の分は入らない] → 画面の日ごとの合計や「集計」と同じ扱いになる
