# Spec Delta

## ADDED Requirements

### Requirement: 新しい spec の目的の書き込み
システムは、`archive` ラベルによるアーカイブで新しい capability の spec ができ、その目的（`## Purpose`）が OpenSpec の仮の文のままのとき、change の proposal の「New Capabilities」でその capability に書いた説明を目的として書き込んでからコミットしなければならない（SHALL）。delta spec に目的を書いた場合は、その目的を変えない。仮の文が残る capability の説明が proposal にない場合は、どの change もアーカイブせず、PR ブランチを変更せずに、capability 名と proposal への書き方を PR にコメントする。

#### Scenario: 新しい capability を作る change をアーカイブする
- **WHEN** proposal の New Capabilities に「- `projects`: プロジェクトの一覧・登録・編集・削除」と書いた change を含む PR に `archive` ラベルを付ける
- **THEN** アーカイブのコミットで `openspec/specs/projects/spec.md` の目的が「プロジェクトの一覧・登録・編集・削除」になる
- **AND** そのコミットで起動した CI の OpenSpec の検証が成功する

#### Scenario: proposal に新しい capability の説明がない
- **WHEN** 新しい capability の delta spec はあるが、proposal の New Capabilities にその capability の説明がない change を含む PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、capability 名と proposal への書き方がコメントされる

#### Scenario: 既存の capability だけを変更する
- **WHEN** 既存の capability の delta spec だけを含む change を含む PR に `archive` ラベルを付ける
- **THEN** 既存の spec の目的は変わらずにアーカイブされる
