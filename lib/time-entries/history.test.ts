// @vitest-environment node
import { describe, expect, test } from "vitest";
import { messages } from "@/lib/messages";
import {
  historySwitchHrefs,
  resolveHistoryPageQuery,
  resolveHistoryQuery,
} from "./history";
import type { TodayView } from "./today-view";

const errors = messages.history.errors;
// 日本時間 2026-11-18 12:00
const now = new Date("2026-11-18T12:00:00+09:00");
const jst = (value: string) => new Date(`${value}+09:00`);

describe("月の表示", () => {
  test("月の指定がなければ今月を表示し、次の月はない", () => {
    expect(resolveHistoryQuery({}, now)).toEqual({
      mode: "month",
      heading: "2026年11月",
      range: {
        from: jst("2026-11-01T00:00:00"),
        to: jst("2026-12-01T00:00:00"),
      },
      month: "2026-11",
      prevMonth: "2026-10",
      nextMonth: null,
    });
  });

  test("前の月を指定すると、その月と前後の月を返す", () => {
    expect(resolveHistoryQuery({ month: "2026-01" }, now)).toEqual({
      mode: "month",
      heading: "2026年1月",
      range: {
        from: jst("2026-01-01T00:00:00"),
        to: jst("2026-02-01T00:00:00"),
      },
      month: "2026-01",
      prevMonth: "2025-12",
      nextMonth: "2026-02",
    });
  });

  test("先月を表示すると、次の月は今月になる", () => {
    const view = resolveHistoryQuery({ month: "2026-10" }, now);
    expect(view).toMatchObject({ heading: "2026年10月", nextMonth: "2026-11" });
  });

  test.each(["2026-13", "2026-12", "2027-01", "abc", ""])(
    "不正な月や今月より先の月「%s」は今月を表示する",
    (month) => {
      expect(resolveHistoryQuery({ month }, now)).toMatchObject({
        mode: "month",
        heading: "2026年11月",
        nextMonth: null,
      });
    },
  );

  test("同じキーが複数あれば最初の値を使う", () => {
    expect(
      resolveHistoryQuery({ month: ["2026-10", "2026-09"] }, now),
    ).toMatchObject({ heading: "2026年10月" });
  });
});

describe("期間の表示", () => {
  test("開始日の 0 時から終了日の翌日 0 時の前までを読む", () => {
    expect(
      resolveHistoryQuery({ from: "2026-10-01", to: "2026-10-15" }, now),
    ).toEqual({
      mode: "range",
      heading: "2026年10月1日〜2026年10月15日",
      range: {
        from: jst("2026-10-01T00:00:00"),
        to: jst("2026-10-16T00:00:00"),
      },
      values: { from: "2026-10-01", to: "2026-10-15" },
    });
  });

  test("1 日だけを指定できる", () => {
    expect(
      resolveHistoryQuery({ from: "2026-10-01", to: "2026-10-01" }, now),
    ).toMatchObject({
      mode: "range",
      heading: "2026年10月1日〜2026年10月1日",
      range: {
        from: jst("2026-10-01T00:00:00"),
        to: jst("2026-10-02T00:00:00"),
      },
    });
  });

  test("期間の指定は月の指定より優先する", () => {
    expect(
      resolveHistoryQuery(
        { month: "2026-09", from: "2026-10-01", to: "2026-10-01" },
        now,
      ),
    ).toMatchObject({ mode: "range" });
  });

  test("366 日（両端を含む）までは表示する", () => {
    // 2025-10-02 〜 2026-10-02 は 366 日
    expect(
      resolveHistoryQuery({ from: "2025-10-02", to: "2026-10-02" }, now),
    ).toMatchObject({ mode: "range" });
  });

  test("367 日以上は表示しない", () => {
    expect(
      resolveHistoryQuery({ from: "2025-10-01", to: "2026-10-02" }, now),
    ).toEqual({
      mode: "rangeError",
      error: errors.rangeTooLong,
      values: { from: "2025-10-01", to: "2026-10-02" },
    });
  });

  test("終了日が開始日より前なら表示しない", () => {
    expect(
      resolveHistoryQuery({ from: "2026-10-15", to: "2026-10-01" }, now),
    ).toMatchObject({ mode: "rangeError", error: errors.endBeforeStart });
  });

  test.each([
    { from: "", to: "2026-10-01" },
    { from: "2026-10-01" },
    { to: "2026-10-01" },
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "2026/10/01", to: "2026-10-02" },
  ])("日付が空・不正なら表示しない（%o）", (params) => {
    expect(resolveHistoryQuery(params, now)).toEqual({
      mode: "rangeError",
      error: errors.dateRequired,
      values: { from: params.from ?? "", to: params.to ?? "" },
    });
  });
});

