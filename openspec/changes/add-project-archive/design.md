# Design

## Context

- `projects` テーブルは id・名前（一意インデックス）・色・クライアント名・説明・作成日時・更新日時を持つ。`time_entries.project_id` は `projects.id` を参照し、削除は禁止（`ON DELETE restrict`）
- `listProjects(db)` が登録順の全件を返し、「プロジェクト」ページ（`ProjectsView`）と、記録の選択肢を読む `TimeTracker`・`EntryHistory` で使っている
- 記録のプロジェクトは `left join` で読むので、プロジェクトの状態に関係なくアイコンと名前を出せる
- `ProjectPicker` は `value`（今のプロジェクト）と `projects`（選択肢）を受け取り、今の値を選択肢の中で探して選ばれている表示にする。見つからないときは先頭（「プロジェクトなし」）を選ばれている扱いにしている
- 一覧の行（`ProjectItem`）は `DropdownMenu` の「削除」を持つ。サイドバーは `/projects/...` の下でも「プロジェクト」を選ばれている表示にする（実装済み）。`/projects/archived` は静的なルートなので `[id]` より優先される
- `startEntryAction`・`updateEntryAction` は、`projectId` のプロジェクトが存在するかだけを確かめる

## Goals / Non-Goals

**Goals:**
- 使わなくなったプロジェクトを、データを消さずに普段の一覧と選択肢から外す
- いつでも元に戻せる

**Non-Goals:**
- アーカイブしたプロジェクトで記録を始めることの禁止、まとめての操作、アーカイブの日時の表示

## Decisions

### 1. データ

- `projects` に `archived_at`（`integer` の timestamp_ms、null 可、既定は null）を足す。null ならアーカイブしていない。真偽値ではなく日時にしておくと、あとで「いつアーカイブしたか」を出せる
- マイグレーションは `npm run db:generate -- --name add_project_archived_at` で作り、生成された SQL（`ALTER TABLE ... ADD archived_at integer`）を確かめる。既存の行は null になる
- 名前の一意インデックスはそのまま（アーカイブしたプロジェクトとも重複させない）

### 2. 読み書き（`lib/projects/repository.ts`・`actions.ts`）

- `listProjects(db, { archived })`: `archived: false` なら `archived_at IS NULL`、`true` なら `IS NOT NULL` を登録順で返す。引数は必須にして、呼ぶ側が意図して選ぶようにする（`ProjectsView`・`TimeTracker`・`EntryHistory` は `false`、アーカイブ済みの画面は `true`）
- `setProjectArchived(db, id, archivedAt: Date | null, now)`: アーカイブ（日時を入れる）と解除（null）。見つからなければ false
- Server Functions `archiveProjectAction(id)`・`unarchiveProjectAction(id)`: id を確かめ、`setProjectArchived` の後に `refresh()`。見つからなければ `errors.form` に見つからない旨を返す
- 記録の Server Functions は変えない（アーカイブしたプロジェクトの id も受け付ける）。選択肢に出さないことで新しく選べないようにし、すでに紐づいた記録の修正（プロジェクトの id をそのまま送る）や再開を壊さない

### 3. 一覧とアーカイブ済みの画面

- `ProjectItem` に `archived` の props を足し、メニューの項目を切り替える。通常は「アーカイブ」（lucide の `Archive`）→「削除」、アーカイブ済みでは「アーカイブ解除」（`ArchiveRestore`）→「削除」。アーカイブ・解除は確認なしで呼び、失敗の理由は削除と同じく行の下に出す
- 一覧の見出しの横は「新規作成」（`TextLink`）の右に、`IconLink`（`Archive`、名前「アーカイブ済み」、`/projects/archived`）を置く
- `app/projects/archived/page.tsx`: `<main>`（`max-w-3xl`）に、一覧へ戻るリンク（`BackLink`）、見出し（h1）「アーカイブ済みのプロジェクト」と、`<Suspense>` の中の `ArchivedProjectsView`（`connection()` の後に `listProjects(db, { archived: true })`）を置く。一覧の部分は `ProjectItem` を `archived` で並べる `ArchivedProjectsContent`。ないときは「アーカイブしたプロジェクトはありません。」
- 詳細画面（`ProjectDetailView` → `ProjectDetail`）に `archived`（`archived_at` があるか）を渡し、見出しの下に「アーカイブ済みのプロジェクトです。」を控えめな色で出す

### 4. 記録の選択肢

- `TimeTracker`・`EntryHistory` は `listProjects(db, { archived: false })` を選択肢にする
- `ProjectPicker` は、今の値が選択肢にないとき（アーカイブしたプロジェクトが紐づいた記録）、ボタンには今の値（記録に付いたプロジェクトのアイコンと名前）を出し、開いたときはどの選択肢も選ばれている表示にせず、先頭にフォーカスする。今は先頭の「プロジェクトなし」が選ばれている表示になってしまうため直す
- `EntryItem` は、今のプロジェクトが選択肢にないときも `entry.project` を表示に使う（今の作りのまま）。タスク名などの保存では今のプロジェクトの id をそのまま送るので、プロジェクトは変わらない

### 5. 文言

- `messages.projects` に、「アーカイブ」「アーカイブ解除」「アーカイブ済み」（ボタンの名前）、アーカイブ済みの画面の見出し「アーカイブ済みのプロジェクト」、ないときの文言、詳細画面の「アーカイブ済みのプロジェクトです。」を足す

## Risks / Trade-offs

- [アーカイブしたプロジェクトでも、再開すれば記録が始まる] → 元の記録と同じプロジェクトで続けるという再開の約束を優先する。禁じたくなったら別の change で扱う
- [`listProjects` の引数が必須になり、呼び出しを全部直す必要がある] → 3 か所だけで、型チェックで漏れが分かる
