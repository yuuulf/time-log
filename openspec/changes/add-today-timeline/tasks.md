# Tasks

## 1. 記録の追加と位置の計算

- [x] 1.1 `lib/time-entries/validation.ts` に `validateCreateInput`（`validateUpdateInput` の終了した記録と同じ確かめ方）を、`repository.ts` に `createEntry(db, { taskName, projectId, startedAt, endedAt }, now)`（日をまたぐときは `splitByJstDay` で日ごとに足し、開始日の記録を返す。記録中の記録には触れない）を作る（design「終了済みの記録の追加は `createEntry`・`createEntryAction` を新しく作る」）。`validation.test.ts` で誤り（長いタスク名・終了が開始より前・未来・空）を、`repository.test.ts` で、同じ日の記録が 1 件足されること、日をまたぐと日ごとに分かれること、記録中の記録が変わらないことをテストする（コミット: 終了済みの記録を追加する処理を追加）
- [x] 1.2 `lib/time-entries/actions.ts` に `createEntryAction(prev, formData)` を作る。入力を確かめ、プロジェクトを読み（削除されていれば誤り）、`createEntry` で保存して `refresh()` する（design 同上）。`actions.test.ts` で、保存できること、プロジェクトを紐づけられること、入力の誤りと削除されたプロジェクトでは保存しないことをテストする（コミット: 記録を追加する Server Action を追加）
- [x] 1.3 `lib/time-entries/timeline.ts` に `minuteOfDay`・`layoutTimeline`・`rangeFromClick`・`rangeBeforeNow` を作る（design「帯の位置と重なり、初期の時刻は `lib/time-entries/timeline.ts` の純粋な関数で求める」）。`timeline.test.ts` で、帯の分（記録中は開始から 30 分ぶん、翌日に終わる記録は 24 時で切る）、重なる記録の段、spec「追加の入力欄の初期の時刻」のシナリオ（15 分の切り捨て、次の記録の手前、前の記録の終わりから、今の時刻の手前、今より後は `null`、「記録の追加」ボタンの 30 分）をテストする（コミット: タイムラインの位置を計算する関数を追加）

## 2. タイムラインの画面

- [x] 2.1 `EntryList` から日付の見出しと合計時間の行を `DayHeading` として切り出し、`EntryTimeline`（見出し・`DayHeading`・0 時〜24 時の目盛り・プロジェクトの色の帯・今の時刻の線・開いたときのスクロール）を作る（design「タイムラインは 1 時間 48px の縦の格子を…」）。文言は `lib/messages.ts` に置く。`EntryTimeline.test.tsx` で spec「タイムラインの表示」のシナリオ（帯のタスク名と時刻・記録中は決まった高さ・重なる記録が横に並ぶ・合計時間・記録がないときも目盛りを出す）と帯の読み上げ名をテストし、`EntryList.test.tsx` が通ることを確かめる（コミット: 今日の記録のタイムラインを追加）
- [x] 2.2 `TodayEntries`（表示の状態を持ち、一覧かタイムラインを描く）と `TodayViewToggle`（「一覧」「カレンダー」の `IconButton`、`aria-pressed`、選んだら Cookie `timelog-today-view` に書く）を作り、`TimeTracker` で `cookies()` を読んで最初の表示を渡す（design「表示の設定は Cookie に保存し…」「『今日の記録』をクライアント部品 `TodayEntries` にまとめ…」）。`TodayEntries.test.tsx` で spec「今日の記録の表示の切り替え」のシナリオ（ボタンの名前・切り替え・押された状態・Cookie に書く・最初の値）を、`app/page.test.tsx` などで Cookie の値に応じた最初の表示（ないときと知らない値は一覧）をテストする（コミット: 今日の記録の表示を切り替えるボタンを追加）
- [x] 2.3 `TimelineEntryEditor`（タスク名と候補・プロジェクト・開始・終了の時刻、「追加」「閉じる」）を作り、`EntryTimeline` で背景のクリックと「記録の追加」ボタンから開いて `createEntryAction` で保存する。開閉とフォーカス（タスク名にフォーカス、Escape・「閉じる」で元の場所に戻す、外側で閉じる、同時に 1 つ）を入れる（design「空いている場所の選択はポインタで扱い…」「入力欄は 1 つの `TimelineEntryEditor` を…」）。`TimelineEntryEditor.test.tsx`・`EntryTimeline.test.tsx` で、spec「タイムラインからの記録の追加」「追加の入力欄の初期の時刻」「タイムラインの入力欄の開閉」のシナリオ（`getBoundingClientRect` をスタブにしたクリック位置からの初期値、今より後では開かない、送る値、誤りの表示と値が残ること、閉じ方とフォーカス）をテストする（コミット: タイムラインから記録を追加できるようにする）
- [x] 2.4 `EntryTimeline` で帯を選んだら `TimelineEntryEditor` を修正として開き（今の値・記録中は終了時刻なし・アーカイブしたプロジェクトの名前）、「保存」で `updateEntryAction`、「削除」で確認してから `deleteEntryAction` を呼ぶ（design 同上）。テストで spec「タイムラインでの記録の修正と削除」のシナリオ（初期値・記録中・削除・削除の取り消し・「閉じる」で帯にフォーカスが戻る）を確かめる（コミット: タイムラインで記録を修正・削除できるようにする）
- [x] 2.5 README.md の「使い方」の「今日の記録」の説明に、一覧とタイムラインの切り替え（覚えておくこと）と、タイムラインの空いている場所・「記録の追加」からの追加、帯からの修正・削除を追記する（コミット: README にタイムラインを追記）

