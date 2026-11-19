# Design

## Context

- `components/time-entries/EntryItem.tsx` は、記録の 1 行を表示する。修正ボタンを押すと `EditForm` に切り替わり、保存ボタンで `updateEntryAction(id, prev, formData)` を呼ぶ。削除ボタンは `window.confirm` で確認してから `deleteEntryAction` を呼ぶ。終了した記録には再開ボタン（`<form action={resumeAction}>`）がある
- `EntryList` は開始日ごとに `EntryItem` を並べる。トップページ（`TimeTracker`）と「過去の記録」（`HistoryContent`）の両方で使う
- `updateEntryAction` は、タスク名・開始時刻・終了時刻（記録中なら無視）と `projectId` をまとめて受け取り、入力チェックしてから保存して `refresh()` する。入力エラーは `errors.taskName` / `startedAt` / `endedAt` / `projectId` / `form` で返る。サーバー側は今回変えない
- 時刻の入力欄は `datetime-local`（`step=1`）で、値は `toDateTimeLocalValue`（日本時間）で作る
- 各ページの `<main>` は `max-w-3xl`（768px）。トップページは h1 にアプリ名、その下に説明を置いている
- `components/ui/` には `IconButton` と `IconLink` があり、メニューやプルダウンの部品はまだない。依存パッケージにも UI ライブラリはない
- React 19 の `<form action>` は送信後にフォームをリセットするため、値を残したいフォームは `onSubmit` で受けている

## Goals / Non-Goals

**Goals:**
- 一覧の行の上で、ボタンを押さずに記録を直せる。キーボードだけでも直せる
- 入力エラーのときに、入力した値を失わない
- 「その他の操作」のメニューに、あとから項目を足しやすい
- 一覧でプロジェクト名が読め、プロジェクトの選択肢でも色が分かる

**Non-Goals:**
- サーバー側の処理や入力チェックの変更
- 保存中の表示や、保存に失敗したときの自動の再試行
- 「プロジェクト」ページの編集方法の変更

## Decisions

### 1. ページの見出しと幅

- `app/page.tsx` の表示する h1 と説明を消す。ページの構造を読み上げで分かるようにするため、h1 は `sr-only` で「ホーム」（`messages.nav.home`）として残す。`messages.app.description` は `<meta name="description">` で使い続ける
- トップページと「過去の記録」の `<main>` を `max-w-5xl`（1024px）にする。「プロジェクト」ページは `max-w-3xl` のまま

### 2. 行の並び

- 幅 768px 以上（`md`）: 1 行に、プロジェクトのボタン（固定幅 `w-40` 程度、名前が長ければ省略して `title` で全体）・タスク名（残りの幅）・開始時刻・「–」・終了時刻・作業時間・再開ボタン・「その他の操作」ボタンを並べる。記録中の記録は終了時刻の入力欄の代わりに同じ幅の空きを置き、列をそろえる
- 768px 未満: 1 段目にプロジェクトとタスク名、2 段目に開始時刻と終了時刻、3 段目に作業時間とボタンを置く。幅 375px で横スクロールが出ないことをブラウザで確かめる
- サイドバーがある 768〜1024px の間は本文が狭いので、1 行に並べるのは本文が十分広いとき（`lg`）からにし、それより狭ければ 2 段にする。具体的な区切りは実装時にブラウザで確かめ、横スクロールが出ないことを優先する
- 入力欄は、ふだんは枠線を目立たせず（`border-transparent`）、ポインタを合わせたときとフォーカスしたときに枠線を出して、一覧として読みやすくする。色はトークン（`border-border` など）だけを使う
- 各入力欄には読み上げ用のラベル（`sr-only` の「タスク名」「開始時刻」「終了時刻」）を付ける。行ごとに `useId` で id を作る

### 3. 直接編集と保存のタイミング

- `EntryItem` の中に、行の入力値（`taskName` / `projectId` / `startedAt` / `endedAt`）を state で持つ。保存は「今の入力値をすべて」`FormData` にして `updateEntryAction` を呼ぶ（サーバーはまとめて受け取るため）
- タスク名・開始時刻・終了時刻: `onBlur` で、入力値が保存済みの値（props の `entry` から作った値）と違うときだけ保存する。Enter キーは `blur()` して同じ流れで保存する。Escape キーはその欄を保存済みの値に戻してから `blur()` する（戻した値は保存済みと同じなので保存しない）
- プロジェクト: プルダウンで選んだときに、その値に変えて保存する
- 保存は `useTransition` の中で行い、結果のエラーを state に持つ。エラーのときは入力値を残し、行の下に理由（`role="alert"`）を出し、該当する入力欄に `aria-invalid` と `aria-describedby` を付ける。次に保存が成功したらエラーを消す
- 保存が成功すると `refresh()` で props の `entry` が新しくなる。行を作り直すとフォーカスが失われる（Tab で次の欄に移った直後など）ので、`key` は記録の id のままにする。props が変わったら、その時点で保存済みの値と同じだった欄（編集中でない欄）だけを新しい値に合わせる（前回の props を state に持ち、描画中に比べて更新する React の推奨の書き方）。編集中の欄の値は上書きしない
- フォーカスを Tab で次の欄に移すと、前の欄の保存と次の欄の編集が重なる。保存はすべての欄の今の値を送るので、順番に処理されれば最後の保存が最新の値になる
- 代替案: 欄ごとに別の Server Function を作る → サーバー側の変更が増え、入力チェック（終了は開始より後）も欄をまたぐので不採用

