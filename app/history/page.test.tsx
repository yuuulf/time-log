import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import * as page from "./page";
import HistoryPage from "./page";

// EntryHistory は DB を読む async の Server Component で、Vitest では描画できないため差し替える
vi.mock("@/components/time-entries/EntryHistory", () => ({
  EntryHistory: () => <div data-testid="entry-history" />,
}));

test("ページ見出しの下に過去の記録を置く", () => {
  render(
    <HistoryPage
      params={Promise.resolve({})}
      searchParams={Promise.resolve({})}
    />,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: messages.history.title }),
  ).toBeDefined();
  expect(screen.getByTestId("entry-history")).toBeDefined();
});

test("タブのタイトルはページで設定せず、レイアウトの「TimeLog」だけにする", () => {
  expect("metadata" in page).toBe(false);
});
