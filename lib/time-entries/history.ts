import { messages } from "@/lib/messages";
import {
  addMonths,
  compareMonths,
  currentMonth,
  formatMonthHeading,
  formatRangeHeading,
  monthRange,
  parseDateValue,
  parseMonthValue,
  toMonthValue,
  type YearMonth,
} from "@/lib/time";

/** 期間に指定できる最大の日数（開始日と終了日を含む） */
export const MAX_RANGE_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ページの URL のクエリ（Next.js の searchParams） */
export type HistorySearchParams = Record<string, string | string[] | undefined>;

/** 読み込む範囲。from 以降、to より前（to は含まない）に開始した記録 */
export type DateRange = { from: Date; to: Date };

/** 「過去の記録」ページで表示する内容 */
export type HistoryView =
  | {
      mode: "month";
      heading: string;
      range: DateRange;
      /** 表示中の月の値（「2026-11」） */
      month: string;
      /** 前の月の値（「2026-10」） */
      prevMonth: string;
      /** 次の月の値。今月なら null */
      nextMonth: string | null;
    }
  | {
      mode: "range";
      heading: string;
      range: DateRange;
      /** 入力欄に戻す値 */
      values: { from: string; to: string };
    }
  | {
      mode: "rangeError";
      error: string;
      values: { from: string; to: string };
    };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * URL のクエリから表示する内容を決める。
 * from か to があれば期間の表示、なければ month の月（不正または今月より先なら今月）の表示にする。
 */
export function resolveHistoryQuery(
  params: HistorySearchParams,
  now: Date,
): HistoryView {
  const from = first(params.from);
  const to = first(params.to);
  if (from !== undefined || to !== undefined) {
    return resolveRange(from ?? "", to ?? "");
  }
  return resolveMonth(first(params.month), currentMonth(now));
}

function resolveMonth(
  value: string | undefined,
  thisMonth: YearMonth,
): HistoryView {
  const parsed = value ? parseMonthValue(value) : null;
  const month =
    parsed && compareMonths(parsed, thisMonth) <= 0 ? parsed : thisMonth;
  const isThisMonth = compareMonths(month, thisMonth) === 0;
  return {
    mode: "month",
    heading: formatMonthHeading(month),
    range: monthRange(month),
    month: toMonthValue(month),
    prevMonth: toMonthValue(addMonths(month, -1)),
    nextMonth: isThisMonth ? null : toMonthValue(addMonths(month, 1)),
  };
}

function resolveRange(from: string, to: string): HistoryView {
  const values = { from, to };
  const errors = messages.history.errors;
  const firstDay = parseDateValue(from);
  const lastDay = parseDateValue(to);
  if (!firstDay || !lastDay) {
    return { mode: "rangeError", error: errors.dateRequired, values };
  }
  if (lastDay < firstDay) {
    return { mode: "rangeError", error: errors.endBeforeStart, values };
  }
  // 日本時間には夏時間がないため、1 日はいつも 24 時間
  const days = (lastDay.getTime() - firstDay.getTime()) / DAY_MS + 1;
  if (days > MAX_RANGE_DAYS) {
    return { mode: "rangeError", error: errors.rangeTooLong, values };
  }
  return {
    mode: "range",
    heading: formatRangeHeading(firstDay, lastDay),
    range: { from: firstDay, to: new Date(lastDay.getTime() + DAY_MS) },
    values,
  };
}
