import { render, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import RootLayout, { metadata } from "./layout";

// next/font はビルド時に Next.js が変換するため、テストでは置き換える
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));
// 記録中のタスクは DB を読むサーバー専用の部品なので、テストでは置き換える
vi.mock("@/components/layout/RunningTask", () => ({
  RunningTask: () => <p>記録中のタスク</p>,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

test("ページのタイトルにアプリ名が含まれる", () => {
  expect(metadata.title).toEqual({
    default: messages.app.name,
    template: `%s | ${messages.app.name}`,
  });
});

test("ファビコンはライト・ダークで TimeLog のロゴを出し分ける", () => {
  expect(metadata.icons).toEqual({
    icon: [
      { url: "/icon-light.png", type: "image/png" },
      {
        url: "/icon-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  });
});

test("日本語の文書として、サイドバー付きで表示される", () => {
  const html = renderToStaticMarkup(
    <RootLayout params={Promise.resolve({})}>
      <p>本文</p>
    </RootLayout>,
  );
  expect(html).toContain('<html lang="ja"');
  expect(html).toContain(`>${messages.app.name}</a>`);
  expect(html).toContain('<aside id="sidebar"');
  // サイドバーは上からアプリ名、記録中のタスク、ページのリンク（過去の記録・集計・プロジェクト）の順。「ホーム」のリンクはない
  const aside = html.slice(html.indexOf('<aside id="sidebar"'));
  expect(aside).not.toContain(`>${messages.nav.home}</a>`);
  const order = [
    `>${messages.app.name}</a>`,
    "<p>記録中のタスク</p>",
    `>${messages.history.title}</a>`,
    `>${messages.summary.title}</a>`,
    `>${messages.projects.title}</a>`,
  ].map((part) => aside.indexOf(part));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect(order).toEqual([...order].sort((a, b) => a - b));
  expect(html).toContain("<p>本文</p>");
});

test("サイドバーのアプリ名はロゴ付きで、名前は「TimeLog」のままトップページを指す", () => {
  render(
    <RootLayout params={Promise.resolve({})}>
      <p>本文</p>
    </RootLayout>,
    { container: document },
  );
  const aside = document.querySelector("aside");
  const link = within(aside as HTMLElement).getByRole("link", {
    name: messages.app.name,
  });
  expect(link.getAttribute("href")).toBe("/");
  expect(link.querySelectorAll('img[alt=""]')).toHaveLength(2);
});
