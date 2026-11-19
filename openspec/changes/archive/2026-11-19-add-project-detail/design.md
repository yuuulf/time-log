# Design

## Context

- `/projects` は `ProjectsView`（DB を読むサーバー側）→ `ProjectsContent`（登録欄の `ProjectForm` と、`ProjectItem` の一覧）。`ProjectItem` は色のアイコン・名前・クライアント名・説明と、編集ボタン（その場で `ProjectForm` を編集モードで開く）・削除ボタン（`window.confirm` の後 `deleteProjectAction`、記録が紐づいていれば理由を表示）を持つ
- `updateProjectAction(id, prev, formData)` は名前・色・クライアント名・説明をまとめて受け取り、入力チェックと重複の確認をしてから保存し `refresh()` する
- 記録の一覧（`EntryItem`）には、値を変えてフォーカスが外れたら保存・Enter で確定・Escape で戻す・エラーの値を残す・保存後の props で編集中でない欄だけを合わせる、という直接編集の仕組みがある
- `components/ui/DropdownMenu` がある（記録の「その他の操作」で使っている）
- Next.js 16 の `cacheComponents` では、動的なパラメータ（`params` の Promise）は `<Suspense>` の中で待つ（`node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`）。ページの props の型は `PageProps<'/projects/[id]'>`
- サイドバーの `SidebarNav` は `pathname === href` で今いるページを判定している

## Goals / Non-Goals

**Goals:**
- 一覧を短く見やすくし、詳細画面で全項目をその場で直せる
- 直接編集の操作感を記録の一覧とそろえる

**Non-Goals:**
- 詳細画面での削除、プロジェクトの記録の表示、タブのタイトルへのプロジェクト名

## Decisions

### 1. 一覧の行（`ProjectItem`）

- 色のアイコン（`decorative`。名前を文字で出すので読み上げは名前で足りる）・名前（`next/link` の `Link`、`/projects/${id}`）・クライアント名（控えめな色、空なら出さない）を 1 行に並べ、右端に `DropdownMenu`（`MoreVertical`、「その他の操作」）を置く。メニューの項目は「削除」（`Trash2`、danger）で、選ぶと今と同じく確認してから `deleteProjectAction` を呼び、失敗の理由を行の下に出す
- 編集ボタンと、行の中での編集フォームの切り替えはなくす。`ProjectForm` は登録専用にし、`project`・`onClose` の props と保存・キャンセルのボタンを消す

### 2. 詳細画面のルーティング

- `app/projects/[id]/page.tsx` に `<main>`（`max-w-3xl`）を置き、`params` の Promise を `<Suspense>` の中の `ProjectDetailView` に渡す。`ProjectDetailView`（サーバー側）は `connection()` の後に `params` を待ち、id を数に直して `getProject` で読む。id が正の整数でない、または見つからないときは、見つからない旨（`messages.projects.detail.notFound`）と一覧へ戻るリンクを出す（`notFound()` は使わない。ストリーミング中は 404 のステータスにできず、表示だけなら自前のほうが単純なため）
- 見出し（h1）はプロジェクト名。保存すると `refresh()` で新しい名前になる。タブのタイトルは静的な metadata の「プロジェクト」のまま（`generateMetadata` で DB を読むとプリレンダーの扱いが増えるため、スコープ外）
- 一覧へ戻るリンクは、見出しの上に `ArrowLeft` のアイコンと文字「プロジェクトの一覧」で置く

### 3. 詳細画面の編集（`ProjectDetail`、クライアント側）

- 名前・クライアント名（`input`）、説明（`textarea`）、色（10 色のラジオボタン。見た目は登録欄と同じ色の丸）を、ラベル付きで縦に並べる。入力欄はふだんから枠線を出す（詳細画面はフォームとして読めるほうがよいため。記録の一覧とは違う）
- 値は state で持ち、保存は今の値をすべて `FormData` にして `updateProjectAction` を呼ぶ。名前・クライアント名・説明は、フォーカスが外れたときに保存済みの値と違えば保存する。名前・クライアント名は Enter で `blur()`、説明は Enter で改行する（Enter では保存しない）。Escape はその欄を保存済みの値に戻し、その欄のエラーも消す（記録の一覧と同じ）
- 色はラジオボタンを選んだ（`onChange`）ときに、その色で保存する。矢印キーで色を移ると移るたびに保存されるが、どれも正しい値なので問題にしない
- エラーは各欄の下に出し、`aria-invalid` と `aria-describedby` を付ける。重複や見つからない（`form`）のエラーも同じ場所か画面の下に出す。次に保存できたら消す
- 保存後に props が新しくなったら、編集中でない欄（前の保存済みの値のままの欄）だけを合わせる（記録の一覧と同じ書き方）
- 代替案: 記録の一覧の直接編集の処理を共通の hook にまとめる → 欄の種類（時刻・プロジェクト・色）と保存の Server Function が違い、まとめると条件分岐が増えるので、今回は同じ考え方で別に書く

- 日本語入力の変換中の Enter（変換の確定）では、確定・保存・Escape の処理をしない（`KeyboardEvent.isComposing`、古いブラウザ向けに `keyCode === 229` も見る）。変換の確定の Enter で `blur()` すると、確定中の文字が二重に入ることがあった（PR #12 のレビューで見つかった）。記録の一覧のタスク名の欄（`EntryItem`）も同じ処理なので、合わせて直す
- 説明の欄の高さは 8 行分（`rows={8}`）にする（レビューで 4 行の倍に）

### 4. サイドバー

- `SidebarNav` の判定を、`/` は完全一致、それ以外は `pathname === href || pathname.startsWith(href + "/")` にして、詳細画面で「プロジェクト」を選ばれている表示にする
- `cacheComponents` では、`generateStaticParams` で決まらない動的なパラメータのページ（詳細画面）の下で `usePathname` がプリレンダー中に止まり、`<Suspense>` の外にあるとビルドが失敗する（`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`。実装中のビルドで確かめた）。そこで、`Sidebar` の中で `SidebarNav` を `<Suspense>` で囲む。フォールバックは、同じリンクを選ばれている表示なしで並べたもの（`SidebarNavLinks` に `current: null` を渡す）にして、プリレンダーの時点でもリンクが出るようにする。`SidebarNav` は `usePathname` で今いるページを求めて `SidebarNavLinks` に渡すだけにする

### 5. 文言

- `messages.projects` に、詳細画面の文言（一覧へ戻るリンク「プロジェクトの一覧」、見つからない旨、読み込み中）と「その他の操作」（`actions.more`）を足す。使わなくなる `actions.edit`・`save`・`cancel` は消す

## Risks / Trade-offs

- [詳細画面でフォーカスが外れただけで保存される] → 値が変わったときだけ保存し、Escape で戻せる。記録の一覧と同じ操作感にそろえる
- [直接編集の処理が記録とプロジェクトで似た形で 2 か所になる] → 今は別に書き、3 か所目が出たら共通化を検討する
