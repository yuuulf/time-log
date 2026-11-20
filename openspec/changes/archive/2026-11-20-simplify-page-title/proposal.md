# Proposal

## Why

ブラウザのタブのタイトルは、今は「過去の記録 | TimeLog」のように「ページ名 | アプリ名」になっている。タブの幅は狭く、先頭のページ名でアプリ名が隠れて、どのタブが TimeLog か見分けにくい。タイトルはアプリ名「TimeLog」だけにする。

## What Changes

- すべてのページで、ブラウザのタブのタイトルを「TimeLog」だけにする（ページ名を付けない）
- 対象のページ: トップページ・「過去の記録」・「集計」・「プロジェクト」・プロジェクトの詳細画面・登録画面・アーカイブ済みの画面
- 各ページが個別に設定しているタイトルをやめ、共通のレイアウトの「TimeLog」だけにする

### スコープ外（やらないこと）

- ページの見出し（画面の中の「過去の記録」などの `h1`）の変更
- ファビコンの変更
- アプリの説明（`description`）の変更

### README.md の更新

README にはタブのタイトルについての記述がないため、更新は不要と見込む。実装の最後に改めて確認する。

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `app-shell`: 「日本語での表示」のタイトルを、アプリ名を含むものから、どのページでもアプリ名「TimeLog」だけにする

## Impact

- `app/layout.tsx`: タイトルを「ページ名 | TimeLog」のテンプレートから「TimeLog」だけにする
- `app/history/page.tsx`・`app/summary/page.tsx`・`app/projects/page.tsx`・`app/projects/new/page.tsx`・`app/projects/[id]/page.tsx`・`app/projects/archived/page.tsx`: 個別のタイトル（`metadata`）を削除
- それぞれの `page.test.tsx` と `app/layout.test.tsx`
- 依存パッケージの追加・DB の変更はなし
