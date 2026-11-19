import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import Home from "./page";

// TimeTracker は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/time-entries/TimeTracker", () => ({
  TimeTracker: () => <div data-testid="time-tracker" />,
}));

test("本文にアプリ名の見出しと説明を出さず、読み上げ用の見出し「ホーム」を置く", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: messages.nav.home }),
  ).toBeDefined();
  expect(screen.queryByText(messages.app.name)).toBeNull();
  expect(screen.queryByText(messages.app.description)).toBeNull();
});

test("本文に時間記録の画面を置く", () => {
  render(<Home />);
  expect(screen.getByTestId("time-tracker")).toBeDefined();
});

test("Next.js の初期テンプレートの表示が残っていない", () => {
  const { container } = render(<Home />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).not.toMatch(/To get started|Deploy Now/);
});
