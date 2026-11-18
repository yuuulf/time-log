import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import RootLayout, { metadata } from "./layout";

// next/font はビルド時に Next.js が変換するため、テストでは置き換える
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
}));

test("ページのタイトルにアプリ名が含まれる", () => {
  expect(metadata.title).toEqual({
    default: messages.app.name,
    template: `%s | ${messages.app.name}`,
  });
});

test("日本語の文書として、ヘッダー付きで表示される", () => {
  const html = renderToStaticMarkup(
    <RootLayout params={Promise.resolve({})}>
      <p>本文</p>
    </RootLayout>,
  );
  expect(html).toContain('<html lang="ja"');
  expect(html).toContain(`>${messages.app.name}</a>`);
  expect(html).toContain("<p>本文</p>");
});
