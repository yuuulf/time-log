# Tasks

## 1. アーカイブのスクリプト

- [x] 1.1 `scripts/openspec-archive.mjs` に `parseNewCapabilities` と、アーカイブ後に仮の目的を proposal の説明に置き換える処理を足す（design 決定 1・2）。`openspec-archive.test.ts` で、New Capabilities の読み取り（複数・「（なし）」・コメント・空の説明）、置き換えてからコミットすること、説明がないときにコミットせず作業ツリーを戻してコメントすること、既存の capability だけのときに spec を変えないことをテストする（コミット: アーカイブで新しい spec の目的を proposal から書き込む）
- [ ] 1.3 置き換えた後、コミットの前に `openspec validate --all --strict` を実行し、失敗したら作業ツリーを戻して検証の結果をコメントする（design 決定 2）。`openspec-archive.test.ts` で、検証に失敗したときにコミットせずコメントすること、成功したときにコミットすることをテストする（コミット: アーカイブ後の spec をコミット前に検証する）
- [ ] 1.4 `openspec/config.yaml` の proposal のルールに、説明を 50 文字以上で書くことを足す（design 決定 3）（コミット: capability の説明の長さをルールに足す）
- [x] 1.2 `openspec/config.yaml` の proposal のルールに、New Capabilities の説明が spec の目的になることを足す（design 決定 3）（コミット: proposal のルールに capability の説明の書き方を足す）

## 2. 確認とドキュメント

- [ ] 2.1 add-projects をアーカイブする前のコミット（6915af9）を一時的な worktree に取り出し、スクリプトを実行して、proposal の説明が短いままだとコミットせずに検証の結果を返すこと、説明を 50 文字以上にすると `openspec/specs/projects/spec.md` の目的がその説明になり、`openspec validate --all --strict` が通ってコミットされることを確認する
- [ ] 2.2 README.md の「仕様と計画（OpenSpec）」に、新しい spec の目的は proposal の New Capabilities の説明から書き込まれること、説明がないとアーカイブしないことを追記する。README の記述が実装と一致していることを確認する（コミット: README にアーカイブでの spec の目的を追記）
- [ ] 2.3 PR を作成し、CI のチェックがすべて成功することを確認する
