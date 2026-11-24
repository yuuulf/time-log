import { messages } from "@/lib/messages";
import { entryDurationMs, toDateTimeLocalValue } from "@/lib/time";

const MINUTE_MS = 60 * 1000;

/** Excel が UTF-8 として読むよう先頭に付ける BOM */
const BOM = "﻿";
const CRLF = "\r\n";

/** CSV に出す記録 */
export type CsvEntry = {
  taskName: string;
  startedAt: Date;
  /** 記録中なら null */
  endedAt: Date | null;
  project: { name: string } | null;
};

/** カンマ・ダブルクォート・改行を含む値はダブルクォートで囲み、中のダブルクォートを重ねる（RFC 4180） */
function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** 日本時間の日付（「2026-11-18」）と時刻（「09:05:30」） */
function dateAndTime(date: Date): [string, string] {
  const [day, time] = toDateTimeLocalValue(date).split("T");
  return [day, time];
}

function toRow(entry: CsvEntry): string[] {
  const [day, startTime] = dateAndTime(entry.startedAt);
  return [
    day,
    startTime,
    entry.endedAt ? dateAndTime(entry.endedAt)[1] : "",
    entry.endedAt ? String(entryDurationMs(entry) / MINUTE_MS) : "",
    entry.taskName,
    entry.project?.name ?? "",
  ];
}

/**
 * 記録の CSV（BOM 付き、改行は CRLF）を作る。1 行目は列名、2 行目から記録 1 件を 1 行として古い順に並べる。
 * entries は開始時刻の新しい順（記録の一覧と同じ並び）で受け取る
 */
export function toEntriesCsv(entries: CsvEntry[]): string {
  const rows = [
    messages.history.csv.columns,
    ...entries.toReversed().map(toRow),
  ];
  return (
    BOM + rows.map((row) => row.map(escapeField).join(",") + CRLF).join("")
  );
}
