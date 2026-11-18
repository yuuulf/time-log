# Design

## Context

- `lib/db` には接続層だけがあり、`schema.ts` は空。`createDb()` は接続するだけでマイグレーションは適用せず、`lib/db/index.ts` は import した時点で接続を作る
- `next.config.ts` で `cacheComponents: true` が有効。この設定では、better-sqlite3 のような同期 API の DB 読み込みもプリレンダー時に実行されうるため、リクエストごとの値が必要なら `connection()` を呼んでから読み、`<Suspense>` で囲む必要がある（同梱ドキュメント `01-getting-started/08-caching.md`）
- 更新後の再表示は、Server Function 内で `next/cache` の `refresh()` を呼ぶ（同 `07-mutating-data.md`）
- トップページ `app/page.tsx` はアプリ名と説明だけを表示している。満たすべき振る舞いは `specs/time-tracking` を参照

## Goals / Non-Goals

**Goals:**

- 記録の読み書きのロジックを画面から切り離し、インメモリの SQLite で自動テストできるようにする
- 時刻の扱い（保存・表示・入力）を 1 か所にまとめ、以降の change（カレンダー・レポート）でも使えるようにする

**Non-Goals:**

- 記録中の経過時間のカウント表示（クライアント側のタイマー）は作らない
- E2E テストの導入はこの change でも見送る（理由は決定 8）

## Decisions

### 1. データモデル: `time_entries` テーブル 1 つ

| 列           | 型                                    | 内容                                 |
| ------------ | ------------------------------------- | ------------------------------------ |
| `id`         | integer, 主キー, 自動採番             |                                      |
| `task_name`  | text, not null, 既定値 `''`           | 空文字は「タスク名なし」             |
| `started_at` | integer（Drizzle の `timestamp_ms`）  | 開始時刻（UTC のエポックミリ秒）     |
| `ended_at`   | integer（`timestamp_ms`）, null 可    | null なら記録中                      |
| `created_at` / `updated_at` | integer（`timestamp_ms`） |                                      |

- 作業時間は保存せず、表示のたびに `ended_at - started_at` で求める（修正時に不整合が起きない）
- 記録中は 1 件までを DB でも保証する: 式インデックス `CREATE UNIQUE INDEX ... ON time_entries ((ended_at IS NULL)) WHERE ended_at IS NULL`。SQLite の一意インデックスは NULL どうしを重複とみなさないため、列ではなく式に張る。Drizzle のスキーマで表現できない場合は、生成したマイグレーション SQL に手で追記する
- 一覧用に `started_at` にインデックスを張る
- 次の change でプロジェクトを追加するときは、null 可の `project_id` 列を足す想定（今は作らない）

### 2. マイグレーションの自動適用と接続の遅延生成

- `createDb()` の中で `drizzle-orm/better-sqlite3/migrator` の `migrate()` を実行し、`drizzle/` のマイグレーションを適用する。テストで `createDb(":memory:")` を呼ぶだけで本番と同じスキーマになり、利用者が `npm run db:migrate` を忘れても動く
- `lib/db/index.ts` は `export const db` をやめ、初回呼び出しで接続を作ってそれを使い回す `getDb()` にする。ビルド時にモジュールを読み込んだだけで DB ファイルが作られるのを防ぐ
- 代替案: 起動スクリプトで `db:migrate` を実行する → 実行忘れやテスト側の準備が必要になるので不採用

### 3. モジュール構成

- `lib/time.ts`: 日本時間（`Asia/Tokyo` 固定）での時刻・日付・作業時間の表示と、`datetime-local` 入力値との変換。Next.js や DB に依存しない純粋な関数にする
- `lib/time-entries/repository.ts`: 記録の読み書き（開始・終了・修正・削除・一覧・記録中の取得・タスク名候補）。すべて `Db` と現在時刻 `now` を引数で受け取り、テストで時刻を固定できるようにする
- `lib/time-entries/validation.ts`: フォーム入力のチェック。項目ごとのエラー文言（`lib/messages.ts`）を返す
- `lib/time-entries/actions.ts`（`"use server"`）: Server Functions。入力チェック → repository 呼び出し → `refresh()` だけを行う薄い層にする
- `components/time-entries/`: 画面の部品（決定 6）

### 4. 時刻の扱い

