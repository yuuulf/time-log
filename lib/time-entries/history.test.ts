// @vitest-environment node
import { describe, expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { resolveHistoryQuery } from "./history";

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
