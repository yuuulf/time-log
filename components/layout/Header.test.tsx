import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { Header } from "./Header";

test("アプリ名がトップページへのリンクとして表示される", () => {
  render(<Header />);
  const link = screen.getByRole("link", { name: messages.app.name });
  expect(link.getAttribute("href")).toBe("/");
});

test("メインメニューとしてナビゲーションが表示される", () => {
  render(<Header />);
  expect(
    screen.getByRole("navigation", { name: messages.nav.label }),
  ).toBeDefined();
});

test("ナビゲーションに過去の記録へのリンクがある", () => {
  render(<Header />);
  const nav = screen.getByRole("navigation", { name: messages.nav.label });
  const link = within(nav).getByRole("link", { name: messages.history.title });
  expect(link.getAttribute("href")).toBe("/history");
});
