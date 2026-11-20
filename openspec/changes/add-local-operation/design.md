# Design

## Context

- 今は開発用のリポジトリ（`~/ghq/github.com/yuuulf/time-log`）で `npm run dev` を動かし、記録は `data/timelog.db`（WAL モード。`-wal`・`-shm` のファイルを伴う）にある
- `npm run build` は `.next/` を作り直すので、開発中のビルドと普段使いのアプリが同じリポジトリにあると、開発の作業が普段使いのアプリを止めたり、作業中のブランチの版で動かしたりしてしまう
- DB の場所は環境変数 `DATABASE_URL` で変えられる（`lib/db/config.ts`）。マイグレーションはアプリが DB に接続したときに自動で当たる
- Node.js は mise で管理していて、launchd から動かすプログラムには、ログインシェルの `PATH`（mise の設定）が効かない
- 既存のスクリプトは `scripts/*.mjs`（Node.js の ES モジュール）で書き、`scripts/*.test.ts` で Vitest のテストを置いている
- この Mac には `/opt/homebrew/bin/mise` と、macOS 付属の `launchctl` がある。リポジトリは GitHub で公開されている

## Goals / Non-Goals

**Goals:**

- 普段使いのアプリ・記録・ビルドを開発用のリポジトリから切り離す
- 導入・更新・バックアップを、それぞれ 1 つのコマンド（と launchd の自動実行）にする
- 処理の流れ（失敗したときに戻す手順など）を、実際のコマンドを動かさずにテストできる形にする

**Non-Goals:**

- 依存パッケージの追加（launchd の設定ファイルは文字列で作り、DB のバックアップは導入済みの better-sqlite3 を使う）
- 複数のユーザーや複数の Mac での同時利用

## Decisions

### 1. 置き場所

| もの | 場所 |
| --- | --- |
| 普段使い用のアプリ | `~/Library/Application Support/TimeLog/app`（main ブランチの git clone） |
| 記録 | `~/Library/Application Support/TimeLog/timelog.db` |
| バックアップ | `~/Library/Application Support/TimeLog/backups/timelog-YYYY-MM-DD.db` |
| ログ | `~/Library/Logs/TimeLog/`（アプリ・バックアップごとに 1 ファイル） |
| launchd の設定 | `~/Library/LaunchAgents/local.timelog.app.plist`・`local.timelog.backup.plist` |

- 場所は `scripts/local/config.mjs` にまとめ、ホームディレクトリから求める。テストでは場所を引数で差し替える
- 普段使い用のアプリは、開発用のリポジトリの `origin` の URL から clone する
  - 別案: `git worktree`。main は開発用のリポジトリで checkout しているため同じブランチを使えず、開発用の `.git` を共有するので切り離しにならない
  - 別案: 開発用のリポジトリでそのまま `next start`。上の Context のとおり、開発の作業とぶつかる

### 2. launchd の設定（`scripts/local/launchd.mjs`）

設定ファイルの中身（XML の plist）は、場所と mise のパスを受け取って文字列を返す関数で作る。

- アプリ（`local.timelog.app`）
  - 実行: `<mise> exec -- node_modules/.bin/next start -H 127.0.0.1 -p 3100`。作業ディレクトリは普段使い用のアプリ
  - 環境変数: `DATABASE_URL`（普段使い用の記録）、`NODE_ENV=production`
  - `RunAtLoad`（ログイン時に起動）と `KeepAlive`（止まったら起動し直す）
- バックアップ（`local.timelog.backup`）
  - 実行: `<mise> exec -- node scripts/local/backup.mjs`。作業ディレクトリは普段使い用のアプリ、環境変数は同じ
  - `RunAtLoad`（ログイン時）と `StartCalendarInterval`（毎日 12:00）。launchd は、スリープ中に過ぎた時刻の分を起きたときに 1 回実行する。電源が切れていた日は実行しない
- mise のパスは、導入のときに `PATH` から探した絶対パスを書き込む（launchd ではシェルの設定が効かないため）
- 登録は `launchctl bootout`（登録済みなら外す。失敗は無視）→ `launchctl bootstrap gui/<uid> <plist>` の順で行い、何度実行しても同じ状態にする
- `-H 127.0.0.1` で、自分の Mac からの接続だけを受ける

