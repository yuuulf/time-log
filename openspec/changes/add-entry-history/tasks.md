# Tasks

## 1. 日付と期間の扱い

- [x] 1.1 `lib/time.ts` に、「2026-10-01」を日本時間 0 時の `Date` にする関数（存在しない日付は null）、日本時間の今月を返す関数、月の範囲と見出し「2026年10月」、期間の見出し「2026年10月1日〜2026年10月15日」の関数を足す（design 決定 3）。`lib/time.test.ts` で月末・年末の境目、存在しない日付、実行環境のタイムゾーンに左右されないことをテストし、`npm test` が通ることを確認する（コミット: 日本時間の日付と月の変換を追加）
- [x] 1.2 `lib/time-entries/repository.ts` に `listEntriesBetween` を足す（design 決定 4）。`repository.test.ts` で範囲の両端（`from` ちょうどは含み、`to` ちょうどは含まない）と並び順をテストし、`npm test` が通ることを確認する（コミット: 期間の記録の読み込みを追加）
- [x] 1.3 `lib/time-entries/history.ts` に `resolveHistoryQuery` を作り、エラーの文言を `lib/messages.ts` に足す（design 決定 1・3）。`history.test.ts` で、月の指定なし・前後の月・今月より先や不正な月、期間の表示・1 日だけ・空・終了日が前・366 日と 367 日の境目をテストし、`npm test` が通ることを確認する（コミット: 過去の記録の月と期間の解釈を追加）

## 2. 画面

- [ ] 2.1 `components/ui/IconLink.tsx` を作り、見た目のクラスを `IconButton` と共有する（design 決定 5）。`IconLink.test.tsx` で名前で読み上げられること・`title`・`href` をテストし、既存の `IconButton.test.tsx` も通ることを確認する（コミット: アイコンのリンクを追加）
- [ ] 2.2 `EntryList` に任意の `heading` と `emptyMessage` を足す。`EntryList.test.tsx` で、渡したときはその見出しと文言、省略したときは今までどおりの表示になることをテストし、`npm test` が通ることを確認する（コミット: 記録の一覧の見出しと文言を差し替えられるようにする）
- [ ] 2.3 `components/time-entries/EntryHistory.tsx` に、月の切り替え（今月は「次の月」を無効）・「月ごとの表示」・期間の入力欄・一覧を表示する部品を作り、文言を `lib/messages.ts` に足す（design 決定 2・5）。表示部分を `resolveHistoryQuery` の結果と記録を受け取る部品に分けて `EntryHistory.test.tsx` で、見出し・前後の月のリンク先・次の月の無効・期間の指定中の「月ごとの表示」・入力エラーと入力値の保持・空のときの文言をテストし、`npm test` が通ることを確認する（コミット: 過去の記録の表示を追加）
- [ ] 2.4 `app/history/page.tsx` を作り、`Header` に「過去の記録」のリンクを足す（design 決定 2・6）。`Header.test.tsx` でリンク先が `/history` であることをテストし、`app/history/page.test.tsx` でページ見出しが表示されることをテストする。`npm test` が通ること、`npm run build` が `cacheComponents` のエラーなく通ることを確認する（コミット: 過去の記録のページを追加）

## 3. ドキュメント

- [ ] 3.1 README.md の使い方に、ヘッダーの「過去の記録」から月ごと・期間を指定して記録を見られることを追記する。README の記述と画面の表示が一致していることを確認する（コミット: README に過去の記録を追記）

## 4. 結合確認

- [ ] 4.1 `npm run dev` で、spec のシナリオ（今月の表示、前の月への切り替えと再読み込み、月の境目の記録、次の月が選べないこと、記録がない月、不正な月の指定、期間の表示と再読み込み、1 日だけの期間、期間の入力エラー 3 種、月ごとの表示に戻ること、ヘッダーからの移動）をブラウザで確認する。過去の記録のページで修正・削除・再開が動くこと、幅 375px で横スクロールが出ないことも確認する
- [ ] 4.2 PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認し、tasks.md がすべて完了していることを確かめてから PR に `archive` ラベルを付ける。`openspec/specs/time-tracking` に月ごと・期間の表示の要件が、`openspec/specs/app-shell` にヘッダーのリンクが加わることを確認する
