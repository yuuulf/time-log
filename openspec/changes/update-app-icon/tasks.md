# Tasks

## 1. ファビコン

- [x] 1.1 `~/Downloads/icon_light.png`・`icon_dark.png` の背景を `sharp` で透過してから 512×512px に縮小し、`public/icon-light.png`・`public/icon-dark.png` として置く（design「画像は背景を透過して縮小し、public/ に置く」）。512px でアルファがあること、四隅が透明なこと、時計の針が残っていることを確かめる（コミット: TimeLog のロゴの画像を追加）
- [x] 1.2 `app/layout.tsx` の `metadata.icons.icon` にライト用（`media` なし）とダーク用（`media: "(prefers-color-scheme: dark)"`）を指定し、`app/favicon.ico` を削除する（design「ファビコンはメタデータの icons で出し分ける」）。`app/layout.test.tsx` で `metadata.icons` の 2 つの URL と `media` をテストする。`npm run build` が通り、出力された HTML の `<head>` に 2 つの `<link rel="icon">` があり `favicon.ico` がないことを確かめる（コミット: ファビコンを TimeLog のロゴに変える）

## 2. アプリ名のロゴ

- [ ] 2.1 `components/layout/AppLogo.tsx` を作り、`Sidebar.tsx` と `SidebarShell.tsx` のアプリ名のリンクの中で、アプリ名の左にロゴを並べる（design「ロゴは components/layout/AppLogo.tsx にまとめる」）。`AppLogo.test.tsx` で、ライト用（`dark:hidden`）とダーク用（`hidden dark:block`）の 2 枚が `alt=""` で出ることをテストする。`app/layout.test.tsx` と `SidebarShell.test.tsx` で、アプリ名のリンクの名前が「TimeLog」のままでリンク先が `/` であることを確かめる（コミット: サイドバーのアプリ名にロゴを追加）

## 3. ドキュメントと確認

- [ ] 3.1 README.md の更新が必要か確認する（proposal の見込みでは不要）。必要なら同じ PR で更新する
- [ ] 3.2 `npm run build` したアプリをブラウザで開き、spec のシナリオを確認する: ライト・ダークそれぞれでタブのファビコンとサイドバーのロゴが出し分けられること、ロゴとファビコンの周りに四角い地が出ないこと、初期のファビコンが出ないこと、ロゴを選ぶとトップページに移ること、読み上げの名前が「TimeLog」だけであること、幅 375px・1024px で横スクロールが出ないこと。ファビコンはキャッシュを避けるため新しいプライベートウィンドウで見る
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（例: `update-app-icon`）で行う。いまの `add-project-archive` ブランチとは別の PR にする
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
