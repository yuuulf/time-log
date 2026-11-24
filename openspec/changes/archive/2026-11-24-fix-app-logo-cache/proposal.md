# Proposal

## Why

`add-recording-favicon` でロゴの絵を差し替えたあと、普段使いの TimeLog を `npm run local:update` で更新しても、サイドバーのアプリ名の横のロゴが前の絵のまま表示された。ファビコンは新しい絵になっていた。ロゴの画像を縮小して配信する仕組み（Next.js の画像最適化）の縮小画像がサーバー（`.next/cache/images`）とブラウザ（最大 4 時間）にキャッシュされ、差し替えた画像が反映されなかったためである。ロゴの画像を差し替えたら、更新後にページを開き直せば新しいロゴが出るようにする。

## What Changes

- サイドバーと画面上部のアプリ名の横のロゴを、ファビコンと同じく `public/` の画像（`/icon-light.png`・`/icon-dark.png`）をそのまま読み込んで表示する（縮小画像を使わない）
- これにより、ロゴの画像を差し替えてアプリを更新したあと、ページを開き直せば新しいロゴが表示される
- ロゴの大きさ・ライト・ダークの出し分け・読み上げの扱い・リンク先は変えない

### スコープ外（やらないこと）

- ロゴやファビコンの絵そのものの変更
- `npm run local:update` での `.next/cache/images` の削除（ロゴが縮小画像を使わなくなれば不要）
- ロゴ以外の画像の扱い（今は `next/image` を使う画像はロゴだけ）
- 画像を差し替えるたびにファイル名を変える運用

### README.md の更新

README にはロゴの表示の仕組みやキャッシュについての記述がないため、更新は不要と見込む。実装の最後に改めて確認する。

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `app-shell`: 「アプリ名のロゴ」の要件に、ロゴの画像を差し替えてアプリを更新したあとは、ページを開き直すだけで新しいロゴが表示されることを加える

## Impact

- `components/layout/AppLogo.tsx`: `next/image` の `Image` に `unoptimized` を付ける
- `components/layout/AppLogo.test.tsx`: `src` が `/icon-light.png`・`/icon-dark.png` そのものであることを確かめる
- 依存パッケージ・DB・API の変更なし
