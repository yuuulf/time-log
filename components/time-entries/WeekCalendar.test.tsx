import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { MINUTE_PX } from "./TimelineBoard";
import { WeekCalendar } from "./WeekCalendar";

vi.mock("@/lib/time-entries/actions", () => ({
  createEntryAction: vi.fn(),
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
}));

const t = messages.timeEntries;
const jst = (value: string) => new Date(`${value}+09:00`);
const days = [16, 17, 18, 19, 20, 21, 22].map((d) =>
  jst(`2026-11-${d}T00:00:00`),
);
const heading = "2026年11月16日〜2026年11月22日";
// 翌週の火曜日（表示する週はすべて過去）
const later = jst("2026-11-24T15:00:00");

const entries = [
  {
    id: 1,
    taskName: "資料作成",
    startedAt: jst("2026-11-17T09:00:00"),
    endedAt: jst("2026-11-17T10:00:00"),
    project: null,
  },
  {
    id: 2,
    taskName: "調査",
    startedAt: jst("2026-11-17T13:00:00"),
    endedAt: jst("2026-11-17T13:30:00"),
    project: null,
  },
  {
    id: 3,
    taskName: "打ち合わせ",
    startedAt: jst("2026-11-20T13:00:00"),
    endedAt: jst("2026-11-20T14:30:00"),
    project: null,
  },
];

function columns() {
  return screen.getAllByTestId("timeline-area");
}

describe("週のカレンダーの表示", () => {
  test("見出しに週の期間を出し、月曜日〜日曜日の 7 つの列を並べる", () => {
    render(
      <WeekCalendar heading={heading} days={days} entries={[]} now={later} />,
    );

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(heading);
    expect(
      screen
        .getAllByTestId("timeline-day-header")
        .map((h) => h.querySelector("p")?.textContent),
    ).toEqual([
      "11/16（月）",
      "11/17（火）",
      "11/18（水）",
      "11/19（木）",
      "11/20（金）",
      "11/21（土）",
      "11/22（日）",
    ]);
    expect(columns()).toHaveLength(7);
  });

  test("記録を開始した日の列の時刻の位置に帯で置く", () => {
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={entries}
        now={later}
      />,
    );

    const [, tuesday, , , friday] = columns();
    const study = within(tuesday).getByRole("button", {
      name: "資料作成 09:00〜10:00",
    });
    expect(study.style.top).toBe(`${9 * 60 * MINUTE_PX}px`);
    const meeting = within(friday).getByRole("button", {
      name: "打ち合わせ 13:00〜14:30",
    });
    expect(meeting.style.height).toBe(`${90 * MINUTE_PX}px`);
    expect(within(columns()[0]).queryAllByRole("button")).toHaveLength(0);
  });

  test("列の上にその日の合計時間を出し、記録のない日は「0分」", () => {
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={entries}
        now={later}
      />,
    );

    const headers = screen.getAllByTestId("timeline-day-header");
    expect(headers[1].textContent).toContain(`${t.dayTotal} 1時間30分`);
    expect(headers[0].textContent).toContain(`${t.dayTotal} 0分`);
  });

  test("過去の週は、いちばん早い記録の 1 時間前までスクロールし、今の時刻の線はない", () => {
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={entries}
        now={later}
      />,
    );

    expect(
      screen.getByRole("group", { name: t.timeline.label }).scrollTop,
    ).toBe(8 * 60 * MINUTE_PX);
    expect(screen.queryByTestId("timeline-now")).toBeNull();
    expect(screen.queryByTestId("timeline-future")).toBeNull();
  });

  test("記録のない過去の週は 8 時のあたり（7 時を上端）までスクロールする", () => {
    render(
      <WeekCalendar heading={heading} days={days} entries={[]} now={later} />,
    );

    expect(
      screen.getByRole("group", { name: t.timeline.label }).scrollTop,
    ).toBe(7 * 60 * MINUTE_PX);
  });

  test("今週は今日の列にだけ今の時刻の線を引き、今の時刻の 1 時間前までスクロールする", () => {
    // 11月18日（水）15:00
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={entries}
        now={jst("2026-11-18T15:00:00")}
      />,
    );

    const now = screen.getByTestId("timeline-now");
    expect(columns()[2].contains(now)).toBe(true);
    expect(now.style.top).toBe(`${15 * 60 * MINUTE_PX}px`);
    expect(
      screen.getByRole("group", { name: t.timeline.label }).scrollTop,
    ).toBe(14 * 60 * MINUTE_PX);
  });

  test("今週の今日より後の列は、列全体で追加用のポインタを出さない", () => {
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={[]}
        now={jst("2026-11-18T15:00:00")}
      />,
    );

    const futures = screen.getAllByTestId("timeline-future");
    // 今日（水）の今より後と、木〜日の 4 列
    expect(futures).toHaveLength(5);
    expect(columns()[3].contains(futures[1])).toBe(true);
    expect(futures[1].style.top).toBe("0px");
    expect(
      columns()[1].querySelector('[data-testid="timeline-future"]'),
    ).toBeNull();
  });

  test("週では帯の右に残す幅を 1rem にする", () => {
    render(
      <WeekCalendar
        heading={heading}
        days={days}
        entries={entries}
        now={later}
      />,
    );

    expect(
      screen.getByRole("button", { name: /^資料作成 / }).style.width,
    ).toContain("1rem");
  });
});
