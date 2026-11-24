# Design

## Context

- `components/layout/AppLogo.tsx` は `next/image` の `Image` でロゴ（`/icon-light.png`・`/icon-dark.png`、512×512px）を 24px で表示している。最適化が有効なので、ブラウザは `/_next/image?url=%2Ficon-light.png&w=48&q=75` のような縮小画像を読み込む
- 縮小画像はサーバーの `.next/cache/images` に保存される。`npm run local:update`（git の更新とビルド）ではこのフォルダは消えず、更新前に作られた前のロゴの縮小画像が更新後の最初のリクエストに STALE として返った
- 縮小画像の応答には `Cache-Control: public, max-age=14400, must-revalidate` が付き、ブラウザは最大 4 時間、前のロゴを使い続ける
- ファビコン（`components/layout/favicons.ts`）は `/icon-*.png` を直接読むので、`public/` の静的ファイルとして配信され（`max-age=0` で毎回確認される）、差し替えがすぐ反映された

## Goals / Non-Goals

**Goals:**
- ロゴの画像を差し替えたら、アプリの更新後にページを開き直すだけで新しいロゴが出るようにする

**Non-Goals:**
- 画像最適化の設定（`next.config.ts` の `images`）をアプリ全体で変えること

## Decisions

### `AppLogo` の `Image` に `unoptimized` を付ける

`unoptimized` を付けると `Image` は `src` をそのまま `<img>` に出し、ブラウザは `/icon-light.png` を直接読む。`public/` の静的ファイルとして配信されるため、ファビコンと同じくブラウザが毎回変更を確かめ、`.next/cache/images` も使われない。`Image` のままにするので、`width`・`height` による領域の確保や遅延読み込みなどの振る舞いは変わらない。

検討した代替案:
- **画像を差し替えるときにファイル名も変える**（例: `icon-light-v2.png`）: 仕組みは今のままで済むが、差し替えのたびに思い出す必要があり、忘れると同じことが起きる
- **`local:update` で `.next/cache/images` を消す**: サーバー側は直るが、ブラウザの 4 時間のキャッシュは残る
- **`next.config.ts` で `images.minimumCacheTTL` を短くする／`images.unoptimized: true` にする**: アプリ全体の設定を変えることになる。今 `next/image` を使う画像はロゴだけなので、部品で指定すれば足りる
- **`next/image` をやめて `<img>` を直接書く**: ESLint（`@next/next/no-img-element`）の警告の対象になり、`Image` の振る舞いも手放すことになる

## Risks / Trade-offs

- [24px の表示に 512px の PNG（1 枚 30KB ほど）を読む] → 自分の Mac の中で使うアプリで、ロゴ 1 枚を読むだけなので影響は小さい。ファビコンとして同じ画像をすでに読み込んでいる
- [ライト用とダーク用の 2 枚を両方読み込む] → 今も縮小画像を 2 枚読んでいるので変わらない

## Migration Plan

- 更新後、ブラウザが前の縮小画像を覚えていても、ページは新しい URL（`/icon-*.png`）を読むので、開き直すだけで新しいロゴになる。`.next/cache/images` に残った前の縮小画像は使われなくなり、手で消す必要はない
