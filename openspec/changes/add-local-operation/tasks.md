# Tasks

## 1. スクリプト

- [ ] 1.1 `scripts/local/config.mjs`（置き場所）と `scripts/local/backup.mjs` を作り、`package.json` に `local:backup` を足す（design 決定 1・3）。`scripts/local/backup.test.ts` で、WAL の書き込み途中の分を含むこと、日付（日本時間）の名前、同じ日の置き換え、新しい 3 つだけ残しほかの名前のファイルに触らないこと、記録がないときをテストする（コミット: 普段使いの記録のバックアップを追加）
- [ ] 1.2 `scripts/local/launchd.mjs` で、アプリとバックアップの launchd の設定を作る関数を書く（design 決定 2）。`scripts/local/launchd.test.ts` で、`127.0.0.1`・ポート 3100・`DATABASE_URL`・`NODE_ENV`・`RunAtLoad`・`KeepAlive`・毎日 12:00・ログの場所・mise の絶対パスが入ることをテストする（コミット: launchd の設定を作る処理を追加）
- [ ] 1.3 `scripts/local/install.mjs` を作り、`package.json` に `local:install` を足す（design 決定 4）。`scripts/local/install.test.ts` で、偽の `run` を使い、clone・ビルド・記録の移し・登録の順番、普段使い用の記録があれば写さないこと、開発用の記録がなければ写さないこと、2 回目は clone せず main を最新にすること、`--branch` で別のブランチを使えることをテストする（コミット: 普段使いの導入のコマンドを追加）
- [ ] 1.4 `scripts/local/update.mjs` を作り、`package.json` に `local:update` を足す（design 決定 4）。`scripts/local/update.test.ts` で、偽の `run` を使い、バックアップ → 更新 → ビルド → 登録し直しの順番と、ビルドの失敗で前のコミットに戻してビルドし直し、起動し直して終了コード 1 になること、`--branch` の指定をテストする（コミット: 普段使いの更新のコマンドを追加）

## 2. ドキュメントと確認

- [ ] 2.1 README.md に「普段使いの起動」の節を足す: 導入（`npm run local:install`）、開く URL、更新（`npm run local:update`）、バックアップ（毎日・3 日分・`npm run local:backup`・場所）、バックアップからの戻し方、ログの場所、やめ方（launchd の登録を外して設定を消す）、開発用の記録とは分かれること（コミット: README に普段使いの起動を追記）
- [ ] 2.2 PR のブランチを push してから、この Mac で実際に `npm run local:install -- --branch add-local-operation` を実行し、spec のシナリオを確かめる: `http://127.0.0.1:3100` に開発用と同じ記録が出る、もう一度実行しても記録が上書きされない、アプリのプロセスを止めると起動し直す、この Mac の LAN のアドレスの 3100 番では開けない、開発用で `npm run build` をしても普段使い用は変わらない、`backups/` にその日のバックアップができて開ける、`npm run local:update` で起動し直して記録が残る。ログイン時の起動は、`launchctl print` で `RunAtLoad` の登録を確かめる（実際のログアウトはユーザーに任せる）
- [ ] 2.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
- マージ後に `npm run local:update` を実行し、普段使い用のアプリを main に戻す（確認のために PR のブランチで導入しているため）
