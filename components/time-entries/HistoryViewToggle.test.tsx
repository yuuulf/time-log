import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { HistoryViewToggle } from "./HistoryViewToggle";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const t = messages.timeEntries.view;
const hrefs = {
  list: "/history?month=2026-10",
  timeline: "/history?week=2026-10-26",
};

afterEach(() => {
  push.mockClear();
  document.cookie = "timelog-history-view=; path=/; max-age=0";
  document.cookie = "timelog-today-view=; path=/; max-age=0";
});

test("「カレンダー」を選ぶと、過去の記録の Cookie に覚えて週へ移動する", () => {
  render(<HistoryViewToggle view="list" hrefs={hrefs} />);

  fireEvent.click(screen.getByRole("button", { name: t.timeline }));

  expect(document.cookie).toContain("timelog-history-view=timeline");
  expect(document.cookie).not.toContain("timelog-today-view");
  expect(push).toHaveBeenCalledWith("/history?week=2026-10-26");
});

test("「一覧」を選ぶと、覚えて月へ移動する", () => {
  render(<HistoryViewToggle view="timeline" hrefs={hrefs} />);

  fireEvent.click(screen.getByRole("button", { name: t.list }));

  expect(document.cookie).toContain("timelog-history-view=list");
  expect(push).toHaveBeenCalledWith("/history?month=2026-10");
});

test("選んでいる表示をもう一度選んでも移動しない", () => {
  render(<HistoryViewToggle view="list" hrefs={hrefs} />);

  fireEvent.click(screen.getByRole("button", { name: t.list }));

  expect(push).not.toHaveBeenCalled();
});
