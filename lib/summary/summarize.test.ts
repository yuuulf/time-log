// @vitest-environment node
import { describe, expect, test } from "vitest";
import { formatDuration, formatMonthDay, monthRange } from "@/lib/time";
import { resolveHistoryQuery } from "@/lib/time-entries/history";
import { summarize, type SummaryEntry } from "./summarize";

const jst = (value: string) => new Date(`${value}+09:00`);
const november = monthRange({ year: 2026, month: 11 });
const dev = { id: 1, name: "開発", color: "blue" };
const meeting = { id: 2, name: "会議", color: "red" };
const research = { id: 3, name: "調査", color: "green" };

/** start から minutes 分（小数で秒も）の終了済みの記録 */
const entry = (
  start: string,
  minutes: number,
  project: SummaryEntry["project"] = null,
): SummaryEntry => {
  const startedAt = jst(start);
  return {
    startedAt,
    endedAt: new Date(startedAt.getTime() + minutes * 60_000),
    project,
  };
};
const running = (start: string): SummaryEntry => ({
  startedAt: jst(start),
  endedAt: null,
  project: null,
});

const weekLabels = (entries: SummaryEntry[], range = november) =>
  summarize(entries, range).weeks.map(
    (w) => `${formatMonthDay(w.first)}〜${formatMonthDay(w.last)}`,
  );

describe("合計時間", () => {
  test("終了済みの記録の作業時間を足す", () => {
    const { totalMs } = summarize(
      [entry("2026-11-04T09:00", 90), entry("2026-11-05T09:00", 45)],
      november,
    );
    expect(formatDuration(totalMs)).toBe("2時間15分");
  });

  test("秒は記録ごとに切り捨ててから足す", () => {
    const { totalMs } = summarize(
      [entry("2026-11-04T09:00", 10.5), entry("2026-11-04T10:00", 10.5)],
      november,
    );
    expect(formatDuration(totalMs)).toBe("20分");
  });

  test("週ごと・プロジェクトごとの時間を足すと、合計時間と一致する", () => {
    const summary = summarize(
      [
        entry("2026-11-08T09:00", 10.5, dev),
        entry("2026-11-09T09:00", 10.5, dev),
        entry("2026-11-09T10:00", 0.75),
      ],
      november,
    );
    const sum = (totals: { totalMs: number }[]) =>
      totals.reduce((s, x) => s + x.totalMs, 0);
    expect(formatDuration(summary.totalMs)).toBe("20分");
    expect(sum(summary.weeks)).toBe(summary.totalMs);
    expect(sum(summary.projects)).toBe(summary.totalMs);
  });

  test("記録中の記録は含めない", () => {
    const { totalMs } = summarize(
      [entry("2026-11-04T09:00", 60), running("2026-11-05T09:00")],
      november,
    );
    expect(formatDuration(totalMs)).toBe("1時間0分");
  });

  test("範囲の外に開始した記録は含めず、範囲の終わりをまたぐ記録はすべて含める", () => {
    const { totalMs } = summarize(
      [entry("2026-10-31T23:30", 60), entry("2026-11-30T23:30", 60)],
      november,
    );
    expect(formatDuration(totalMs)).toBe("1時間0分");
  });

  test("記録がなければ 0", () => {
    const summary = summarize([], november);
    expect(summary.totalMs).toBe(0);
    expect(summary.workDays).toBe(0);
    expect(summary.projects).toEqual([]);
  });
});

describe("稼働日数", () => {
  test("記録を開始した日を 1 日ずつ数える", () => {
    const { workDays } = summarize(
      [
        entry("2026-11-04T09:00", 10),
        entry("2026-11-04T13:00", 10),
        entry("2026-11-04T17:00", 10),
        entry("2026-11-05T09:00", 10),
      ],
      november,
    );
    expect(workDays).toBe(2);
  });

  test("記録中の記録だけの日も数える", () => {
    const { workDays } = summarize(
      [entry("2026-11-04T09:00", 10), running("2026-11-20T09:00")],
      november,
    );
    expect(workDays).toBe(2);
  });

  test("日本時間の日付で数える", () => {
    // 日本時間の 11月4日 23:30 と 11月5日 0:30（UTC ではどちらも 11月4日）
    const { workDays } = summarize(
      [entry("2026-11-04T23:30", 10), entry("2026-11-05T00:30", 10)],
      november,
    );
    expect(workDays).toBe(2);
  });
});