- 保存は UTC のエポックミリ秒、表示は `Intl.DateTimeFormat`（`timeZone: "Asia/Tokyo"`）で行う。サーバーのタイムゾーンに依存させない
- 修正フォームは `<input type="datetime-local" step="1">` を使い、秒まで表示・入力する（分単位だと、時刻を変えずに保存しただけで秒が切り捨てられるため）。入力値は日本時間として `+09:00` を付けて解釈する（日本は夏時間がないため固定オフセットでよい）
- 作業時間は分単位に切り捨てて「1時間5分」「5分」「0分」と表示する
- 「直近 30 日」は現在時刻から 30×24 時間前以降に開始した記録とし、日付ごとのまとまりは開始時刻の日本時間の日付で分ける

### 5. 記録中の記録の自動終了

開始の処理は 1 つのトランザクションで行う: 記録中の記録があれば `ended_at = now` で終了し、`started_at = now` の新しい記録を作る。better-sqlite3 は同期 API なので Drizzle のトランザクションで確実にまとめられる。決定 1 の一意インデックスが最後の砦になる。

### 6. 画面の構成

- `app/page.tsx` はアプリ名と説明の下に `<Suspense>` で `TimeTracker` を置く。`TimeTracker` は async の Server Component で、`await connection()` の後に記録中の記録・一覧・候補を読み込む
- `StartStopForm`（Client Component）: タスク名の入力欄（`<datalist>` で候補を表示）と「開始する」、記録中なら記録中のタスク名・開始時刻と「終了する」。`useActionState` で入力エラーと送信中の状態を表示する
- `EntryList`（Server Component）: 日付ごとの見出しと記録の並び。記録がなければその旨の文言を表示する
- `EntryItem`（Client Component）: 1 件の表示。「修正する」でその場に修正フォームを開き、「削除する」は `window.confirm` で確認してから Server Function を呼ぶ
- 文言はすべて `lib/messages.ts` に追加する。ボタンは「開始する」「終了する」「修正する」「保存する」「キャンセルする」「削除する」

### 7. 入力チェック

- 新しい依存は追加せず、手書きの小さな関数で行う。チェック項目はタスク名の長さ（前後の空白を除いて 200 文字以内）、時刻の形式、終了 > 開始、未来の時刻でないこと
- 代替案: zod などのスキーマライブラリ → 項目が少なく、追加する利点が小さいので見送る。フォームが増えたら再検討する

### 8. テスト

- `lib/time.ts`・`validation.ts`: 単体テスト
- `repository.ts`: `createDb(":memory:")` で本物の SQLite に対してテストする（node 環境）。自動終了、一意インデックス、30 日の範囲、候補の並びと重複除去を確かめる
- `actions.ts`: `server-only`・`next/cache` と `getDb()` を差し替え、入力エラー時に保存しないことと、成功時に `refresh()` を呼ぶことを確かめる
- Client Component（`StartStopForm`・`EntryItem`）: Testing Library で、表示の切り替え、候補、削除の確認・取り消しを確かめる（Server Function は差し替える）
- async の `TimeTracker` は Vitest では描画できないため、上記の層ごとのテストと、ブラウザでの動作確認で補う。E2E（Playwright）は導入コストに対して、まだ画面が 1 つで層ごとのテストで十分なので、カレンダー入力の change で改めて検討する

## Risks / Trade-offs

- [`cacheComponents` 下での DB 読み込みの扱いを誤ると、ビルドエラーや古い表示になる] → `connection()` + `<Suspense>` の形に統一し、`npm run build` をタスクの確認に含める
- [式の一意インデックスを drizzle-kit が生成できない] → マイグレーション SQL に手で追記し、repository のテストで二重の記録中が作れないことを確かめる
- [日本時間固定のため、海外から使うと時刻がずれて見える] → 今回はスコープ外。必要になったら表示用のタイムゾーンを設定にする
- [`<datalist>` の見た目や操作はブラウザごとに異なる] → 候補を選べることだけを要件とし、見た目の統一は求めない
- [起動時に自動でマイグレーションするため、壊れたマイグレーションがあるとアプリが起動しない] → マイグレーションは repository のテストで毎回適用されるので、CI で検出できる

## Migration Plan

新しいテーブルを追加するだけで、既存データはない。マイグレーションはアプリが初めて DB に接続したときに自動で適用される。戻すときはこの change の revert と、`data/timelog.db` の削除（またはテーブルの削除）を行う。
