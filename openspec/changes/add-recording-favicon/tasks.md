# Tasks

## 1. 画像

- [x] 1.1 `~/Downloads/TimeLog/l_デフォルト.png`・`d_デフォルト.png` を `sharp` で透過・512×512px に縮小し、`public/icon-light.png`・`public/icon-dark.png` を置き換える（design「画像はユーザーの画像を透過・縮小して public/ に置く」）。512px でアルファがあること、四隅と輪の内側が透明なこと、チェックと青緑の部分が残っていることを確かめる。既存の `AppLogo.test.tsx`・`app/layout.test.tsx` が通ることを確かめる（コミット: TimeLog のロゴをストップウォッチの絵に変える）
- [ ] 1.2 `~/Downloads/TimeLog/l_記録中.png`・`d_記録中.png` を同じ手順で処理し、`public/icon-recording-light.png`・`public/icon-recording-dark.png` として置く。512px でアルファがあること、四隅が透明なこと、赤い四角が残っていることを確かめる（コミット: 記録中のファビコンの画像を追加）

## 2. ファビコンの切り替え

- [ ] 2.1 `components/layout/favicons.ts` に通常用と記録中用のファビコンの URL をまとめ、`app/layout.tsx` の `metadata.icons` をそこから参照する形にする（design「ファビコンの URL を 1 か所にまとめる」）。振る舞いは変わらないことを、既存の `app/layout.test.tsx` のメタデータのテストが同じ値のまま通ることで確かめる（コミット: ファビコンの URL を 1 か所にまとめる）
- [ ] 2.2 `components/layout/RecordingFavicon.tsx` を作り、`recording` に合わせて `<head>` の `link[rel="icon"]` の `href` を記録中用・通常用に書き換える（ページ移動のたびに書き換え直す）（design「切り替えはクライアント部品で <link rel="icon"> の href を書き換える」）。`RecordingFavicon.test.tsx` で、`true` で記録中用の URL になること、`false` にすると元に戻ること、アンマウントで元に戻ること、`media` が変わらないことをテストする（コミット: 記録中のファビコンを切り替える部品を追加）
- [ ] 2.3 `RunningTaskView.tsx` に `<RecordingFavicon recording={running !== null} />` を置く。`RunningTaskView.test.tsx` で、記録中なら `<head>` のファビコンが記録中用に、記録中でなければ通常用になることをテストする。`npm test` が通ることを確かめる（コミット: 記録中はファビコンを変える）

## 3. ドキュメントと確認

- [ ] 3.1 README.md の更新が必要か確認する（proposal の見込みでは不要）。必要なら同じ PR で更新する
- [ ] 3.2 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [ ] 3.3 `npm run build` したアプリをブラウザ（Chrome と Safari）で開き、spec のシナリオを確認する: サイドバーと画面上部のロゴが新しい絵になり、周りに四角い地が出ないこと（記録中でも変わらないこと）、記録中でないときは TimeLog のロゴ、記録中は記録中用の絵がライト・ダークそれぞれで出ること、トップページでの開始・終了、「過去の記録」ページでの再開、記録中の記録の削除で再読み込みなしに切り替わること、記録中にページを移動しても記録中用の絵のままであること。ファビコンはキャッシュを避けるため新しいプライベートウィンドウで見る
- [ ] 3.4 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（例: `add-recording-favicon`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
