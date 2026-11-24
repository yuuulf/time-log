# Tasks

## 1. 見た目の調整

- [x] 1.1 `TimelineBoard` の帯の `<button>` を `flex items-start` にして文字を上端に寄せる（design「帯の `<button>` を `flex items-start` にして…」）。`EntryTimeline.test.tsx` で帯が上端寄せのクラスを持ち、文字が 1 行で省略されることをテストする（コミット: カレンダーの帯の文字を上に寄せる）
- [x] 1.2 `HistoryContent` の「CSV 出力」を `ml-auto` で見出しの行の右端に寄せる（design「『CSV 出力』は `ml-auto` で…」）。`HistoryContent.test.tsx` で一覧・週とも「CSV 出力」が見出しの行の最後にあり右端に寄ることをテストし、README の「見出しの横」を直す（コミット: CSV 出力のボタンを見出しの行の右端に移す）
- [x] 1.3 各ページの見出しを `text-xl`、`<main>` を `py-6`、見出しの下を `mt-4` にする（design「見出しは `text-xl`…」）。各ページのテスト（`app/*/page.test.tsx`・`ProjectDetail.test.tsx`・`ProjectForm.test.tsx`）で見出しのクラスを確かめる（コミット: ページの見出しと余白を小さくする）

## 2. 確認

- [x] 2.1 `npm run format` / `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` がすべて成功することを確かめる。フォーマットで差分が出たら機能変更とは別のコミットにする
- [ ] 2.2 `npm run build` したアプリ（普段使いのアプリと重ならないポート）をブラウザで開き、spec のシナリオを確認する: 今日のタイムラインと週のカレンダーの長い帯の文字が上端にあること、「CSV 出力」が見出しの行の右端にあること（一覧・週）、各ページの見出しと余白、「集計」の PDF 出力が変わらないこと、ライト・ダークの見た目
- [ ] 2.3 一時的な worktree で change をアーカイブし、`openspec validate --all --strict` が通ることを確認してから PR を作成し、CI のチェックがすべて成功することを確認する

## Workflow follow-up

- 実装は main から切った新しいブランチ（`tweak-page-layout`）で行う
- PR のレビューで spec と実装の整合を確かめ、tasks.md がすべて完了してから `archive` ラベルを付ける
