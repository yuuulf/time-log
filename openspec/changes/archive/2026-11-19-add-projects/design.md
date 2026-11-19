# Design

## Context

- 記録は `time_entries`（`lib/db/schema.ts`）に 1 行ずつ保存し、タスク名は文字列で持つ。DB は drizzle-orm + better-sqlite3 で、`createDb`（`lib/db/client.ts`）が接続時に `foreign_keys = ON` を設定し、`drizzle/` のマイグレーションを適用する。マイグレーションは `npm run db:generate`（drizzle-kit）で作る
- 記録の DB 操作は `lib/time-entries/repository.ts`、入力チェックは `validation.ts`、Server Functions は `actions.ts`（すべて `refresh()` を呼ぶ）にある
- 画面は `TimeTracker`（トップ）と `EntryHistory` → `HistoryContent`（過去の記録）が記録を読み、`EntryList` → `EntryItem` に渡す。記録の開始と記録中の枠は `StartStopForm`、サイドバーの記録中のタスクは `RunningTask` → `RunningTaskView`
- 色は `app/globals.css` のトークン（ライト・ダーク）を Tailwind の `@theme inline` で使う。色コードをコンポーネントに書かない決まりがある
- 要件は specs/projects/spec.md、specs/time-tracking/spec.md、specs/app-shell/spec.md を参照

## Goals / Non-Goals

**Goals:**

- プロジェクトの DB・入力チェック・Server Functions を記録と同じ形（repository / validation / actions）でそろえる
- 記録が紐づいたプロジェクトを削除できないことを、アプリのチェックと DB の外部キーの両方で守る

**Non-Goals:**

- 集計・絞り込み・アーカイブ（proposal のスコープ外を参照）

## Decisions

### 1. DB

- `projects` テーブル: `id`、`name`（一意インデックス）、`color`（色のキー。例 `teal`）、`client_name`（既定 `''`）、`description`（既定 `''`）、`created_at`、`updated_at`
- `time_entries` に `project_id`（null 可、`projects.id` への外部キー、`ON DELETE RESTRICT`）とインデックスを足す
- マイグレーションは `npm run db:generate` で作り、生成された SQL を確かめてからコミットする。`time_entries` はほかのテーブルから参照されていないので、drizzle-kit がテーブルを作り直す SQL を出しても外部キーの制約には当たらない。既存の記録は `project_id` が null（プロジェクトなし）になる
- 理由: 削除の禁止を DB でも守ると、チェックと削除の間に記録が紐づいた場合でも壊れない。色はキーで持つと、トークンの値を変えたときに既存のプロジェクトにも反映できる

### 2. 色

- `lib/projects/colors.ts` に 10 色のキー（`red`・`orange`・`amber`・`green`・`teal`・`sky`・`blue`・`violet`・`pink`・`brown`）と、それぞれの名前（「赤」「橙」「黄」「緑」「青緑」「水色」「青」「紫」「ピンク」「茶」、`lib/messages.ts`）、Tailwind のクラス（色の選択に使う背景の `bg-project-red` と、アイコンに使う文字色の `text-project-red` など）の対応を置く。並びは色相の順（赤から紫・ピンク）で、無彩色に近い茶を最後に置く。Tailwind がクラスを見つけられるよう、クラス名は文字列のまま書く
- `app/globals.css` に `--project-red` などのトークンをライト・ダークの両方で定義し、`@theme inline` で `--color-project-red` として使えるようにする
- 色の選択は `fieldset`（凡例「色」）の中のラジオボタン 10 個。見た目は色の丸で、ラジオボタンのラベルに色の名前（読み上げ用）と `title` を付ける
- 代替案: `<input type="color">` で自由に選ぶ → 色コードをデータに持つことになり、ダークモードでの見え方をそろえられないので不採用

### 3. プロジェクトのロジック（`lib/projects/`）

- `validation.ts`: `validateProjectInput` が名前（必須・100 文字以内）、色（10 色のキー）、クライアント名（100 文字以内）、説明（1000 文字以内）を確かめる。前後の空白を除き、文字数はコードポイントで数える（タスク名と同じ）。`parseProjectId` はフォームの値を「プロジェクトなし（null）」「id」「不正」のどれかにする
- `repository.ts`: `listProjects`（登録順）、`getProject`、`findProjectByName`、`createProject`、`updateProject`、`deleteProject`。`deleteProject` はトランザクションの中で紐づいた記録の数を数え、1 件以上なら削除せず `"in-use"` を返す
- `actions.ts`: `createProjectAction`、`updateProjectAction`（`bind(null, id)` で使う）、`deleteProjectAction`。名前の重複は `findProjectByName` で確かめ、同時に登録されて一意インデックスに当たった場合も同じ文言を返す。どれも成功したら `refresh()` を呼ぶ

