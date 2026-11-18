import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { EntryList } from "./EntryList";

vi.mock("@/lib/time-entries/actions", () => ({
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
}));

const t = messages.timeEntries;
const at = (date: string, time: string) => new Date(`${date}T${time}+09:00`);

test("開始日ごとの見出しの下に、記録を渡された順（新しい順）で表示する", () => {
  render(
    <EntryList
      entries={[
        {
          id: 3,
          taskName: "打ち合わせ",
          startedAt: at("2026-11-18", "13:00:00"),
          endedAt: null,
        },
        {
          id: 2,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "09:00:00"),
          endedAt: at("2026-11-18", "10:00:00"),
        },
        {
          id: 1,
          taskName: "調査",
          startedAt: at("2026-11-17", "23:30:00"),
          endedAt: at("2026-11-18", "00:30:00"),
        },
      ]}
    />,
  );

  const headings = screen.getAllByRole("heading", { level: 3 });
  expect(headings.map((h) => h.textContent)).toEqual([
    "2026年11月18日（水）",
    "2026年11月17日（火）",
  ]);
  const today = screen.getByRole("region", { name: "2026年11月18日（水）" });
  const yesterday = screen.getByRole("region", {
    name: "2026年11月17日（火）",
  });
  expect(
    within(today)
      .getAllByRole("listitem")
      .map((li) => li.querySelector("p")?.textContent),
  ).toEqual(["打ち合わせ", "資料作成"]);
  // 日をまたぐ記録は開始日にまとめる
  expect(within(yesterday).getByText("調査")).toBeDefined();
});

test("記録がなければ、まだ記録がないことを伝える", () => {
  render(<EntryList entries={[]} />);

  expect(screen.getByText(t.empty)).toBeDefined();
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
});
