// @vitest-environment node
import { afterEach, describe, expect, test } from "vitest";
import {
  formatDateHeading,
  formatDuration,
  formatTime,
  parseDateTimeLocalValue,
  toDateKey,
  toDateTimeLocalValue,
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
  });
});