## 2b. 確認での指摘の反映

- [x] 2.6 `components/ui/IconButtonGroup.tsx`（つながった 1 組のアイコンボタン、`aria-pressed`）を作って `IconButtonGroup.test.tsx` でテストし、`TodayViewToggle` をそれに置き換える。帯の中身をタスク名と時刻の 1 行にする（design「『今日の記録』をクライアント部品…」「タイムラインは 1 時間 48px…」）。`TodayEntries.test.tsx`・`EntryTimeline.test.tsx` を合わせる（コミット: 表示の切り替えをボタングループにし、帯を 1 行にする）
- [x] 2.7 入力欄の右上に「閉じる」（✕）と、修正のときだけ「その他の操作」（⋮）のメニューの「削除」を置き、追加の「追加」を文字のボタンにする。修正は保存のボタンをなくし、フォーカスが外れたとき・Enter・プロジェクトの選択で保存し、Escape は保存せずに閉じ、「閉じる」・外側では保存してから閉じる。`EntryItem` の `toValues`・`sameValue` を共通にする（design「入力欄は 1 つの `TimelineEntryEditor` を…」）。`EntryTimeline.test.tsx` で spec「タイムラインでの記録の修正と削除」「タイムラインの入力欄の開閉」のシナリオをテストする（コミット: タイムラインの入力欄を一覧と同じ操作にする）
- [x] 2.8 README の「使い方」のタイムラインの説明を、指摘を反映した操作に合わせる（コミット: README のタイムラインの説明を直す）

- [x] 2.9 「記録の追加」ボタン（＋）と `rangeBeforeNow` をなくす。入力欄の中のポインタを `cursor-auto` に戻す。`controlVariants` に `ghost` を足し、`DropdownMenu` に `variant` を渡せるようにして、入力欄の「閉じる」「その他の操作」を枠のない見た目にする（design「空いている場所の選択はポインタで扱う」「入力欄は 1 つの `TimelineEntryEditor` を…」）。`IconButton.test.tsx`・`DropdownMenu.test.tsx`・`EntryTimeline.test.tsx`・`timeline.test.ts` を合わせ、README から「記録の追加」ボタンの説明を消す（コミット: タイムラインの追加ボタンをなくし、入力欄の見た目を直す）

- [x] 2.10 `layoutTimeline` の重なりの判断を、描く高さ（最小 `MIN_BLOCK_MINUTES` 分）で行い、短い記録が上下に重なって見えるときも別の段に置く。`EntryTimeline` の最小の高さを `MIN_BLOCK_MINUTES` から求める（design「帯の位置と重なり…」）。`timeline.test.ts`・`EntryTimeline.test.tsx` で spec「タイムラインの表示」の「短い記録が続くとき」をテストする（コミット: 短い記録の帯が重ならないようにする）

- [x] 2.11 タイムラインの今の時刻の線より下に、追加用のポインタを出さない透明な領域を置く（design「空いている場所の選択はポインタで扱う」）。`EntryTimeline.test.tsx` で spec「今より後の場所のポインタ」をテストする（コミット: 今より後の場所で追加用のポインタを出さない）

- [x] 2.12 帯を領域の幅いっぱいにせず、右端に追加のために選べる幅（2rem）を残す（design「タイムラインは 1 時間 48px…」）。`EntryTimeline.test.tsx` で帯の幅と、spec「記録のある時間に追加する」をテストする（コミット: 帯の右に追加できる幅を残す）

## 3. 確認

- [x] 3.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [x] 3.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: 表示の切り替えと開き直したときの表示、帯の位置・色・重なり・今の時刻の線とスクロール、空いている場所と「記録の追加」からの追加（初期の時刻・誤り・閉じ方）、帯からの修正・削除、追加・修正のあと一覧と合計時間に反映されること、ライト・ダークの両方の見た目
- [ ] 3.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`add-today-timeline`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
