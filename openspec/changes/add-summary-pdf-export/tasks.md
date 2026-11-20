# Tasks

## 1. PDF 出力ボタン

- [x] 1.1 `lib/messages.ts` の `summary` に、ボタンの名前「PDF 出力」（`pdf`）と保存の既定のファイル名「集計 {期間の見出し}」（`pdfTitle(heading)`）を追加し、`components/summary/SummaryPdfButton.tsx`（Client Component）を作る（design 決定 1）。`IconButton`（`FileDown`）で、押すと `document.title` を変えて `window.print()` を呼び、`afterprint` で元のタイトルに戻す。ボタン自身に `print:hidden` を付ける。`components/summary/SummaryPdfButton.test.tsx` で、「PDF 出力」の名前（`aria-label`・`title`）で見つかること、押すと `window.print` が呼ばれ、そのときのタイトルが「集計 2026年11月」であること、`afterprint` のあとにタイトルが元に戻ることをテストし、`npm test` が通ることを確認する（コミット: 集計の PDF 出力ボタンを追加）
- [x] 1.2 `components/summary/SummaryContent.tsx` で、期間の見出しの横に `SummaryPdfButton` を並べる（design 決定 1）。`components/summary/SummaryContent.test.tsx` に、月の集計・期間の集計で「PDF 出力」ボタンが表示されること、期間の入力に誤りがあるときは表示されないことを追加し、`npm test` が通ることを確認する（コミット: 集計の見出しの横に PDF 出力ボタンを置く）

## 2. 印刷の見た目

- [x] 2.1 印刷に出さない部分に `print:hidden` を付ける: `SidebarShell.tsx` の上部のメニュー・背景の幕・`<aside>`、`app/summary/page.tsx` の見出し「集計」（あわせて印刷のときの余白を詰める）、`SummaryContent.tsx` の `PeriodControls` を包む要素。表の行と合計時間・稼働日数の枠に `print:break-inside-avoid` を付ける（design 決定 2・4）。画面の表示が変わらないことを既存のテスト（`npm test`）で確認する（コミット: 集計の印刷に期間の見出しから下だけを出す）
- [x] 2.2 `app/globals.css` のダークの配色を画面のときだけ（`@media screen and (prefers-color-scheme: dark)`）にし、印刷ではライトの配色と `color-scheme: light` を使う（design 決定 3）。`npm test` が通ることを確認する（コミット: 印刷ではライトの配色を使う）
- [x] 2.3 `npm run format`・`npm run lint`・`npm run typecheck`・`npm test` を実行し、すべて通ることを確認する（フォーマットで差分が出たら、機能のコミットとは別のコミットにする）
- [x] 2.4 `app/globals.css` に `@page { margin: 20mm; }` を書き、`app/summary/page.tsx` の `<main>` に `print:px-0` を付ける（design 決定 5）。`npm run format`・`npm run lint`・`npm run typecheck`・`npm test` が通ることを確認し、Chrome のヘッドレスの PDF 出力で集計が用紙の上下左右の端から 20mm 内側に出ることを確かめる（コミット: 印刷の既定の余白を広げる）

## 3. ドキュメントと確認

- [x] 3.1 README.md の使い方の「集計」の説明に、「PDF 出力」ボタン（アイコン）で印刷ダイアログを開き、「PDF に保存」で期間の見出しから下の集計を PDF にできることを追記し、README の更新要否を確認したことを PR に書く（コミット: README に集計の PDF 出力を追記）
- [x] 3.2 開発用の記録とは別の DB で dev サーバーを起動し、記録とプロジェクトを用意して、Chrome のヘッドレスの PDF 出力（`--print-to-pdf`、印刷用の CSS が効く）で 2026年11月の集計と期間を指定した集計の PDF を作り、spec のシナリオどおり期間の見出しから下だけが出て、サイドバー・見出し「集計」・期間の切り替えと入力欄・ボタンが出ないこと、表の行がページの途中で切れないことを PDF を開いて確かめる。ダークモード（`--force-dark-mode` など）でも白い背景で出ることを確かめ、ヘッドレスで再現できなければユーザーに確認を頼む
- [ ] 3.3 `openspec validate add-summary-pdf-export --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（例: `add-summary-pdf-export`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
