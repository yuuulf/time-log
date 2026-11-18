import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import Home from "./page";

// TimeTracker は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/time-entries/TimeTracker", () => ({
  TimeTracker: () => <div data-testid="time-tracker" />,
}));

test("アプリ名と説明が表示される", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: messages.app.name }),
  ).toBeDefined();
  expect(screen.getByText(messages.app.description)).toBeDefined();
});

test("アプリ名と説明の下に時間記録の画面を置く", () => {
  render(<Home />);
  expect(screen.getByTestId("time-tracker")).toBeDefined();
});

test("Next.js の初期テンプレートの表示が残っていない", () => {
  const { container } = render(<Home />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).not.toMatch(/To get started|Deploy Now/);
});
