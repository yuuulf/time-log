# Proposal

## Why

アーカイブのスクリプトは、アーカイブ後の OpenSpec の検証に失敗すると、原因に関係なく「新しい spec の目的（Purpose）を 50 文字以上で書いて」と PR にコメントする。PR #9 では、原因が要件の本文の長さ（500 文字超）だったのに目的の案内が出て、何を直せばよいか分かりにくかった。

## What Changes

- アーカイブ後の検証に失敗したときの PR コメントを、検証の結果に合わせた案内にする
  - 目的（Purpose）の誤りのときだけ、proposal の「New Capabilities」の説明を 50 文字以上で書くよう案内する
  - 要件の本文が長すぎるときは、シナリオに移すか要件を分けるよう案内する
  - それ以外は、検証の結果を見て spec を直すよう案内する
  - どの場合も、検証の結果そのもの（コマンドの出力）は今と同じく載せる
- development-workflow の spec の「新しい spec の目的の書き込み」の例（「プロジェクトの一覧・登録・編集・削除」）は 50 文字未満で、今の検証では通らないため、50 文字以上の例に直す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `development-workflow`: 「新しい spec の目的の書き込み」の例を直し、アーカイブ後の検証に失敗したときの案内の要件を追加する

## スコープ外

- 検証のルール（OpenSpec の `--strict`）そのものの変更
- 検証の出力の日本語への翻訳（出力はそのまま載せ、案内だけを日本語で付ける）
- 案内のない種類の誤りへの個別の案内の追加（今回は目的と要件の長さだけ）

## README.md の更新

必要。「仕様と計画（OpenSpec）」の節の、アーカイブ後の検証の説明に、検証の結果に合わせた案内をコメントすることを書き足す。

## Impact

- 変更: `scripts/openspec-archive.mjs`、`scripts/openspec-archive.test.ts`、README.md
- 新しい依存パッケージ: なし
