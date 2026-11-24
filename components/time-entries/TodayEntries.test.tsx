import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { TodayEntries } from "./TodayEntries";

vi.mock("@/lib/time-entries/actions", () => ({
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  startEntryAction: vi.fn(),
}));

const t = messages.timeEntries;
const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);
const entries = [
  {
    id: 1,
    taskName: "資料作成",
    startedAt: at("09:00:00"),
    endedAt: at("10:00:00"),
    project: null,
  },
];

function renderToday(initialView: "list" | "timeline") {
  render(
    <TodayEntries
      entries={entries}
      now={at("15:00:00")}
      projects={[]}
      suggestions={[]}
      initialView={initialView}
    />,
  );
}

const listButton = () => screen.getByRole("button", { name: t.view.list });
const timelineButton = () =>
  screen.getByRole("button", { name: t.view.timeline });
const timeline = () => screen.queryByRole("group", { name: t.timeline.label });

afterEach(() => {
  document.cookie = "timelog-today-view=; path=/; max-age=0";
});

describe("今日の記録の表示の切り替え", () => {
  test("見出しの横に「一覧」「カレンダー」のアイコンボタンを置く", () => {
    renderToday("list");

    const group = screen.getByRole("group", { name: t.view.label });
    expect(group.parentElement?.querySelector("h2")?.textContent).toBe(
      t.listHeading,
    );
    expect(listButton().title).toBe("一覧");
    expect(timelineButton().title).toBe("カレンダー");
    expect(listButton().textContent).toBe("");
  });

  test("最初の表示が一覧なら一覧を出し、「一覧」が押された状態", () => {
    renderToday("list");

    expect(timeline()).toBeNull();
    expect(screen.getAllByDisplayValue("資料作成").length).toBeGreaterThan(0);
    expect(listButton().getAttribute("aria-pressed")).toBe("true");
    expect(timelineButton().getAttribute("aria-pressed")).toBe("false");
  });

  test("「カレンダー」を選ぶとタイムラインになり、Cookie に覚えておく", () => {
    renderToday("list");

    fireEvent.click(timelineButton());

    expect(timeline()).not.toBeNull();
    expect(timelineButton().getAttribute("aria-pressed")).toBe("true");
    expect(listButton().getAttribute("aria-pressed")).toBe("false");
    expect(document.cookie).toContain("timelog-today-view=timeline");
  });

  test("最初の表示がタイムラインならタイムラインを出し、「一覧」で一覧に戻す", () => {
    renderToday("timeline");

    expect(timeline()).not.toBeNull();

    fireEvent.click(listButton());

    expect(timeline()).toBeNull();
    expect(listButton().getAttribute("aria-pressed")).toBe("true");
    expect(document.cookie).toContain("timelog-today-view=list");
  });
});
