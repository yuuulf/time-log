# Design

## Context

`scripts/openspec-archive.mjs` の `run` は、アーカイブと目的の書き込みの後に `npx openspec validate --all --strict` を実行し、失敗したら作業ツリーを戻して、決まった文（目的を 50 文字以上で書く案内）と出力の末尾（`formatOutput`、最大 3000 文字）をコメントする。OpenSpec の出力は英語で、目的の誤りは `Purpose section ...`、要件の長さは `Requirement text is very long` を含む。

## Goals / Non-Goals

**Goals:**
- 検証の失敗の原因に合った直し方が、コメントを読めば分かる

**Non-Goals:**
- 出力の翻訳、検証ルールの変更、すべての種類の誤りへの個別の案内

## Decisions

### 1. 案内の選び方

- `validationHints(output)` が検証の出力（stdout と stderr）から、当てはまる案内の一覧を返す。案内は `{ pattern, message }` の表で持ち、`pattern`（正規表現）が出力に含まれる案内をすべて返す
  - 目的: `/Purpose section/` → proposal の「### New Capabilities」の説明を 50 文字以上で書く（新しい spec の目的はそこから書き込む）
  - 要件の長さ: `/Requirement text is very long/` → 例や細かい場合はシナリオに移すか、要件を 1 つの振る舞いごとに分ける
- 当てはまる案内がなければ、「下の検証の結果を見て spec を直す」という案内を 1 つ返す
- コメントは「アーカイブ後の spec が OpenSpec の検証に通らないため、どの change もアーカイブしませんでした。」、案内の箇条書き、「直したら `archive` ラベルを付け直してください。」、検証の結果の順にする
- 理由: 表にしておくと、よく出る誤りの案内をあとから足しやすい。出力の文言が変わって当てはまらなくなっても、一般の案内と出力は残る

## Risks / Trade-offs

- [OpenSpec の出力の文言が変わると、個別の案内が出なくなる] → 一般の案内と検証の結果は必ず載るので、直し方が分からなくなることはない
