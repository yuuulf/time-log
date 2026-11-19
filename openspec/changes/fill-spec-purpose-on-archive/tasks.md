# Tasks

## 1. アーカイブのスクリプト

- [x] 1.1 `scripts/openspec-archive.mjs` に `parseNewCapabilities` と、アーカイブ後に仮の目的を proposal の説明に置き換える処理を足す（design 決定 1・2）。`openspec-archive.test.ts` で、New Capabilities の読み取り（複数・「（なし）」・コメント・空の説明）、置き換えてからコミットすること、説明がないときにコミットせず作業ツリーを戻してコメントすること、既存の capability だけのときに spec を変えないことをテストする（コミット: アーカイブで新しい spec の目的を proposal から書き込む）
- [x] 1.2 `openspec/config.yaml` の proposal のルールに、New Capabilities の説明が spec の目的になることを足す（design 決定 3）（コミット: proposal のルールに capability の説明の書き方を足す）

## 2. 確認とドキュメント

- [ ] 2.1 add-projects をアーカイブする前のコミット（6915af9）を一時的な worktree に取り出し、スクリプトの置き換え処理で `openspec/specs/projects/spec.md` の目的が proposal の説明になり、`openspec validate --all --strict` が通ることを確認する
- [ ] 2.2 README.md の「仕様と計画（OpenSpec）」に、新しい spec の目的は proposal の New Capabilities の説明から書き込まれること、説明がないとアーカイブしないことを追記する。README の記述が実装と一致していることを確認する（コミット: README にアーカイブでの spec の目的を追記）
- [ ] 2.3 PR を作成し、CI のチェックがすべて成功することを確認する
