import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { MINUTE_PX, TimelineBoard } from "./TimelineBoard";

vi.mock("@/lib/time-entries/actions", () => ({
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
}));

const t = messages.timeEntries;
const jst = (value: string) => new Date(`${value}+09:00`);
const now = jst("2026-11-24T15:00:00");
const day = (d: number) => ({
  dayStart: jst(`2026-11-${d}T00:00:00`),
  entries: [],
});
const editor = () =>
  screen.queryByRole("dialog", { name: t.timeline.editorLabel });

/** n 番目の列の、0 時からの分の位置をクリックする */
function clickColumn(index: number, minute: number) {
  const area = screen.getAllByTestId("timeline-area")[index];
  area.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  fireEvent.click(area, { clientY: minute * MINUTE_PX });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

test("1 日のときは列の見出しを出さず、入力欄は右寄せ", () => {
  render(
    <TimelineBoard
      days={[day(24)]}
      now={now}
      gutter="2rem"
      projects={[]}
      suggestions={[]}
    />,
  );

  expect(screen.queryByTestId("timeline-day-header")).toBeNull();
  clickColumn(0, 10 * 60);
  expect(editor()!.style.left).toBe("");
});

test("複数の日のときは、選んだ列の日の入力欄をその列の左端に合わせて開く", () => {
  render(
    <TimelineBoard
      days={[day(16), day(17), day(18), day(19), day(20), day(21), day(22)]}
      now={now}
      gutter="1rem"
      dayHeaders={[16, 17, 18, 19, 20, 21, 22].map((d) => ({
        label: `11/${d}`,
        totalMs: 0,
      }))}
      projects={[]}
      suggestions={[]}
    />,
  );

  clickColumn(2, 10 * 60 + 40);

  const start = screen.getByLabelText(t.startedAt) as HTMLInputElement;
  expect(start.value.startsWith("2026-11-18T10:30")).toBe(true);
  expect(editor()!.style.left).toContain("18rem");
});
