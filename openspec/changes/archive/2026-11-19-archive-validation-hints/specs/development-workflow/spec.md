# Spec Delta

## ADDED Requirements

### Requirement: アーカイブ後の検証に失敗したときの案内
システムは、アーカイブ後の OpenSpec の検証に失敗して PR にコメントするとき、検証の結果（コマンドの出力）に加えて、結果に合わせた直し方の案内を付けなければならない（SHALL）。目的（Purpose）の誤りのときは proposal の「New Capabilities」の説明を 50 文字以上で書くよう、要件の本文が長すぎるときはシナリオに移すか要件を分けるよう案内する。どちらにも当たらないときは、検証の結果を見て spec を直すよう案内する。目的の案内は、目的の誤りがないときには付けない。

#### Scenario: 目的が短すぎる
- **WHEN** 検証で新しい spec の目的が短すぎると判定され、アーカイブしなかった
- **THEN** PR のコメントに、proposal の New Capabilities の説明を 50 文字以上で書くよう案内と、検証の結果が載る

#### Scenario: 要件の本文が長すぎる
- **WHEN** 検証で要件の本文が 500 文字を超えていると判定され、アーカイブしなかった
- **THEN** PR のコメントに、シナリオに移すか要件を分けるよう案内と、検証の結果が載る
- **AND** 目的を 50 文字以上で書くよう案内は載らない

#### Scenario: 案内のない種類の誤り
- **WHEN** 検証で目的と要件の長さ以外の誤りだけが見つかり、アーカイブしなかった
- **THEN** PR のコメントに、検証の結果を見て spec を直すよう案内と、検証の結果が載る

## MODIFIED Requirements

### Requirement: 新しい spec の目的の書き込み
システムは、`archive` ラベルによるアーカイブで新しい capability の spec ができ、その目的（`## Purpose`）が OpenSpec の仮の文のままのとき、change の proposal の「New Capabilities」でその capability に書いた説明を目的として書き込んでからコミットしなければならない（SHALL）。delta spec に目的を書いた場合は、その目的を変えない。仮の文が残る capability の説明が proposal にない場合は、どの change もアーカイブせず、PR ブランチを変更せずに、capability 名と proposal への書き方を PR にコメントする。書き込んだ後、コミットの前に CI と同じ OpenSpec の検証を行い、目的が短すぎるなどで失敗したときも、どの change もアーカイブせず、PR ブランチを変更せずに、検証の結果を PR にコメントする。

#### Scenario: 新しい capability を作る change をアーカイブする
- **WHEN** proposal の New Capabilities に「- `projects`: 記録をまとめる単位としてプロジェクト（名前・色・クライアント名・説明）を登録・編集・削除できるようにする。記録との紐づけと表示は time-tracking で定める」と書いた change を含む PR に `archive` ラベルを付ける
- **THEN** アーカイブのコミットで `openspec/specs/projects/spec.md` の目的がその説明になる
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