describe("過去の記録ページの表示（週のカレンダー）", () => {
  // 日本時間 2026-11-24（火）15:00。今週は 11月23日〜29日
  const today = jst("2026-11-24T15:00:00");
  const week = (
    params: Record<string, string>,
    preferred: TodayView = "list",
  ) => resolveHistoryPageQuery(params, today, preferred);

  test("週を指定すると、その週の見出し・範囲・前後の週・各日を返す", () => {
    expect(week({ week: "2026-11-16" })).toEqual({
      mode: "week",
      heading: "2026年11月16日〜2026年11月22日",
      range: {
        from: jst("2026-11-16T00:00:00"),
        to: jst("2026-11-23T00:00:00"),
      },
      week: "2026-11-16",
      prevWeek: "2026-11-09",
      nextWeek: "2026-11-23",
      days: [16, 17, 18, 19, 20, 21, 22].map((d) =>
        jst(`2026-11-${d}T00:00:00`),
      ),
    });
  });

  test("今週は次の週がない", () => {
    expect(week({ week: "2026-11-23" })).toMatchObject({
      week: "2026-11-23",
      nextWeek: null,
    });
  });

  test("月曜日でない日付は、その日を含む週", () => {
    expect(week({ week: "2026-11-19" })).toMatchObject({ week: "2026-11-16" });
  });

  test("月をまたぐ週の見出し", () => {
    expect(week({ week: "2026-10-26" })).toMatchObject({
      heading: "2026年10月26日〜2026年11月1日",
    });
  });

  test.each([["2026-13-01"], ["abc"], [""], ["2026-11-30"], ["2027-01-04"]])(
    "正しくない日付・今週より先（%j）は今週",
    (value) => {
      expect(week({ week: value })).toMatchObject({ week: "2026-11-23" });
    },
  );

  test("指定がなく、覚えている表示がカレンダーなら今週", () => {
    expect(week({}, "timeline")).toMatchObject({
      mode: "week",
      week: "2026-11-23",
    });
  });

  test("指定がなく、覚えている表示が一覧なら今月", () => {
    expect(week({})).toMatchObject({ mode: "month", month: "2026-11" });
  });

  test("月の指定は、覚えている表示がカレンダーでも月", () => {
    expect(week({ month: "2026-10" }, "timeline")).toMatchObject({
      mode: "month",
      month: "2026-10",
    });
  });

  test("期間の指定は週の指定より優先する", () => {
    expect(
      week({ week: "2026-11-16", from: "2026-10-01", to: "2026-10-15" }),
    ).toMatchObject({ mode: "range" });
  });
});

describe("表示の切り替えの行き先", () => {
  const today = jst("2026-11-24T15:00:00");
  const hrefs = (
    params: Record<string, string>,
    preferred: TodayView = "list",
  ) =>
    historySwitchHrefs(
      resolveHistoryPageQuery(params, today, preferred),
      today,
    );

  test("過去の月からカレンダーへは、その月の最後の日を含む週", () => {
    expect(hrefs({ month: "2026-10" })).toEqual({
      list: "/history?month=2026-10",
      timeline: "/history?week=2026-10-26",
    });
  });

  test("今月からカレンダーへは今週（最後の日が今週より先）", () => {
    expect(hrefs({}).timeline).toBe("/history?week=2026-11-23");
  });

  test("期間からカレンダーへは、期間の最後の日を含む週", () => {
    expect(hrefs({ from: "2026-10-01", to: "2026-10-15" })).toEqual({
      list: "/history?from=2026-10-01&to=2026-10-15",
      timeline: "/history?week=2026-10-12",
    });
  });

  test("期間の入力に誤りがあるときのカレンダーは今週", () => {
    expect(hrefs({ from: "2026-10-15", to: "2026-10-01" }).timeline).toBe(
      "/history?week=2026-11-23",
    );
  });

  test("週から一覧へは、週の月曜日を含む月", () => {
    expect(hrefs({ week: "2026-10-26" })).toEqual({
      list: "/history?month=2026-10",
      timeline: "/history?week=2026-10-26",
    });
  });
});
