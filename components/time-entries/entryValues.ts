import { parseDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/time";
import type { EntryItemData } from "./EntryItem";

/** 記録の修正でその場で編集する欄（一覧の行とタイムラインの入力欄で共通） */
export type Field = "taskName" | "startedAt" | "endedAt";
export type Values = Record<Field, string>;

export const FIELDS: Field[] = ["taskName", "startedAt", "endedAt"];

/** 保存済みの記録から、入力欄の値を作る */
export function toValues(
  entry: Pick<EntryItemData, "taskName" | "startedAt" | "endedAt">,
): Values {
  return {
    taskName: entry.taskName,
    startedAt: toDateTimeLocalValue(entry.startedAt),
    endedAt: entry.endedAt ? toDateTimeLocalValue(entry.endedAt) : "",
  };
}

/**
 * 2 つの入力値が同じかどうか。時刻はブラウザが秒の 0 を省くことがあるので、日時として比べる
 */
export function sameValue(field: Field, a: string, b: string): boolean {
  if (field === "taskName" || a === b) return a === b;
  const left = parseDateTimeLocalValue(a);
  const right = parseDateTimeLocalValue(b);
  return left !== null && right !== null && left.getTime() === right.getTime();
}