### 4. 記録への紐づけ（`lib/time-entries/`）

- `startEntry` と `updateEntry` に `projectId`（null 可）を足す
- 記録を読む関数（`getRunningEntry`、`listRecentEntries`、`listEntriesBetween`）は `projects` を `left join` し、`project: { id, name, color } | null` を付けた形で返す。プロジェクトを編集すると、記録の表示にもそのまま反映される
- `startEntryAction` と `updateEntryAction` は `projectId` を `parseProjectId` で読み、id ならプロジェクトがあることを確かめる。なければ「プロジェクトが見つかりません。ページを読み込み直してください。」を返して保存しない
- 再開ボタンのフォームは、タスク名に加えて元の記録の `projectId` を hidden で送る

### 5. 画面

- `components/projects/ProjectIcon.tsx`: プロジェクトの色で塗りつぶしたフォルダのアイコン（lucide-react の `Folder` に `fill="currentColor"` と文字色のクラスを付ける。`role="img"`、`aria-label` と `title` にプロジェクト名。`decorative` のときは `aria-hidden` にして `title` だけ付ける）。記録の一覧、記録中の枠、サイドバー、プロジェクトの一覧で使う
- `components/projects/ProjectSelect.tsx`: `<select name="projectId">`。先頭が「プロジェクトなし」（値は空）、続けて登録順のプロジェクト。記録の開始と修正で使う
- 「プロジェクト」ページ（`app/projects/page.tsx`）: 見出しの下の `<Suspense>` の中で、async Server Component の `ProjectsView` が `connection()` の後に `listProjects` で読み、表示部品の `ProjectsContent` に渡す（`EntryHistory` / `HistoryContent` と同じ分け方で、表示部分をテストできるようにする）
  - `ProjectForm`（登録）: 名前・クライアント名・説明の入力欄、色の選択、「登録」ボタン（`Plus` アイコン）。登録できたら入力欄を空に戻す
  - `ProjectItem`（1 件）: 色のアイコン・名前・クライアント名・説明と、「編集」（`Pencil`）・「削除」（`Trash2`）ボタン。編集はその場でフォームを開き（`EntryItem` と同じ）、「保存」「キャンセル」。削除は確認してから行い、削除できなかったら理由を表示する
- トップページと過去の記録: `TimeTracker` と `EntryHistory` が `listProjects` も読み、`StartStopForm`（選択肢）と `EntryList` → `EntryItem`（修正の選択肢）に渡す。`EntryItemData` に `project` を足し、記録の一覧（`EntryItem`）ではタスク名の左側に `ProjectIcon` を置き、アイコンの位置で記録を見比べやすくする。サイドバーの記録中のタスクと記録中の枠では、タスク名の右側に置く。トップページの記録中の枠（`StartStopForm`）だけは、アイコンの横にプロジェクト名を文字で表示する。名前が文字で読めるので、ここではアイコンを読み上げの対象から外し（`ProjectIcon` に `decorative` を渡すと `aria-hidden` になる）、名前を二重に読まないようにする
- サイドバー: `SidebarNav` のページのリンクに「プロジェクト」（`/projects`）を足す

### 6. 文言

- `lib/messages.ts` に `projects`（ページ見出し「プロジェクト」、項目名、色の名前、ボタン名「登録」、記録がないときの文言、削除の確認、エラー）と、記録側の「プロジェクト」「プロジェクトなし」「プロジェクトが見つかりません。…」を足す
- エラー: 「プロジェクト名を入力してください。」「プロジェクト名は100文字以内で入力してください。」「同じ名前のプロジェクトがあります。」「クライアント名は100文字以内で入力してください。」「説明は1000文字以内で入力してください。」「色を選んでください。」「記録が紐づいているため、このプロジェクトは削除できません。」「プロジェクトが見つかりません。ページを読み込み直してください。」

## Risks / Trade-offs

- [選択肢のプロジェクトが多くなると `<select>` で探しにくい] → 今は登録順で十分とし、増えたらアーカイブや検索を別の change で検討する
- [記録が紐づいたプロジェクトは消せないので、使わなくなったプロジェクトが選択肢に残る] → アーカイブを別の change で扱う
- [色だけでは区別しにくい人がいる] → アイコンにポインタを合わせるとプロジェクト名が出て、読み上げでも名前を読む。色の選択肢にも名前を付ける
- [マイグレーションで既存の `time_entries` を作り直す SQL が出る場合がある] → 生成された SQL を確かめ、既存の DB のコピーにも適用して記録が残ることを確認する
