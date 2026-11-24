import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { EntryTimeline, MINUTE_PX } from "./EntryTimeline";

const t = messages.timeEntries;
const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);
const now = at("15:00:00");
const project = { id: 1, name: "社内ツール", color: "teal" };

function blockStyle(name: RegExp) {
  return screen.getByRole("button", { name }).style;
}

describe("タイムラインの表示", () => {
  test("記録を時間軸に置き、タスク名と時刻を表示する", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "資料作成",
            startedAt: at("09:15:00"),
            endedAt: at("10:30:00"),
            project,
          },
        ]}
      />,
    );

    const block = screen.getByRole("button", {
      name: "資料作成 09:15〜10:30",
    });
    expect(block.textContent).toContain("資料作成");
    expect(block.textContent).toContain("09:15〜10:30");
    expect(block.title).toBe("資料作成 09:15〜10:30");
    expect(block.style.top).toBe(`${(9 * 60 + 15) * MINUTE_PX}px`);
    expect(block.style.height).toBe(`${75 * MINUTE_PX}px`);
    expect(block.className).toContain("bg-project-teal/15");
  });

  test("プロジェクトのない記録は控えめな色、タスク名がなければ「（タスク名なし）」", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "",
            startedAt: at("09:00:00"),
            endedAt: at("10:00:00"),
            project: null,
          },
        ]}
      />,
    );

    const block = screen.getByRole("button", {
      name: `${t.untitled} 09:00〜10:00`,
    });
    expect(block.className).toContain("bg-muted/15");
  });

  test("記録中の記録は開始から 30 分ぶんの高さで「記録中」と表示する", () => {
    render(
      <EntryTimeline
        now={at("14:00:00")}
        entries={[
          {
            id: 1,
            taskName: "打ち合わせ",
            startedAt: at("13:00:00"),
            endedAt: null,
          },
        ]}
      />,
    );

    const style = blockStyle(/打ち合わせ 13:00〜記録中/);
    expect(style.top).toBe(`${13 * 60 * MINUTE_PX}px`);
    expect(style.height).toBe(`${30 * MINUTE_PX}px`);
  });

  test("重なる記録は横に並べる", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "A",
            startedAt: at("09:00:00"),
            endedAt: at("10:00:00"),
          },
          {
            id: 2,
            taskName: "B",
            startedAt: at("09:30:00"),
            endedAt: at("11:00:00"),
          },
        ]}
      />,
    );

    expect(blockStyle(/^A /).left).toBe("0%");
    expect(blockStyle(/^B /).left).toBe("50%");
    expect(blockStyle(/^A /).width).toBe("calc(50% - 4px)");
  });

  test("短い記録も選べる高さにする", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "電話",
            startedAt: at("09:00:00"),
            endedAt: at("09:05:00"),
          },
        ]}
      />,
    );

    expect(blockStyle(/電話/).height).toBe("20px");
  });

  test("日付の見出しの右端に合計時間を表示する（記録中は含めない）", () => {
    render(
      <EntryTimeline
        now={now}
        entries={[
          {
            id: 1,
            taskName: "A",
            startedAt: at("09:00:00"),
            endedAt: at("10:30:00"),
          },
          {
            id: 2,
            taskName: "B",
            startedAt: at("11:00:00"),
            endedAt: at("11:45:00"),
          },
          { id: 3, taskName: "C", startedAt: at("14:00:00"), endedAt: null },
        ]}
      />,
    );

    const day = screen.getByRole("region", { name: "2026年11月18日（水）" });
    expect(within(day).getByRole("heading", { level: 3 }).textContent).toBe(
      "2026年11月18日（水）",
    );
    expect(day.textContent).toContain(`${t.dayTotal} 2時間15分`);
  });

  test("今日の記録がなくても 0 時〜24 時の目盛りと今の時刻の線を表示する", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    const timeline = screen.getByRole("group", { name: t.timeline.label });
    expect(timeline.textContent).toContain("0:00");
    expect(timeline.textContent).toContain("23:00");
    expect(within(timeline).queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByTestId("timeline-now").style.top).toBe(
      `${15 * 60 * MINUTE_PX}px`,
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      t.listHeading,
    );
  });

  test("開いたときは今の時刻の 1 時間前までスクロールする", () => {
    render(<EntryTimeline now={now} entries={[]} />);

    expect(
      screen.getByRole("group", { name: t.timeline.label }).scrollTop,
    ).toBe(14 * 60 * MINUTE_PX);
  });
});
