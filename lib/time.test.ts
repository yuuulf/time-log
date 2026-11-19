// @vitest-environment node
import { afterEach, describe, expect, test } from "vitest";
import {
  addMonths,
  compareMonths,
  currentMonth,
  formatDateHeading,
  formatDuration,
  formatMonthHeading,
  formatRangeHeading,
  formatTime,
  monthRange,
  parseDateTimeLocalValue,
  parseDateValue,
  parseMonthValue,
  toDateKey,
  toDateTimeLocalValue,
  toMonthValue,
} from "./time";

// 2026-11-18 00:05:30（日本時間）= 2026-11-17 15:05:30（UTC）
const date = new Date("2026-11-17T15:05:30Z");

describe("日本時間での表示", () => {
  test("時刻", () => {
    expect(formatTime(date)).toBe("00:05");
  });

  test("日付の見出し", () => {
    expect(formatDateHeading(date)).toBe("2026年11月18日（水）");
  });

  test("日付のキーは日本時間の日付になる", () => {
    expect(toDateKey(date)).toBe("2026-11-18");
  });
});

describe("formatDuration", () => {
  test.each([
    [65 * 60_000, "1時間5分"],
    [90 * 60_000, "1時間30分"],
    [5 * 60_000, "5分"],
    [40_000, "0分"],
    [59 * 60_000 + 59_000, "59分"],
    [10 * 60 * 60_000, "10時間0分"],
  ])("%d ミリ秒は「%s」", (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected);
  });
});

describe("datetime-local の値との変換", () => {
  test("日本時間の値にする", () => {
    expect(toDateTimeLocalValue(date)).toBe("2026-11-18T00:05:30");
  });

  test("日本時間として解釈する", () => {
    expect(parseDateTimeLocalValue("2026-11-18T00:05:30")).toEqual(date);
    expect(parseDateValue("2026-10-01")).toEqual(
      new Date("2026-09-30T15:00:00Z"),
    );
    expect(monthRange({ year: 2026, month: 11 }).from).toEqual(
      new Date("2026-10-31T15:00:00Z"),
    );
    expect(currentMonth(new Date("2026-10-31T15:30:00Z")).month).toBe(11);
  });

  test("秒は省略できる", () => {
    expect(parseDateTimeLocalValue("2026-11-18T00:05")).toEqual(
      new Date("2026-11-17T15:05:00Z"),
    );
  });

  test.each([
    "",
    "2026-11-18",
    "2026/11/18 09:00",
    "2026-02-30T09:00",
    "2026-11-18T24:00",
  ])("不正な値「%s」は null", (value) => {
    expect(parseDateTimeLocalValue(value)).toBeNull();
  });
});

describe("日付の値", () => {
  test("「2026-10-01」は日本時間 0 時になる", () => {
    expect(parseDateValue("2026-10-01")).toEqual(
      new Date("2026-09-30T15:00:00Z"),
    );
  });

  test.each(["", "2026-10-1", "2026/10/01", "2026-02-30", "2026-10-01T00:00"])(
    "不正な値「%s」は null",
    (value) => {
      expect(parseDateValue(value)).toBeNull();
    },
  );
});

describe("月", () => {
  test("月の値を解釈して、同じ形に戻せる", () => {
    expect(parseMonthValue("2026-10")).toEqual({ year: 2026, month: 10 });
    expect(toMonthValue({ year: 2026, month: 1 })).toBe("2026-01");
  });

  test.each(["", "2026-13", "2026-00", "2026-1", "2026-10-01"])(
    "不正な月「%s」は null",
    (value) => {
      expect(parseMonthValue(value)).toBeNull();
    },
  );

  test("今月は日本時間で決まる", () => {
    // 2026-10-31 15:30（UTC）は日本時間で 2026-11-01 00:30
    expect(currentMonth(new Date("2026-10-31T15:30:00Z"))).toEqual({
      year: 2026,
      month: 11,
    });
  });

  test("月をずらすと年をまたぐ", () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
  });

  test("月を比べる", () => {
    expect(
      compareMonths({ year: 2026, month: 10 }, { year: 2026, month: 11 }),
    ).toBeLessThan(0);
    expect(
      compareMonths({ year: 2026, month: 11 }, { year: 2026, month: 11 }),
    ).toBe(0);
    expect(
      compareMonths({ year: 2027, month: 1 }, { year: 2026, month: 12 }),
    ).toBeGreaterThan(0);
  });

  test("月の範囲は日本時間の 1 日 0 時から翌月 1 日 0 時まで", () => {
    expect(monthRange({ year: 2026, month: 12 })).toEqual({
      from: new Date("2026-11-30T15:00:00Z"),
      to: new Date("2026-12-31T15:00:00Z"),
    });
  });

  test("見出し", () => {
    expect(formatMonthHeading({ year: 2026, month: 10 })).toBe("2026年10月");
    expect(
      formatRangeHeading(
        new Date("2026-09-30T15:00:00Z"),
        new Date("2026-10-15T14:59:59Z"),
      ),
    ).toBe("2026年10月1日〜2026年10月15日");
  });
});

describe("サーバーのタイムゾーンに依存しない", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  test.each(["UTC", "America/New_York", "Asia/Kolkata"])("TZ=%s", (tz) => {
    process.env.TZ = tz;
    expect(formatTime(date)).toBe("00:05");
    expect(toDateKey(date)).toBe("2026-11-18");
    expect(parseDateTimeLocalValue("2026-11-18T00:05:30")).toEqual(date);
    expect(parseDateValue("2026-10-01")).toEqual(
      new Date("2026-09-30T15:00:00Z"),
    );
    expect(monthRange({ year: 2026, month: 11 }).from).toEqual(
      new Date("2026-10-31T15:00:00Z"),
    );
    expect(currentMonth(new Date("2026-10-31T15:30:00Z")).month).toBe(11);
  });
});
