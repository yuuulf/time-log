# Design

## Context

- `/projects` は `ProjectsContent` が登録欄（`ProjectForm`、登録専用、送信で `createProjectAction`、成功で入力欄を空に戻す）と一覧（`ProjectItem`）を並べている
- 詳細画面（`/projects/[id]`）は `ProjectDetail` が、一覧へ戻るリンク・見出し（プロジェクト名）・名前・色（`ProjectColorPicker`）・クライアント名・説明（8 行）の欄を縦に並べ、その場で編集する。入力欄の見た目は枠線のあるフォームの見た目
- `createProjectAction` は成功すると `refresh()` して `{ ok: true }` を返す
- `components/ui/` にはアイコンだけのボタン・リンク（`IconButton`・`IconLink`）しかない。文字のあるボタンは今はない
- サイドバーの `SidebarNav` は `/projects` の下のページ（`/projects/...`）でも「プロジェクト」を選ばれている表示にする（前の change で対応済み）。`/projects/new` は静的なルートなので、動的な `[id]` より優先される

## Goals / Non-Goals

**Goals:**
- 一覧ページを一覧だけにし、登録画面を詳細画面と同じ並びにする

**Non-Goals:**
- 詳細画面の編集方法、入力チェック、作成後に詳細画面へ移ること

## Decisions

### 1. 共通の項目の並び（`ProjectFields`）

- 名前・色・クライアント名・説明の欄（ラベル、入力欄、エラーの表示、`aria-invalid`・`aria-describedby`）を `ProjectFields` にまとめ、詳細画面と登録画面で使う。props は `idPrefix`・`values`・`errors`・`onChange(field, value)`・`onColorChange(color)`・`fieldProps?(field)`（欄ごとに足す props。詳細画面は `onBlur`・`onKeyDown` を渡す）と、入力欄の `name`（登録画面ではフォームで送るため `name="name"` などを付ける）
- `ProjectDetail` は `ProjectFields` を使う形に書き換える（見た目と動きは変えない）

### 2. 登録画面

- `app/projects/new/page.tsx` に `<main>`（`max-w-3xl`）と `ProjectForm` を置く。DB を読まないので `<Suspense>` はいらない。タイトルは「プロジェクトの登録」
- `ProjectForm` は、一覧へ戻るリンク（詳細画面と同じ `BackLink` を共通にして使う）・見出し「プロジェクトの作成」・`ProjectFields`・「作成」ボタン（各項目の下に右寄せ。`flex justify-end`）の並びにする。送信は今と同じく `onSubmit` で受けて `createProjectAction` を呼ぶ（React 19 の `<form action>` のリセットで選んだ色が戻るのを避けるため）。成功したら `useRouter().push("/projects")` で一覧に戻る（作成で `refresh()` 済みなので、一覧には作ったプロジェクトが出る）。エラーのときは入力値を残す
- 代替案: Server Function の中で `redirect("/projects")` する → 登録欄のテストや、成功・失敗で返す形が変わるので、今の返し方のまま画面側で移動する

### 3. 一覧ページ

- `ProjectsContent` から登録欄をなくし、一覧の見出し（h2「プロジェクトの一覧」）の右に「新規作成」のリンク（`/projects/new`）を置く。プロジェクトがないときの文言は「まだプロジェクトがありません。「新規作成」から作成できます。」にする

### 4. 文字のあるボタン（`components/ui/TextButton.tsx`）

- アイコンと文字を並べるボタン `TextButton`（`<button>`）とリンク `TextLink`（`next/link`）を作る。見た目は `IconButton` と同じ variant（primary・secondary・danger）の色で、高さ 40px（`h-10`）、左右に余白、アイコンは文字の左。文字があるので `aria-label`・`title` は付けない
- 「新規作成」は `TextLink`（`Plus`、secondary）、「作成」は `TextButton`（`type="submit"`、primary、アイコンなし）
- 言葉は「作成」でそろえる（一覧の「新規作成」、見出し「プロジェクトの作成」、ボタン「作成」）。どれも名詞形で、ボタンの文言のルールに沿う。レビューで、最初の「追加」「プロジェクトの登録」「プロジェクトを作成」がそろっていないと指摘を受け、ユーザーが「作成」を選んだ

### 5. 文言

- `messages.projects` に「新規作成」（`actions.add`）、「作成」（`actions.createSubmit`）を足し、登録画面の見出し（`formHeading`）を「プロジェクトの作成」にし、使わなくなる `actions.create`（「登録」）を消す。`empty` を新しい文言にする

## Risks / Trade-offs

- [登録画面で入力の途中に一覧へ戻ると、入力が捨てられる] → 入力量が少ないので確認は出さない（スコープ外）
- [`ProjectDetail` の書き換えで、その場の編集の動きが変わる] → 既存の `ProjectDetail.test.tsx` をそのまま通して確かめる
