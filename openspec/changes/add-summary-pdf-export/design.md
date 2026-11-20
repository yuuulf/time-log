# Design

## Context

- 「集計」ページは `app/summary/page.tsx`（ページの見出し「集計」）→ `components/summary/SummaryView.tsx`（Server Component、DB を読む）→ `components/summary/SummaryContent.tsx`（期間の切り替え `PeriodControls`、期間の見出し `view.heading`、合計・週ごと・プロジェクトごとの表）の構成。`SummaryContent` は今は Server Component として使われている
- サイドバーはルートレイアウトの `components/layout/Sidebar.tsx` → `SidebarShell.tsx`（Client Component）で、幅の狭い画面の上部のメニュー、背景の幕、`<aside>` を描く
- 色は `app/globals.css` の `:root` のトークンを `prefers-color-scheme: dark` で切り替えている。印刷でもブラウザがダークを使うと、黒い背景のまま PDF になりうる
- タブのタイトルは、どのページでもアプリ名（`messages.app.name`）にしている。ブラウザは印刷ダイアログの PDF 保存の既定のファイル名に `document.title` を使う
- Tailwind CSS v4 には印刷のときだけ効く `print:` の variant がある

要件は `specs/time-summary/spec.md` の「集計の PDF 出力」を参照。

## Goals / Non-Goals

**Goals:**

- 依存パッケージを足さず、ブラウザの印刷と印刷用の CSS だけで PDF にする
- 印刷に出す・出さないの指定を、見た目のクラス（`print:hidden`）で各部品に付け、画面の表示は変えない

**Non-Goals:**

- 印刷専用のページ（`/summary/print` など）は作らない。今の画面をそのまま印刷する
- 用紙サイズ・余白の `@page` 指定はしない（ブラウザの既定と印刷ダイアログの設定に任せる）

## Decisions

### 1. 「PDF 出力」ボタンは小さな Client Component にする

`components/summary/SummaryPdfButton.tsx`（`"use client"`）を作り、`IconButton`（アイコンは lucide-react の `FileDown`、名前は `messages.summary.pdf` の「PDF 出力」）を描く。押したら次の順で動く。

1. `document.title` を `messages.summary.pdfTitle(heading)`（「集計 2026年11月」）に変える
2. `window.print()` を呼ぶ
3. `afterprint` イベントで `document.title` を元の値に戻す（`window.print()` が同期で戻るブラウザでも、戻ったあとに `afterprint` が来るので、戻すのは `afterprint` に任せ、`{ once: true }` で登録する）

`SummaryContent` はこのボタンを読み込むだけで、Server Component のまま使える。期間の見出し `<h2>` とボタンを横に並べる `flex` の行にし、`rangeError` のときは今どおり集計の `<section>` ごと出さないので、ボタンも出ない。

代替案: `SummaryContent` 全体を Client Component にする → 表の描画までクライアントに送ることになるので採らない。アイコンは `Printer` も考えたが、ボタンの名前が「PDF 出力」なので `FileDown` に合わせる。

### 2. 印刷に出さない部分には `print:hidden` を付ける

- `SidebarShell.tsx`: 上部のメニューの行、背景の幕、`<aside>` に `print:hidden`（サイドバーはどのページの印刷にも不要なので、集計に限らず外す）
- `app/summary/page.tsx`: ページの見出し「集計」の `<h1>` に `print:hidden`。見出しの下の余白（`mt-8`）と `<main>` の上下の余白（`py-12`）も印刷では詰める（`print:mt-0`・`print:py-0`）
- `SummaryContent.tsx`: `PeriodControls` を包む要素に `print:hidden`
- `SummaryPdfButton`: ボタン自身に `print:hidden`

代替案: 印刷のとき `body` の中を全部隠して集計の部分だけ見せる CSS（`visibility` の切り替え）→ 隠した部分の場所が空白で残り、指定が globals.css に集まってどこが出るか分かりにくいので採らない。

### 3. 印刷はライトの配色のトークンにする

`app/globals.css` で、ライトの値を `@media print` でも使うようにする。ダークの `@media (prefers-color-scheme: dark)` を `@media screen and (prefers-color-scheme: dark)` に変え、印刷のときはダークの上書きが効かず `:root` のライトの値のままになるようにする。あわせて `color-scheme` も印刷では `light` にする（ブラウザが描く部品が暗くならないように）。

代替案: `@media print` の中にライトの値をもう一度書く → 同じ色を 2 か所に持つことになるので採らない。

### 4. 表の行は途中でページを分けない

プロジェクトが多いと表がページをまたぐので、表の行（`<tr>`）と合計時間・稼働日数の枠に `print:break-inside-avoid` を付け、1 行が上下のページに切れないようにする。

## Risks / Trade-offs

- [ブラウザの印刷ダイアログで「背景のグラフィック」が切られていると、枠線以外の背景色は出ない] → 集計の表示は背景色に頼っていない（枠線と文字だけ）ので影響しない
- [`afterprint` が来ないブラウザではタブのタイトルが「集計 …」のまま残る] → 主要なブラウザ（Chrome・Safari・Firefox）は対応している。残ってもページを移ればアプリ名に戻る
- [サイドバーの `print:hidden` で、集計以外のページの印刷の見た目も変わる] → サイドバーを印刷に出す理由はないので、むしろ望ましい変化として受け入れる
- [印刷の見た目は jsdom の自動テストでは確かめられない] → ボタンの振る舞い（印刷を呼ぶ・タイトルの変更と戻し・誤りのときに出ない）は自動テストで、印刷に出る範囲と配色は Chrome の PDF 出力で実物を確かめる（tasks に含める）
