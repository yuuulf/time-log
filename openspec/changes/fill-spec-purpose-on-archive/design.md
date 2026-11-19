# Design

## Context

`scripts/openspec-archive.mjs` は PR の差分から change を見つけ、未完了タスクを確かめてから `npx openspec archive <name> --yes` を順に実行し、1 コミットにして push する。外部コマンドは `exec` を差し替えてテストしている。OpenSpec は新しい capability の spec の目的に `TBD - created by archiving change <name>. Update Purpose after archive.` を入れ、`openspec validate --strict` はこれを失敗にする。delta spec に `## Purpose` があれば、新しい capability を作るときに限りそれが使われる。

## Goals / Non-Goals

**Goals:**
- 新しい capability を作る change のアーカイブ後も CI が通る
- 目的の出どころを proposal の New Capabilities（すでに必ず書いている箇所）にする

**Non-Goals:**
- 既存 spec の目的の更新、目的の文の生成

## Decisions

### 1. proposal の読み取り

- `parseNewCapabilities(proposal)` が `### New Capabilities` から次の `#` 見出しまでの間にある `` - `<name>`: <説明> `` の行を読み、capability 名 → 説明の Map を返す。HTML コメントと「（なし）」などの行は無視する。説明の前後の空白は除き、空の説明は無いものとする
- アーカイブすると change が `archive/` に移るので、proposal はアーカイブの前に読む（`openspec/changes/<name>/proposal.md`）。複数の change に同じ capability があれば、名前順で後の change の説明を使う（同じ PR で同じ capability を 2 回新規に作ることは想定しない）

### 2. 仮の目的の置き換え

- すべての change をアーカイブした後、`openspec/specs/*/spec.md` のうち仮の文（末尾が `. Update Purpose after archive.` で始まりが `TBD - created by archiving change ` の行）を含むものを探し、その行を説明に置き換える。capability 名は spec のパス（`openspec/specs/<name>/spec.md`）から求める
- 仮の文を探すのは、OpenSpec が delta spec の目的を使った場合や既存の capability の場合に何もしないため。OpenSpec が入れる文に合わせて判定し、文が変わったら置き換えは起きず CI の検証で気づける
- 説明のない capability が 1 つでもあれば、作業ツリーを戻して（アーカイブの失敗と同じく `git reset --hard` と `git clean`）コメントし、`failed` を返す
- 置き換えた後、コミットの前に `npx openspec validate --all --strict` を実行する。CI と同じ検証で、`--strict` は目的が 50 文字未満でも失敗にする（add-projects の「プロジェクトの一覧・登録・編集・削除」は 18 文字で失敗した）。失敗したら作業ツリーを戻し、検証の出力を PR にコメントして `failed` を返す。アーカイブの後で CI が落ちる状態を、コミットする前に止める
- ファイルの読み書きは `run` の引数（`readFile`・`writeFile`・`listSpecFiles`）で差し替えられるようにし、テストではメモリ上のファイルを使う

### 3. 書き方のルール

- `openspec/config.yaml` の `rules.proposal` に「New Capabilities の説明はアーカイブで spec の目的（Purpose）になるので、その capability が何のためのものかが分かる 50 文字以上の文で書く」を足す

## Risks / Trade-offs

- [proposal の説明が短いとアーカイブできない] → ルールで 50 文字以上の目的として書くよう求め、短いときはコメントで検証の結果を知らせる。proposal を直してラベルを付け直せばよい
- [OpenSpec の仮の文の形が変わる] → 置き換えが起きないだけで、CI の検証が失敗して気づける
