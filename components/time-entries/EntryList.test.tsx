import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { EntryList } from "./EntryList";

vi.mock("@/lib/time-entries/actions", () => ({
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  startEntryAction: vi.fn(),
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
      .map((li) => li.querySelector("input")?.value),
  ).toEqual(["打ち合わせ", "資料作成"]);
  // 日をまたぐ記録は開始日にまとめる
  expect(
    within(yesterday).getByRole("textbox", { name: t.taskName }),
  ).toHaveProperty("value", "調査");
});

test("記録がなければ、今日の記録がまだないことを伝える", () => {
  render(<EntryList entries={[]} />);

  expect(screen.getByText("今日の記録はまだありません。")).toBeDefined();
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
});

test("見出しを省略すると「今日の記録」と表示する", () => {
  render(<EntryList entries={[]} />);

  expect(
    screen.getByRole("heading", { level: 2, name: "今日の記録" }),
  ).toBeDefined();
});

test("見出しと記録がないときの文言を差し替えられる", () => {
  render(
    <EntryList
      entries={[]}
      heading="2026年10月"
      emptyMessage="この期間の記録はありません。"
    />,
  );

  expect(
    screen.getByRole("heading", { level: 2, name: "2026年10月" }),
  ).toBeDefined();
  expect(screen.getByText("この期間の記録はありません。")).toBeDefined();
  expect(screen.queryByText(t.empty)).toBeNull();
});

test("プロジェクトの名前と選択肢を渡す", () => {
  const project = { id: 1, name: "社内ツール", color: "teal" };
  render(
    <EntryList
      entries={[
        {
          id: 1,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "09:00:00"),
          endedAt: at("2026-11-18", "10:00:00"),
          project,
        },
      ]}
      projects={[project]}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: t.projectButton("社内ツール") }),
  );
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
    t.noProject,
    "社内ツール",
  ]);
});

/** 日付の見出しの行（見出しと合計の入った要素） */
const headingRow = (date: string) =>
  screen.getByRole("heading", { level: 3, name: date }).parentElement!;

test("日付の見出しの右端に、その日の終了済みの記録の合計時間を表示する", () => {
  render(
    <EntryList
      entries={[
        {
          id: 3,
          taskName: "打ち合わせ",
          startedAt: at("2026-11-18", "13:00:00"),
          endedAt: at("2026-11-18", "13:30:00"),
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
          startedAt: at("2026-11-17", "10:00:00"),
          endedAt: at("2026-11-17", "12:00:00"),
        },
      ]}
    />,
  );

  expect(headingRow("2026年11月18日（水）").textContent).toContain(
    `${t.dayTotal} 1時間30分`,
  );
  expect(headingRow("2026年11月17日（火）").textContent).toContain(
    `${t.dayTotal} 2時間0分`,
  );
  // 見出しと区切りの名前は日付のまま
  expect(
    screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent),
  ).toEqual(["2026年11月18日（水）", "2026年11月17日（火）"]);
  expect(
    screen.getByRole("region", { name: "2026年11月18日（水）" }),
  ).toBeDefined();
});

test("合計の「合計」は読み上げ用で、見た目には時間だけを出す", () => {
  render(
    <EntryList
      entries={[
        {
          id: 1,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "09:00:00"),
          endedAt: at("2026-11-18", "09:45:00"),
        },
      ]}
    />,
  );

  const label = within(headingRow("2026年11月18日（水）")).getByText(
    t.dayTotal,
  );
  expect(label.className).toContain("sr-only");
});

test("合計は記録ごとに秒を切り捨ててから足す", () => {
  render(
    <EntryList
      entries={[
        {
          id: 2,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "10:00:00"),
          endedAt: at("2026-11-18", "10:10:30"),
        },
        {
          id: 1,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "09:00:00"),
          endedAt: at("2026-11-18", "09:10:30"),
        },
      ]}
    />,
  );

  expect(headingRow("2026年11月18日（水）").textContent).toContain("20分");
  expect(headingRow("2026年11月18日（水）").textContent).not.toContain("21分");
});

test("記録中の記録は合計に含めない", () => {
  render(
    <EntryList
      entries={[
        {
          id: 2,
          taskName: "打ち合わせ",
          startedAt: at("2026-11-18", "13:00:00"),
          endedAt: null,
        },
        {
          id: 1,
          taskName: "資料作成",
          startedAt: at("2026-11-18", "09:00:00"),
          endedAt: at("2026-11-18", "10:00:00"),
        },
      ]}
    />,
  );

  expect(headingRow("2026年11月18日（水）").textContent).toContain(
    `${t.dayTotal} 1時間0分`,
  );
});

test("記録中の記録だけの日は「0分」と表示する", () => {
  render(
    <EntryList
      entries={[
        {
          id: 1,
          taskName: "打ち合わせ",
          startedAt: at("2026-11-18", "13:00:00"),
          endedAt: null,
        },
      ]}
    />,
  );

  expect(headingRow("2026年11月18日（水）").textContent).toContain(
    `${t.dayTotal} 0分`,
  );
});
