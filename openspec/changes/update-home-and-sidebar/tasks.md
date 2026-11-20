# Tasks

## 1. トップページを今日の記録だけにする

- [x] 1.1 `lib/time.ts` に `dayRange(date)` を足す（design 決定 1）。`lib/time.test.ts` で、日本時間の 0 時の境目（UTC では前日の 15 時）と翌日 0 時までの範囲をテストする（コミット: その日の範囲を返す関数を追加）
- [x] 1.2 `lib/time-entries/repository.ts` の `listRecentEntries`・`RECENT_DAYS` を `listEntriesOfDay(db, now)` に置き換え、`TimeTracker` で使う。`repository.test.ts` で、今日に開始した記録だけを新しい順に返すこと（日本時間の 0:30 と前日の 23:30、昨日から記録中の記録）をテストし、`actions.test.ts` の記録の読み直しも合わせる（design 決定 1）（コミット: トップページで今日の記録だけを読む）
- [x] 1.3 `messages.timeEntries` の `listHeading` を「今日の記録」、`empty` を「今日の記録はまだありません。」に変え、`TimeTracker` から渡す（design 決定 2）。`EntryList.test.tsx` で、既定の見出しと空のときの文言をテストする。「過去の記録」の見出しと文言が変わらないことを `HistoryContent.test.tsx` で確かめる（コミット: トップページの一覧の見出しを「今日の記録」にする）

## 2. サイドバー

- [x] 2.1 `SidebarNav` の `pages` から「ホーム」（`/`）を外す（design 決定 4）。`SidebarNav.test.tsx` と `app/layout.test.tsx` で、リンクが「過去の記録」「集計」「プロジェクト」の順の 3 つで、トップページではどのリンクも選ばれていない表示になることをテストする（コミット: サイドバーのリンクから「ホーム」をなくす）
- [x] 2.2 `components/layout/RunningTaskLink.tsx` を作り、`RunningTaskView` の中身全体をトップページへのリンクにする（design 決定 3）。`RunningTaskLink.test.tsx`・`RunningTaskView.test.tsx` で、記録中のタスクがあるときもないときも `/` へのリンクで、`/` では `aria-current="page"`、ほかのページでは付かないこと、表示の順（見出し → 開始時刻 → プロジェクトのアイコン → タスク名）が変わらないことをテストする。`SidebarShell.test.tsx` か結合のテストで、幅 768px 未満で枠を選ぶとサイドバーが閉じることを確かめる（コミット: 記録中のタスクの枠からトップページへ移れるようにする）

## 3. ドキュメントと確認

- [x] 3.1 README.md の使い方を直す: サイドバーのリンク（「ホーム」をなくし、記録中のタスクの枠からトップページへ移る）、トップページの一覧（今日の記録だけ）、昨日以前の記録は「過去の記録」で見ること。README の記述と画面が一致していることを確認する（コミット: README をホームの今日の記録とサイドバーの変更に合わせる）
- [x] 3.2 `npm run build` したアプリをブラウザで開き、spec のシナリオを確認する: トップページの「今日の記録」に今日の記録だけが出る、今日の記録がないときの文言、サイドバーのリンクが 3 つ、記録中のタスクの枠（記録中・記録中でない）からトップページへ移る、トップページで枠が選ばれている表示、幅 375px でサイドバーの枠を選ぶと閉じる。幅 375px・1024px で横スクロールが出ないこと、ライト・ダークで読めることも確認する
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