### 4. メニュー（`components/ui/DropdownMenu.tsx`）

- `DropdownMenu` は、`IconButton` と同じ見た目のアイコンのボタン（`aria-haspopup="menu"`・`aria-expanded`・`aria-controls`・`aria-label`・`title`）と、`role="menu"` の一覧を描く。項目は `items: { label, icon, onSelect, variant? }[]` で受け取り、`role="menuitem"` のボタンとして、アイコンと文字を並べて描く（`variant: "danger"` は危険の色）
- 開閉: ボタンで開閉し、項目を選んだとき・外側を押したとき（`pointerdown` を document で見る）・Escape キーで閉じる。開いたら最初の項目にフォーカスし、上下の矢印キー・Home・End で項目を移る。Escape で閉じたらボタンにフォーカスを戻す。Tab キーではメニューを閉じて次へ進む
- 位置: ボタンを `relative` の枠に入れ、メニューは `absolute` でボタンの右下にそろえて出す（`right-0`）。一覧の下の方でも見えるよう、`z-10` と背景色・枠線・影はトークンで付ける
- 記録の「その他の操作」は `MoreVertical`（lucide）のアイコンで、項目は今は「削除」（`Trash2`、danger）だけ。「削除」を選ぶと今と同じく `window.confirm` で確認してから `deleteEntryAction` を呼ぶ
- 代替案: Popover API や UI ライブラリ（Radix など）→ 依存を増やさず、使う場所も 2 つだけなので自前で作る

### 5. プロジェクトのプルダウン（`components/projects/ProjectPicker.tsx`）

- ボタン（`aria-haspopup="listbox"`・`aria-expanded`）に、今のプロジェクトの `ProjectIcon`（`decorative`）と名前を出す。プロジェクトなしなら控えめな色で「プロジェクトなし」。ボタンの読み上げ名は「プロジェクト: 社内ツール」の形（`messages` に組み立て用の関数を置く）
- 選ぶと `role="listbox"` の一覧を開き、`role="option"` の項目に「プロジェクトなし」と登録順のプロジェクトを、それぞれの色のアイコンと名前で並べる。今のプロジェクトに `aria-selected="true"` と選択中の印（`Check` アイコン）を付ける
- キーボード: 開いたら今の項目にフォーカスし、上下の矢印キー・Home・End で移り、Enter / Space で選び、Escape で選ばずに閉じてボタンにフォーカスを戻す。外側を押したときも閉じる
- 開閉・外側を押したときに閉じる・フォーカスを戻す処理は `DropdownMenu` と同じなので、`components/ui/usePopover.ts`（開閉の state、外側の `pointerdown`、Escape、ボタンへのフォーカスの戻し）にまとめて両方で使う
- 開始フォーム（`StartStopForm`）の選択は、今の `ProjectSelect`（標準の `<select>`）のままにする（スコープ外）

### 6. 文言

- `lib/messages.ts` の `timeEntries.actions` に「その他の操作」（`more`）を足し、使わなくなる `edit`・`save`・`cancel` は消す（プロジェクト側の同名の文言は別にあるので影響しない）。プロジェクトのボタンの読み上げ名を作る関数（「プロジェクト: 〜」）を足す

## Risks / Trade-offs

- [フォーカスが外れただけで保存されるため、意図しない変更も保存される] → 値が変わったときだけ保存し、入力中は Escape で戻せる。元に戻す機能はスコープ外
- [`datetime-local` の入力中に、日付と時刻の区切りを移ってもフォーカスは外れないが、ブラウザのカレンダーを開くとフォーカスが外れる場合がある] → 値が変わったときだけ保存し、入力チェックで不正な値は保存しないので、途中の値で壊れることはない。ブラウザで確かめる
- [保存中に別の欄を編集して、保存の結果で値が上書きされる] → 編集中の欄（保存済みの値と違う欄）は props の更新で上書きしない
- [自前のメニューとプルダウンのキーボード操作の抜け] → WAI-ARIA の menu button / listbox のパターンに沿い、キーボード操作をテストで確かめる
- [幅 768〜1024px で行が窮屈になる] → 2 段にする区切りをブラウザで確かめて決める
