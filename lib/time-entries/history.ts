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
  toDateKey,
  toMonthValue,
  weekStart,
  type YearMonth,
} from "@/lib/time";
import type { TodayView } from "./today-view";

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

/** 「過去の記録」の週のカレンダーで表示する内容 */
export type WeekView = {
  mode: "week";
  /** 週の期間（「2026年11月16日〜2026年11月22日」） */
  heading: string;
  range: DateRange;
  /** 表示中の週の月曜日の値（「2026-11-16」） */
  week: string;
  /** 前の週の月曜日の値 */
  prevWeek: string;
  /** 次の週の月曜日の値。今週なら null */
  nextWeek: string | null;
  /** 月曜日〜日曜日の各日の 0 時（日本時間） */
  days: Date[];
};

/** 「過去の記録」ページで表示する内容（一覧の月・期間か、週のカレンダー） */
export type HistoryPageView = HistoryView | WeekView;

/** 月曜日 weekFirst の週の表示を作る */
function weekView(weekFirst: Date, thisWeek: Date): WeekView {
  const days = Array.from(
    { length: 7 },
    (_, i) => new Date(weekFirst.getTime() + i * DAY_MS),
  );
  const isThisWeek = weekFirst.getTime() === thisWeek.getTime();
  return {
    mode: "week",
    heading: formatRangeHeading(days[0], days[6]),
    range: { from: weekFirst, to: new Date(weekFirst.getTime() + 7 * DAY_MS) },
    week: toDateKey(weekFirst),
    prevWeek: toDateKey(new Date(weekFirst.getTime() - 7 * DAY_MS)),
    nextWeek: isThisWeek
      ? null
      : toDateKey(new Date(weekFirst.getTime() + 7 * DAY_MS)),
    days,
  };
}

/** 週の値（日付）から週の表示を作る。正しくない日付や今週より先なら今週、月曜日でなければその日を含む週 */
function resolveWeek(value: string | undefined, now: Date): WeekView {
  const thisWeek = weekStart(now);
  const parsed = value ? parseDateValue(value) : null;
  const first = parsed ? weekStart(parsed) : thisWeek;
  return weekView(first > thisWeek ? thisWeek : first, thisWeek);
}

/**
 * 「過去の記録」ページの URL のクエリと、覚えている表示（Cookie）から表示する内容を決める。
 * from・to があれば期間、week があれば週、month があれば月を表示する。
 * どれもなければ、覚えている表示がカレンダー（timeline）なら今週、それ以外は今月
 */
export function resolveHistoryPageQuery(
  params: HistorySearchParams,
  now: Date,
  preferred: TodayView,
): HistoryPageView {
  const hasRange =
    first(params.from) !== undefined || first(params.to) !== undefined;
  const week = first(params.week);
  if (!hasRange && week !== undefined) return resolveWeek(week, now);
  if (
    !hasRange &&
    first(params.month) === undefined &&
    preferred === "timeline"
  ) {
    return resolveWeek(undefined, now);
  }
  return resolveHistoryQuery(params, now);
}

/**
 * 表示の切り替えの行き先。一覧からカレンダーへは、表示中の月・期間の最後の日を含む週（今週より先なら今週。
 * 範囲の誤りなら今週）。カレンダーから一覧へは、表示中の週の月曜日を含む月
 */
export function historySwitchHrefs(
  view: HistoryPageView,
  now: Date,
): Record<TodayView, string> {
  if (view.mode === "week") {
    return {
      list: `/history?month=${view.week.slice(0, 7)}`,
      timeline: `/history?week=${view.week}`,
    };
  }
  const listHref =
    view.mode === "month"
      ? `/history?month=${view.month}`
      : `/history?${new URLSearchParams(view.values)}`;
  const lastDay =
    view.mode === "rangeError"
      ? now
      : new Date(view.range.to.getTime() - DAY_MS);
  const thisWeek = weekStart(now);
  const target = weekStart(lastDay);
  return {
    list: listHref,
    timeline: `/history?week=${toDateKey(target > thisWeek ? thisWeek : target)}`,
  };
}
