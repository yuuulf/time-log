# Tasks

## 1. サイドバーの部品

- [x] 1.1 `lib/messages.ts` に「ホーム」「メニュー」「閉じる」「記録中のタスクはありません。」を足し、`components/layout/RunningTaskView.tsx` と、DB を読む `RunningTask.tsx` を作る（design 決定 1・4・5）。`RunningTaskView.test.tsx` で、記録中のタスク名と開始時刻、タスク名が空のとき、記録中のタスクがないときの表示をテストし、`npm test` が通ることを確認する（コミット: 記録中のタスクの表示を追加）
- [x] 1.2 `components/layout/SidebarNav.tsx` を作る（design 決定 1）。`SidebarNav.test.tsx` で、アプリ名と「ホーム」のリンク先が `/`、「過去の記録」のリンク先が `/history` であること、今いるページのリンクだけに `aria-current="page"` が付くことをテストし（`next/navigation` の `usePathname` を差し替える）、`npm test` が通ることを確認する（コミット: サイドバーのナビゲーションを追加）
- [x] 1.3 `components/layout/SidebarShell.tsx` を作る（design 決定 2・3）。`SidebarShell.test.tsx` で、メニューボタンで開くこと（`aria-expanded` と閉じるボタンへのフォーカス）、閉じるボタン・背景・Escape キー・中のリンクの選択で閉じること、閉じたらメニューボタンにフォーカスが戻ることをテストし、`npm test` が通ることを確認する（コミット: 開閉できるサイドバーの枠を追加）

## 2. レイアウト

- [ ] 2.1 `components/layout/Sidebar.tsx` を作って `app/layout.tsx` の `Header` と置き換え、`Header.tsx` と `Header.test.tsx` を消す。各ページの `<main>` に `min-w-0` を足す（design 決定 1・2）。`npm test` が通ること、`npm run build` が `cacheComponents` のエラーなく通ることを確認する（コミット: ヘッダーをサイドバーに置き換える）

## 3. ドキュメント

- [ ] 3.1 README.md の使い方の「ヘッダーの『過去の記録』から」を、サイドバー（スマートフォン幅ではメニューボタン）から開けることに書き換え、サイドバーに記録中のタスクが表示されることを追記する。README の記述と画面の表示が一致していることを確認する（コミット: README をサイドバーに合わせる）

## 4. 結合確認

- [ ] 4.1 `npm run build` したアプリをブラウザで開き、spec のシナリオ（サイドバーからの移動、今いるページの表示、記録中のタスクの表示と記録がないとき、トップページでの終了と過去の記録からの再開でサイドバーが変わること、幅 375px での開閉と移動後に閉じること、幅 1024px での常時表示、両方のページで横スクロールが出ないこと、過去の記録の操作の並び）を確認する
- [ ] 4.2 PR を作成し、CI のチェックがすべて成功することを確認する
