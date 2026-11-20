# Proposal

## Why

入力欄にフォーカスしたときの枠の色が、アプリのテーマ色（primary）になっていない。記録一覧の入力欄だけは primary の枠になるが、記録の開始フォーム・期間の指定・プロジェクトのフォームの入力欄では、ブラウザ既定の青い枠（フォーカスリング）が出る。画面ごとに見た目がそろわず、テーマ色とも合わない。

## What Changes

- すべての入力欄（テキスト・日付・複数行）で、フォーカスしたときの枠を primary 色にする。ブラウザ既定のフォーカスリングは出さない
- 入力エラーのある欄は、フォーカス中も枠をエラーの色（danger）のままにする
- 入力欄と同じ見た目のプロジェクトのプルダウン（フォーム用・一覧用の表示）も、キーボードでフォーカスしたときに枠を primary 色にする（一覧用は今は灰色の枠）
- 対象の入力欄:
  - 記録の開始フォームのタスク名（`StartStopForm`）
  - 期間を指定した記録の表示の開始日・終了日（`PeriodControls`）
  - プロジェクトの登録・編集の名前・クライアント名・説明（`ProjectFields`）
  - プロジェクトのプルダウン（`ProjectPicker` の `field`・`inline`）
  - 記録一覧の入力欄（`EntryItem`）は primary の枠になっているが、共通のスタイルにそろえる

### スコープ外（やらないこと）

- ボタン・リンク・メニュー項目・色の選択（`ProjectColorPicker`）のフォーカスの表示は変えない
- テーマ色（`--primary`）の値そのものは変えない
- 入力欄の大きさ・余白・枠の太さなど、フォーカス以外の見た目は変えない

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `app-shell`: 入力欄にフォーカスしたときの枠の色を、アプリ全体で primary 色にそろえる要件を追加する

## Impact

- 変更するコード: `components/time-entries/StartStopForm.tsx`、`components/time-entries/PeriodControls.tsx`、`components/time-entries/EntryItem.tsx`、`components/projects/ProjectFields.tsx`、`components/projects/ProjectPicker.tsx`
- 入力欄のフォーカスのスタイルを共通化する部品を `components/ui/` に追加する
- 依存パッケージの追加はない
- README.md の更新: 不要（画面の見た目の修正で、使い方や設定は変わらない）
