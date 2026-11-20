import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import * as page from "./page";
import SummaryPage from "./page";

// SummaryView は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/summary/SummaryView", () => ({
  SummaryView: () => <div data-testid="summary-view" />,
}));

test("ページ見出しの下に集計を置く", () => {
  render(
    <SummaryPage
      params={Promise.resolve({})}
      searchParams={Promise.resolve({})}
    />,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: messages.summary.title }),
  ).toBeDefined();
  expect(screen.getByTestId("summary-view")).toBeDefined();
});

test("タブのタイトルはページで設定せず、レイアウトの「TimeLog」だけにする", () => {
  expect("metadata" in page).toBe(false);
});
