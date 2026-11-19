# Design

## Context

- `app/layout.tsx` の `<body>`（`flex flex-col`）が `Header` と各ページの `<main>` を縦に並べている。`Header`（`components/layout/Header.tsx`）はアプリ名と「過去の記録」のリンクだけを持つ Server Component
- 各ページの `<main>` は `mx-auto w-full max-w-3xl flex-1 px-4 py-12`
- `next.config.ts` で `cacheComponents` が有効。DB を読む部品は `<Suspense>` の中で `connection()` の後に読む（`TimeTracker`、`EntryHistory`）
- 記録中のタスクは `lib/time-entries/repository.ts` の `getRunningEntry` で読める。記録を変える Server Functions（開始・終了・修正・削除）はすべて `refresh()` を呼ぶ。`refresh()` はクライアントのルーターを更新するので、レイアウトの中の Server Component も読み直される
- トップページの記録中の枠（タスク名・開始時刻・停止ボタン）は `StartStopForm` にあり、今回は変えない
- 要件は specs/app-shell/spec.md を参照

## Goals / Non-Goals

**Goals:**

- サイドバーの中身は 1 か所だけに描画し、幅による違いは CSS で出し分ける（DB の読み込みや ID を重複させない）
- 開閉の状態を持つ部分だけをクライアント部品にし、記録中のタスクの読み込みはサーバーで行う

**Non-Goals:**

- サイドバーからの停止、経過時間の表示、デスクトップ幅での折りたたみ（proposal のスコープ外を参照）

## Decisions

### 1. 部品の分け方

- `SidebarShell`（`components/layout/SidebarShell.tsx`、クライアント）: 開閉の状態を持つ枠。幅 768px 未満で上部の行（メニューボタンとアプリ名）、背景、閉じるボタンを出す。サイドバーの中身は `children` で受け取る
- `SidebarNav`（`components/layout/SidebarNav.tsx`、クライアント）: アプリ名のリンクとページのリンク。`usePathname()` で今いるページのリンクに `aria-current="page"` を付け、見た目も変える
- `RunningTask`（`components/layout/RunningTask.tsx`、async Server Component）: `connection()` の後に `getRunningEntry` で読み、表示は `RunningTaskView`（`RunningTaskView.tsx`）に渡す。`RunningTask` は DB を読むサーバー専用のモジュールを使うためテストから読み込めないので、表示を分けてテストする（`EntryHistory` / `HistoryContent` と同じ分け方）
- `Sidebar`（`components/layout/Sidebar.tsx`、Server Component）: `SidebarShell` の中に `SidebarNav` と `<Suspense>` で囲んだ `RunningTask` を並べる。`app/layout.tsx` は `Header` の代わりに `Sidebar` を置く
- 理由: Server Component を `children` としてクライアント部品に渡すと、開閉の状態はクライアントで持ちながら、記録中のタスクはサーバーで読める（Next.js のドキュメント「Interleaving Server and Client Components」）

### 2. レイアウトと幅による出し分け

- `<body>` を幅 768px（Tailwind の `md`）以上で横並び（`md:flex-row`）にする。サイドバーは幅 `w-60`、`md:sticky md:top-0 md:h-dvh` で本文をスクロールしても左に残す。境目は `border-r border-border`
- 幅 768px 未満では、サイドバーを `fixed` で画面の左に重ね、閉じているときは `-translate-x-full` と `invisible` で隠す。`invisible`（`visibility: hidden`）にすると、読み上げとキーボードのフォーカスの対象から外れる。幅 768px 以上では常に表示（`md:visible md:translate-x-0`）
- 各ページの `<main>` に `min-w-0` を足し、横並びのときに本文が横にはみ出さないようにする。中央寄せ（`mx-auto max-w-3xl`）はサイドバーを除いた幅の中で行う
- 代替案: 幅ごとに別々の要素（デスクトップ用のサイドバーと、スマートフォン用の `<dialog>`）を出す → 中身が 2 つ描画され、記録中のタスクを 2 回読むことになるので不採用

### 3. 開閉の操作

- メニューボタンと閉じるボタンは `IconButton`（lucide-react の `Menu` / `X`）。メニューボタンには `aria-expanded` と `aria-controls`（サイドバーの id）を付ける
- 開いたら閉じるボタンにフォーカスを移し、閉じたらメニューボタンにフォーカスを戻す
- 閉じる操作: 閉じるボタン、背景（サイドバーの外側）の選択、Escape キー、サイドバー内のリンクの選択。リンクの選択は、`SidebarShell` がサイドバーの要素で `click` を受け、押された要素が `<a>` の中なら閉じる（Server Component の中身にコールバックを渡さずに済む）
- 背景は読み上げの対象にしない（`aria-hidden`）。キーボードでは Escape と閉じるボタンで閉じられる

### 4. 記録中のタスクの表示

- 見出し「記録中のタスク」（既存の文言）の下に、タスク名（空なら「（タスク名なし）」）と「開始時刻 09:00」を表示する。記録中のタスクがなければ「記録中のタスクはありません。」を表示する
- 読み込み中の `<Suspense>` の fallback は、既存の「読み込み中」の文言を使う
- 終了・再開などの後は、各 Server Function の `refresh()` でレイアウトごと読み直されるので、追加の仕組みは要らない

### 5. 文言

- `lib/messages.ts` の `nav` に「ホーム」「メニュー」「閉じる」、サイドバーの「記録中のタスクはありません。」を足す。「過去の記録」は `messages.history.title` を使う
- トップページへのリンクの名前は「ホーム」とする。トップページの見出しはアプリ名「TimeLog」で、ページの名前として使える語がないため

## Risks / Trade-offs

- [開いたサイドバーの中にフォーカスを閉じ込めていないので、Tab キーで背後の本文に移れる] → Escape と閉じるボタンで閉じられ、背景を選んでも閉じる。必要になれば、開いている間は本文に `inert` を付けることを別の change で検討する
- [`usePathname()` を使う部品がレイアウトにある] → クライアント部品の中で使うだけで、静的な部分の出力は変わらない。`npm run build` でエラーが出ないことを確かめる
- [サイドバーの分、幅 768〜1000px 前後では本文が狭くなる] → 本文の最大幅（`max-w-3xl`）は変えず、「過去の記録」の操作は折り返しで対応できる
