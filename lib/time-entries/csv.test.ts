// @vitest-environment node
import { expect, test } from "vitest";
import { toEntriesCsv, type CsvEntry } from "./csv";

const at = (date: string, time: string) => new Date(`${date}T${time}+09:00`);
const HEADER = "日付,開始時刻,終了時刻,作業時間（分）,タスク名,プロジェクト";

/** BOM を外して行に分ける（最後の CRLF の後の空文字は除く） */
function lines(csv: string): string[] {
  return csv.slice(1).split("\r\n").slice(0, -1);
}

const entry = (values: Partial<CsvEntry>): CsvEntry => ({
  taskName: "資料作成",
  startedAt: at("2026-11-18", "09:00:00"),
  endedAt: at("2026-11-18", "10:05:30"),
  project: null,
  ...values,
});

test("BOM を付け、1 行目に列名を並べ、各行を CRLF で終える", () => {
  const csv = toEntriesCsv([entry({})]);

  expect(csv.startsWith("﻿")).toBe(true);
  expect(csv.endsWith("\r\n")).toBe(true);
  expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
  expect(lines(csv)[0]).toBe(HEADER);
});

test("記録の行は日付・時刻を日本時間で、作業時間を分に切り捨てた整数で出す", () => {
  const csv = toEntriesCsv([entry({ project: { name: "社内ツール" } })]);

  expect(lines(csv)[1]).toBe(
    "2026-11-18,09:00:00,10:05:30,65,資料作成,社内ツール",
  );
});

test("新しい順で受け取った記録を古い順に並べる", () => {
  const csv = toEntriesCsv([
    entry({
      taskName: "新しい",
      startedAt: at("2026-11-18", "09:00:00"),
      endedAt: at("2026-11-18", "09:30:00"),
    }),
    entry({
      taskName: "古い",
      startedAt: at("2026-11-17", "09:00:00"),
      endedAt: at("2026-11-17", "09:30:00"),
    }),
  ]);

  expect(lines(csv).slice(1)).toEqual([
    "2026-11-17,09:00:00,09:30:00,30,古い,",
    "2026-11-18,09:00:00,09:30:00,30,新しい,",
  ]);
});

test("記録中の記録は終了時刻と作業時間を空にする", () => {
  const csv = toEntriesCsv([
    entry({
      taskName: "打ち合わせ",
      startedAt: at("2026-11-18", "13:00:00"),
      endedAt: null,
    }),
  ]);

  expect(lines(csv)[1]).toBe("2026-11-18,13:00:00,,,打ち合わせ,");
});

test("タスク名とプロジェクトがない記録はその列を空にする", () => {
  const csv = toEntriesCsv([entry({ taskName: "" })]);

  expect(lines(csv)[1]).toBe("2026-11-18,09:00:00,10:05:30,65,,");
});

test("カンマ・ダブルクォート・改行を含む値はダブルクォートで囲む", () => {
  const csv = toEntriesCsv([
    entry({
      taskName: 'A社, "見積"',
      project: { name: "行1\n行2" },
    }),
  ]);

  expect(csv).toContain(',"A社, ""見積""","行1\n行2"\r\n');
});

test("記録がないときは列名の行だけにする", () => {
  expect(toEntriesCsv([])).toBe(`﻿${HEADER}\r\n`);
});