describe("週ごとの合計時間", () => {
  test("月の集計では、月曜日で区切り、月をまたがない", () => {
    expect(weekLabels([])).toEqual([
      "11月1日〜11月1日",
      "11月2日〜11月8日",
      "11月9日〜11月15日",
      "11月16日〜11月22日",
      "11月23日〜11月29日",
      "11月30日〜11月30日",
    ]);
  });

  test("期間の集計では、月をまたぐ週も 1 つにまとめる", () => {
    const view = resolveHistoryQuery(
      { from: "2026-10-20", to: "2026-11-10" },
      jst("2026-11-20T12:00"),
    );
    if (view.mode !== "range") throw new Error(view.mode);
    expect(weekLabels([], view.range)).toEqual([
      "10月20日〜10月25日",
      "10月26日〜11月1日",
      "11月2日〜11月8日",
      "11月9日〜11月10日",
    ]);
  });

  test("日曜日は前の週、月曜日の 0 時からは次の週に数え、記録のない週は 0", () => {
    const { weeks } = summarize(
      [
        entry("2026-11-02T09:00", 60),
        entry("2026-11-08T23:59", 30),
        entry("2026-11-09T00:00", 15),
      ],
      november,
    );
    expect(weeks.map((w) => formatDuration(w.totalMs))).toEqual([
      "0分",
      "1時間30分",
      "15分",
      "0分",
      "0分",
      "0分",
    ]);
  });
});

test("週ごとの稼働日数は、その週に記録（記録中を含む）を開始した日の数で、記録のない週は 0", () => {
  const { weeks } = summarize(
    [
      entry("2026-11-02T09:00", 30),
      entry("2026-11-02T13:00", 30),
      entry("2026-11-08T09:00", 30),
      running("2026-11-20T09:00"),
    ],
    november,
  );
  expect(weeks.map((w) => w.workDays)).toEqual([0, 2, 0, 1, 0, 0]);
});

describe("プロジェクトごとの合計時間", () => {
  test("時間の長い順に並べ、プロジェクトのない記録は「プロジェクトなし」にまとめる", () => {
    const { projects } = summarize(
      [
        entry("2026-11-04T09:00", 60, meeting),
        entry("2026-11-04T10:00", 120, dev),
        entry("2026-11-05T10:00", 60, dev),
        entry("2026-11-05T13:00", 120),
      ],
      november,
    );
    expect(
      projects.map((p) => [p.project?.name ?? null, formatDuration(p.totalMs)]),
    ).toEqual([
      ["開発", "3時間0分"],
      [null, "2時間0分"],
      ["会議", "1時間0分"],
    ]);
  });

  test("プロジェクトごとの稼働日数は、そのプロジェクトの記録を開始した日の数", () => {
    const { projects } = summarize(
      [
        entry("2026-11-04T09:00", 30, dev),
        entry("2026-11-04T13:00", 30, dev),
        entry("2026-11-05T09:00", 30, dev),
        { ...running("2026-11-06T09:00"), project: dev },
        entry("2026-11-04T10:00", 30),
      ],
      november,
    );
    expect(projects.map((p) => [p.project?.name ?? null, p.workDays])).toEqual([
      ["開発", 3],
      [null, 1],
    ]);
  });

  test("表示する時間が同じなら登録順で、「プロジェクトなし」は最後", () => {
    const { projects } = summarize(
      [
        entry("2026-11-04T09:00", 60),
        entry("2026-11-04T10:00", 60.5, research),
        entry("2026-11-04T11:00", 60, meeting),
      ],
      november,
    );
    expect(projects.map((p) => p.project?.name ?? null)).toEqual([
      "会議",
      "調査",
      null,
    ]);
  });

  test("表示すると 0分 になるプロジェクトは除く", () => {
    const { projects } = summarize(
      [
        entry("2026-11-04T09:00", 60, dev),
        entry("2026-11-04T10:00", 0.5, meeting),
        { ...running("2026-11-04T11:00"), project: research },
      ],
      november,
    );
    expect(projects.map((p) => p.project?.name)).toEqual(["開発"]);
  });

  test("アーカイブしたプロジェクトも、記録に紐づいていれば含める", () => {
    // アーカイブの有無は記録のプロジェクトに含まれないため、どのプロジェクトも同じに扱う
    const archived = { id: 9, name: "旧案件", color: "brown" };
    const { projects } = summarize(
      [entry("2026-11-04T09:00", 60, archived)],
      november,
    );
    expect(projects).toEqual([
      { project: archived, totalMs: 60 * 60_000, workDays: 1 },
    ]);
  });
});