### 3. バックアップ（`scripts/local/backup.mjs`）

- better-sqlite3 の `db.backup()`（SQLite のオンラインバックアップ）で、WAL の書き込み途中の分も含めて、アプリが動いている間でも壊れていない複製を作る
  - 別案: ファイルのコピー（`cp`）。`-wal` に残っている記録が抜け落ちる（実際に、`timelog.db` だけを写すとテーブルが空になった）
- 一時ファイルに書いてから `timelog-YYYY-MM-DD.db`（日本時間の日付）へ名前を変え、同じ日の分を置き換える。途中で止まっても前の分が壊れない
- `timelog-YYYY-MM-DD.db` の形の名前のファイルを日付の新しい順に並べ、4 つ目以降を消す（ほかの名前のファイルには触らない）
- 記録のファイルがないときは、何もせずに理由をログに書いて正常終了する
- 名前の決め方と消すファイルの選び方は、純粋な関数にしてテストする

### 4. 導入（`scripts/local/install.mjs`）と更新（`scripts/local/update.mjs`）

どちらも、コマンドを実行する関数（`run`）を引数で受け取る形にし、処理の順番と失敗したときの流れを、偽の `run` でテストする。実際のコマンドは `spawnSync` で実行し、失敗したら止める。

- 導入
  1. macOS でなければ止める
  2. 普段使い用のアプリがなければ clone し、あれば main の最新にする
  3. `mise trust` → `mise install` → `npm ci` → `npm run build`（普段使い用のアプリの中で）
  4. 普段使い用の記録がなければ、開発用の `data/timelog.db` を 3 と同じオンラインバックアップで写す（開発用の記録もなければ写さない。アプリが空の記録を作る）
  5. launchd の設定を書いて登録し、`http://127.0.0.1:3100` が応答するまで待って、URL を表示する
- 更新
  1. バックアップをとる（3 の処理）
  2. 更新前のコミットを覚え、`git fetch` → main を `origin/main` に合わせる（普段使い用のアプリでは変更しない前提なので `reset --hard`）
  3. `npm ci` → `npm run build`
  4. 失敗したら、覚えたコミットに戻して `npm ci` → `npm run build` をやり直し、アプリを起動し直して、失敗を表示して終了コード 1 で終わる
  5. 成功したら、launchd の設定を書き直して登録し直す（設定が変わった版にも追従するため。登録し直すとアプリも起動し直す）
- `package.json` に `local:install`・`local:update`・`local:backup` を足す。`local:backup` は開発用のリポジトリからでも普段使い用の記録をバックアップする

### 5. テスト

- `scripts/local/*.test.ts`（Vitest、node の環境）
  - バックアップ: 一時ディレクトリに WAL モードの DB を作って書き込み、バックアップに書き込み途中の分も入ること、3 つだけ残ること、同じ日は置き換わること、記録がないとき
  - launchd: 設定の中身（`127.0.0.1`・ポート・`DATABASE_URL`・`KeepAlive`・12:00）
  - 導入・更新: 偽の `run` で、コマンドの順番、記録があるときに写さないこと、ビルドの失敗で前のコミットに戻すこと
- launchd への登録・ログイン時の起動・ほかの端末から開けないことは、この Mac で実際に導入して確かめる（タスク 2.2）

## Risks / Trade-offs

- [導入の後も、開発用の `npm run dev` は `data/timelog.db` を使う] → 開発用の記録は普段使いと分かれる（それが目的）。README に、普段使いは `127.0.0.1:3100` で記録すると書く
- [電源を切っていた日はバックアップがない] → ユーザーの希望どおり（Mac が起動していればよい）。消すのは「新しい 3 つ」より古いものだけなので、休んだ日があっても直近の 3 回分は残る
- [更新のビルド中は、普段使い用のアプリが応答しないことがある] → ビルドは数十秒で終わる。失敗したときも前の版でビルドし直して戻す
- [launchd から mise を使うため、mise を移したりアンインストールしたりすると起動しなくなる] → README に、そのときは `npm run local:install` をやり直すと書く
