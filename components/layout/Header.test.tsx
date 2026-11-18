import { render, screen } from "@testing-library/react";
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
