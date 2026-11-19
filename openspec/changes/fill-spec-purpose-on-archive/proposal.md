# Proposal

## Why

`archive` ラベルで新しい capability の spec ができると、OpenSpec はその spec の目的（`## Purpose`）に仮の文（「TBD - created by archiving change …」）を入れる。CI の OpenSpec の検証（`--strict`）はこれを失敗として扱うため、新しい capability を作る change をアーカイブするたびに CI が落ち、目的を手で書き足す必要があった（add-projects の PR #7 で発生）。

## What Changes

- アーカイブのスクリプト（`scripts/openspec-archive.mjs`）が、アーカイブ前に各 change の proposal の「New Capabilities」から capability ごとの説明を読み、アーカイブでできた spec の仮の目的をその説明に置き換えてからコミットする
- 仮の目的が残る capability の説明が proposal にない場合は、どの change もアーカイブせず、PR ブランチを変更せずに、capability 名と書き方を PR にコメントする
- delta spec に `## Purpose` を書いた場合は OpenSpec がそれを使い、仮の文は入らないので、置き換えは行わない
- `openspec/config.yaml` の proposal のルールに、New Capabilities の説明がアーカイブで spec の目的になることを書き、目的として読める文で書くよう求める

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `development-workflow`: archive ラベルによるアーカイブで、新しい spec の目的を proposal から書き込む要件を追加する

## スコープ外

- すでにある spec の目的の書き換え
- OpenSpec CLI 自体の変更
- 目的の文の自動生成・要約（proposal の説明をそのまま使う）

## README.md の更新

必要。「仕様と計画（OpenSpec）」の節に、新しい capability の spec の目的は proposal の New Capabilities の説明から書き込まれることと、説明がないとアーカイブしないことを追記する。

## Impact

- 変更: `scripts/openspec-archive.mjs`、`scripts/openspec-archive.test.ts`、`openspec/config.yaml`、README.md
- ワークフロー（`.github/workflows/openspec-archive.yml`）は変更しない
- 新しい依存パッケージ: なし
