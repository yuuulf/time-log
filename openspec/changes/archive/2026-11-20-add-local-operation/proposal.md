# Proposal

## Why

TimeLog は自分の Mac で普段使いするアプリだが、今は開発用の `npm run dev` で動かし、記録も開発と同じ `data/timelog.db` に入っている。開発や確認の作業で本物の記録を壊すおそれがあり、Mac を起動するたびに手で立ち上げる手間もある。また、記録のバックアップの仕組みがない。

普段使いのアプリを開発用の作業場所と分けて自動で動かし、更新とバックアップを手軽にできるようにする。

## What Changes

- 普段使いの導入を 1 つのコマンド（`npm run local:install`）でできるようにする
  - 普段使い用のアプリを、開発用とは別の場所（`~/Library/Application Support/TimeLog/app`）に main ブランチから用意してビルドする
  - 記録は `~/Library/Application Support/TimeLog/timelog.db` に置く。初めて導入するときは、開発用の `data/timelog.db` の記録を移す（その場所にまだ記録がないときだけ）
  - アプリは自分の Mac からだけ開ける `http://127.0.0.1:3100` で動かす
  - ログインしたときにアプリを自動で起動し、止まったときは起動し直す（macOS の launchd に登録する）
- 更新を 1 つのコマンド（`npm run local:update`）でできるようにする
  - 普段使い用のアプリを main の最新にし、依存のインストールとビルドをして、アプリを起動し直す
  - ビルドに失敗したときは、更新前の版に戻して動かし続け、失敗したことを伝える
- 記録を毎日バックアップする
  - Mac が起動しているとき、1 日 1 回、記録のバックアップをとる（ログインしたときと毎日決まった時刻。その時刻にスリープしていたら、起きたときにとる）
  - バックアップは日付ごとに 1 つ作り、新しい 3 日分だけを残す
  - アプリが動いている間でも、壊れていないバックアップをとる
  - 手でとるコマンド（`npm run local:backup`）も用意する
- README に「普段使いの起動」の節を足し、導入・更新・バックアップ・バックアップからの戻し方・やめ方を書く

### スコープ外（やらないこと）

- Mac 以外（Linux・Windows）での自動起動
- 他の端末からのアクセスやログインの仕組み
- バックアップを別の場所（クラウドなど）へ送ること（Time Machine に任せる）
- バックアップからの戻しをコマンドにすること（README に手順を書く）
- 普段使いをやめるコマンド（README に手順を書く）
- アプリの画面や記録の扱いの変更

### README.md の更新

README に「普段使いの起動」の節を足す。同じ PR で更新する。

## Capabilities

### New Capabilities

- `local-operation`: 自分の Mac で TimeLog を普段使いするために、開発用と分けた場所でアプリを自動で起動し、1 つのコマンドで更新し、記録を毎日バックアップする仕組み

### Modified Capabilities

（なし）

## Impact

- `scripts/local/`（新規）: 導入・更新・バックアップのスクリプトと、launchd の設定ファイルを作る処理。それぞれのテスト
- `package.json`: `local:install`・`local:update`・`local:backup` のコマンドを追加
- README.md
- 手元の Mac: `~/Library/Application Support/TimeLog/`（アプリ・記録・バックアップ）、`~/Library/LaunchAgents/`（launchd の設定 2 つ）、`~/Library/Logs/TimeLog/`（ログ）
- アプリのコードと DB のテーブルの変更、依存パッケージの追加はなし
