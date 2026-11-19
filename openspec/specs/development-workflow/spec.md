# development-workflow Specification

## Purpose
TimeLog リポジトリへの変更が同じ品質基準を満たすよう、PR に対する自動チェックと、レビュー後に OpenSpec change をアーカイブする手順を自動化する。

## Requirements

### Requirement: PR の自動チェック
システムは、main ブランチ向けの PR が作成または更新されるたびに、フォーマット確認・lint・型チェック・自動テスト・本番ビルドを実行し、結果を PR のチェックとして報告しなければならない（SHALL）。どれか 1 つでも失敗した場合、チェックは失敗として報告する。

#### Scenario: すべてのチェックが通る
- **WHEN** フォーマット済みで lint・型・テスト・ビルドに問題がない PR を作成する
- **THEN** PR のチェックが成功として表示される

#### Scenario: フォーマットされていないコードを含む
- **WHEN** Prettier の整形結果と異なるファイルを含む PR を作成する
- **THEN** PR のチェックが失敗として表示され、どのファイルが未整形か確認できる

#### Scenario: テストが失敗する
- **WHEN** 自動テストが失敗する変更を含む PR を作成する
- **THEN** PR のチェックが失敗として表示される

### Requirement: archive ラベルによるアーカイブ
システムは、PR に `archive` ラベルが付けられたとき、その PR で追加または変更された進行中の OpenSpec change をアーカイブし、結果を同じ PR のブランチにコミットしなければならない（SHALL）。アーカイブでは change の delta spec をメインの spec に反映し、change を `openspec/changes/archive/` に移す。

#### Scenario: change を 1 つ含む PR をアーカイブする
- **WHEN** `openspec/changes/<name>/` を含む PR に `archive` ラベルを付ける
- **THEN** `<name>` がアーカイブされ、`openspec/specs/` の更新と `openspec/changes/archive/` への移動を含むコミットが PR ブランチに追加される

#### Scenario: change を複数含む PR をアーカイブする
- **WHEN** 進行中の change を 2 つ以上含む PR に `archive` ラベルを付ける
- **THEN** PR に含まれるすべての change がアーカイブされる

### Requirement: 未完了タスクがある change はアーカイブしない
システムは、アーカイブ対象の change のいずれかの tasks.md に未完了のタスクが残っている場合、どの change もアーカイブせず、PR ブランチを変更してはならない（SHALL NOT）。このとき、未完了タスクのある change 名と未完了の件数を PR にコメントする。

#### Scenario: 未完了タスクが残っている
- **WHEN** tasks.md に未完了のタスクが残っている change を含む PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、change 名と未完了タスクの件数がコメントされる

#### Scenario: 複数の change のうち 1 つだけ未完了
- **WHEN** すべて完了した change と、未完了タスクのある change の両方を含む PR に `archive` ラベルを付ける
- **THEN** どちらの change もアーカイブされず、未完了タスクのある change 名がコメントされる

#### Scenario: タスクを完了させてからラベルを付け直す
- **WHEN** 未完了タスクを完了させて push した後、`archive` ラベルを外して付け直す
- **THEN** PR に含まれる change がアーカイブされる

### Requirement: アーカイブできない場合の報告
システムは、アーカイブの対象がない、または検証エラーなどでアーカイブに失敗した場合、PR ブランチを変更せず、理由を PR にコメントしなければならない（SHALL）。

#### Scenario: 対象の change がない
- **WHEN** 進行中の OpenSpec change を含まない PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、アーカイブ対象がない旨のコメントが PR に付く

#### Scenario: change の検証に失敗する
- **WHEN** 検証エラーのある change を含む PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、失敗した change 名とエラー内容がコメントされる

### Requirement: アーカイブ後の再実行
システムは、`archive` ラベルを付けたままアーカイブ済みの PR を更新しても、アーカイブを二重に実行してはならない（SHALL NOT）。

#### Scenario: アーカイブ後に PR を更新する
- **WHEN** アーカイブのコミットが追加された PR に、さらにコミットを push する
- **THEN** アーカイブ処理は再実行されず、`openspec/changes/archive/` に重複したディレクトリはできない

### Requirement: 新しい spec の目的の書き込み
システムは、`archive` ラベルによるアーカイブで新しい capability の spec ができ、その目的（`## Purpose`）が OpenSpec の仮の文のままのとき、change の proposal の「New Capabilities」でその capability に書いた説明を目的として書き込んでからコミットしなければならない（SHALL）。delta spec に目的を書いた場合は、その目的を変えない。仮の文が残る capability の説明が proposal にない場合は、どの change もアーカイブせず、PR ブランチを変更せずに、capability 名と proposal への書き方を PR にコメントする。書き込んだ後、コミットの前に CI と同じ OpenSpec の検証を行い、目的が短すぎるなどで失敗したときも、どの change もアーカイブせず、PR ブランチを変更せずに、検証の結果を PR にコメントする。

#### Scenario: 新しい capability を作る change をアーカイブする
- **WHEN** proposal の New Capabilities に「- `projects`: プロジェクトの一覧・登録・編集・削除」と書いた change を含む PR に `archive` ラベルを付ける
- **THEN** アーカイブのコミットで `openspec/specs/projects/spec.md` の目的が「プロジェクトの一覧・登録・編集・削除」になる
- **AND** そのコミットで起動した CI の OpenSpec の検証が成功する

#### Scenario: proposal に新しい capability の説明がない
- **WHEN** 新しい capability の delta spec はあるが、proposal の New Capabilities にその capability の説明がない change を含む PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、capability 名と proposal への書き方がコメントされる

#### Scenario: proposal の説明が目的として短すぎる
- **WHEN** proposal の New Capabilities の説明が「プロジェクトの管理」のように短く、OpenSpec の検証で目的が短すぎると判定される change を含む PR に `archive` ラベルを付ける
- **THEN** PR ブランチにはコミットが追加されず、検証の結果がコメントされる

#### Scenario: 既存の capability だけを変更する
- **WHEN** 既存の capability の delta spec だけを含む change を含む PR に `archive` ラベルを付ける
- **THEN** 既存の spec の目的は変わらずにアーカイブされる
