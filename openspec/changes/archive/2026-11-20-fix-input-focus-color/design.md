# Design

## Context

- 入力欄の見た目は各コンポーネントの `className` に Tailwind のクラスで直接書いている。フォーカスの指定があるのは記録一覧の入力欄（`EntryItem`: `focus:border-primary focus:outline-none`）だけで、`StartStopForm`・`PeriodControls`・`ProjectFields` には指定がなく、ブラウザ既定の outline（Chrome・Safari では青）が出る
- `ProjectPicker` はボタン（`<button>`）で作ったプルダウン。`inline` は `focus-visible:border-border`、`field` は指定なし
- ボタンの色の種類は `components/ui/IconButton.tsx` の `controlVariants` のように、クラス文字列を `components/ui/` から export して使い回している
- 色は `app/globals.css` の `@theme` のトークン（`primary`・`danger`）を使う。ダークモードでは `--primary` が teal-500 に切り替わるので、トークンを使えばモードごとの色は自動でそろう

## Goals / Non-Goals

**Goals:**

- 入力欄のフォーカスの見た目を 1 か所で定義し、すべての入力欄で使い回す
- 入力エラーの枠（danger）をフォーカスより優先する

**Non-Goals:**

- 入力欄そのものを共通コンポーネント（`<TextInput>` など）にまとめること。各欄の大きさ・余白・枠の有無がそれぞれ違い、今回の目的に対して変更が大きい

## Decisions

### フォーカスのクラスを `components/ui/fieldStyles.ts` の定数にする

- `fieldFocusClassName = "focus:border-primary focus:outline-none"` を export し、各入力欄の `className` に足す。ボタンでできたプルダウン（`ProjectPicker`）はクリックでもフォーカスするので、マウス操作で枠が残らないよう `focus-visible:` 版（`fieldFocusVisibleClassName = "focus-visible:border-primary focus-visible:outline-none"`）を別に用意する
- 枠の色を変える方式は、既存の `EntryItem` と同じ。枠の太さは変えないので、フォーカスでレイアウトがずれない
- 代替案: `globals.css` の `@layer base` で `input:focus, textarea:focus` に一括指定する。新しい入力欄にも自動で効く利点はあるが、`EntryItem` の透明な枠や `ProjectPicker`（`<button>`）のように要素ごとに事情が違い、どこに効いているかがコンポーネントから読み取れない。プロジェクトの「同じ役割の UI は `components/ui/` を使い回す」方針に合わせて定数にする
- 代替案: 入力欄の共通コンポーネント化。Non-Goals のとおり今回は見送る

### エラーの枠をフォーカスより優先する

- 既存の `aria-[invalid=true]:border-danger` をそのまま残し、生成される CSS で `aria-[invalid=true]` がフォーカスの指定より後に出ることを確認する（Tailwind v4 では `aria-*` の variant は `focus` より後に並ぶ）。優先されない場合は `focus:not-aria-[invalid=true]:border-primary` に切り替える
- `StartStopForm` のタスク名・`PeriodControls` の日付は今エラーの枠の指定がないが、今回はフォーカスの色だけを扱い、エラーの枠は追加しない

### ボタン・リンクのフォーカスリングは `globals.css` の base レイヤーで一括指定する

- `@layer base` に `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` を書く。ボタン・リンクは `IconButton`・`IconLink`・`TextButton`・`TextLink`・サイドバーのリンク・記録中のタスクの枠など種類が多く、どれもフォーカスの指定がない（ブラウザ既定の青い outline）ので、要素ごとにクラスを足すより一括指定のほうが漏れがない
- outline の色だけを変える（`outline-color` のみ）案は、ブラウザ既定の `outline-style: auto` では Safari が色を無視するため採らない。太さ・オフセットを明示して見た目をブラウザ間でそろえる
- base レイヤーなので、部品のクラス（utilities レイヤー）が優先される。入力欄の `focus:outline-none`、メニュー項目の `focus:outline-none`、色の選択の `peer-focus-visible:outline-foreground` はそのまま効く
- `:focus-visible` を使うので、クリックでは出ず、キーボード操作のときだけ出る（ブラウザ既定と同じ）
- 入力欄の方針（クラスの定数）と分けるのは、入力欄が「枠線（border）の色を変える」見た目で、要素ごとに枠の有無が違うため

### テストはクラスの付与で確認する

- ボタン・リンクのフォーカスリングは `app/globals.css` の規則なので、`app/globals.test.ts` で CSS ファイルに `:focus-visible` の outline を `var(--primary)` にする規則が base レイヤーにあることを確認する
- jsdom は CSS を計算しないので、フォーカス時の色そのものは自動テストで確かめられない。各入力欄に `fieldFocusClassName` のクラス（`focus:border-primary`）が付いていることを Testing Library で確認し、実際の色はブラウザで目視確認する

## Risks / Trade-offs

- [新しく作る入力欄で定数を付け忘れる] → 定数のコメントに用途を書き、テストで既存の入力欄を押さえる。将来入力欄を共通コンポーネント化するときに吸収する
- [outline を消すとキーボード操作でフォーカス位置が見えにくくなる] → 枠を primary 色に変えるので位置は分かる。primary（teal-700 / teal-500）は通常の枠（`border`）と明度差が大きく、背景とのコントラストも確保されている
