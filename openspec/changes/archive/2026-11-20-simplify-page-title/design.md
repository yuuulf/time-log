# Design

## Context

- `app/layout.tsx` の `metadata.title` は `{ default: "TimeLog", template: "%s | TimeLog" }`。トップページはタイトルを設定しないので「TimeLog」、ほかの 6 つのページは `metadata.title` にページ名を設定し、テンプレートで「ページ名 | TimeLog」になる
- 各ページの `page.test.tsx` と `app/layout.test.tsx` が、このタイトルの設定をテストしている

## Goals / Non-Goals

**Goals:**

- タイトルの決め方を共通のレイアウトの 1 か所にまとめる

**Non-Goals:**

- ページごとのメタデータの仕組み（`generateMetadata` など）の追加

## Decisions

### 1. レイアウトのタイトルを文字列の「TimeLog」にし、各ページのタイトルを削除する

`app/layout.tsx` の `metadata.title` を `messages.app.name`（文字列）にする。6 つのページの `export const metadata` と、それだけのために使っている `Metadata` の import を削除する。

- 別案: テンプレートを `"%s"` 以外の形で残し、各ページのタイトルは残す。各ページで設定していても表示されないなら、設定ごと消す方が分かりやすい
- 別案: 各ページで `title: { absolute: "TimeLog" }` を設定する。ページが増えるたびに同じ設定が要るため採らない
- 今後ページを足すときも、`metadata.title` を設定しなければ「TimeLog」になる

### 2. テスト

- `app/layout.test.tsx`: `metadata.title` が「TimeLog」であることをテストする
- 各ページの `page.test.tsx`: `metadata` を export していない（タイトルを設定していない）ことをテストする。ページを読み込んで `metadata` が `undefined` であることを確かめる
- 実際のタブのタイトルは、本番ビルドの HTML の `<title>` で確かめる

## Risks / Trade-offs

- [ブラウザの履歴やブックマークで、TimeLog のページどうしの見分けがつかなくなる] → ユーザーの希望どおり。必要になったら、レイアウトのテンプレートを戻せば済む
