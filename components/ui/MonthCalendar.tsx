"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DAY_MS,
  addMonths,
  calendarWeeks,
  compareMonths,
  currentMonth,
  dayOfMonth,
  formatDateHeading,
  formatMonthHeading,
  toDateKey,
  weekStart,
  type YearMonth,
} from "@/lib/time";
import { IconButton } from "./IconButton";

export type MonthCalendarLabels = {
  prevMonth: string;
  nextMonth: string;
  /** 月曜日始まりの曜日の見出し */
  weekdays: readonly string[];
};

type Props = {
  /** week は週を行ごとに強調して選ぶ、day は日を選ぶ */
  mode: "week" | "day";
  /** 選んでいる日（week なら週の月曜日）の 0 時。未選択なら null */
  selected: Date | null;
  /** 最初にフォーカスする日（開いたときに見せる月もこの日の月）。省略時は selected か今日 */
  initialFocus: Date;
  /** 選べるいちばん後の日。week ならその日を含む週まで選べる。省略で制限なし */
  max?: Date;
  /** 日を選んだときに呼ぶ（week でもその日を渡す） */
  onSelect: (date: Date) => void;
  /** 月のカレンダーの id（開くボタンの aria-controls に使う） */
  id?: string;
  labels: MonthCalendarLabels;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

/**
 * 月曜日始まりの月のカレンダー（週の指定・期間の日付で共通）。
 * week では、ポインタを合わせた週と選んでいる週を行ごと強調する。day では日ごとに強調する。
 * 「前の月」「次の月」で月を切り替え、矢印キーで日を移る（上下は 1 週。月の外に出たら月を切り替える）。
 * 開いたら（描いたら）フォーカスする日にフォーカスを移す
 */
export function MonthCalendar({
  mode,
  selected,
  initialFocus,
  max,
  onSelect,
  id,
  labels,
}: Props) {
  const [focusDate, setFocusDate] = useState(initialFocus);
  const [month, setMonth] = useState<YearMonth>(currentMonth(initialFocus));
  const gridRef = useRef<HTMLDivElement>(null);
  // 選べるいちばん後の日。week ならその週の日曜日まで
  const lastSelectable =
    max && (mode === "week" ? addDays(weekStart(max), 6) : max);
  const maxMonth = lastSelectable ? currentMonth(lastSelectable) : null;
  const selectable = (date: Date) => !lastSelectable || date <= lastSelectable;

  useEffect(() => {
    gridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-date="${toDateKey(focusDate)}"]`,
      )
      ?.focus();
  }, [focusDate, month]);

  /** 日を移る。選べない日には移らない。月の外に出たら月を切り替える */
  const moveFocus = (date: Date) => {
    if (!selectable(date)) return;
    setFocusDate(date);
    setMonth(currentMonth(date));
  };

  const handleKeyDown = (event: KeyboardEvent, date: Date) => {
    const step = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    moveFocus(addDays(date, step));
  };

  const selectedKey = selected ? toDateKey(selected) : null;
  const focusKey = toDateKey(focusDate);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <IconButton
          icon={ChevronLeft}
          label={labels.prevMonth}
          variant="ghost"
          onClick={() => setMonth(addMonths(month, -1))}
        />
        <p className="text-sm font-medium text-foreground">
          {formatMonthHeading(month)}
        </p>
        <IconButton
          icon={ChevronRight}
          label={labels.nextMonth}
          variant="ghost"
          disabled={maxMonth !== null && compareMonths(month, maxMonth) >= 0}
          onClick={() => setMonth(addMonths(month, 1))}
        />
      </div>
      <div
        id={id}
        ref={gridRef}
        role="grid"
        aria-label={formatMonthHeading(month)}
        className="space-y-0.5 text-center text-sm"
      >
        <div role="row" className="flex">
          {labels.weekdays.map((weekday) => (
            <div
              key={weekday}
              role="columnheader"
              className="flex-1 py-1 text-xs text-muted"
            >
              {weekday}
            </div>
          ))}
        </div>
        {calendarWeeks(month).map((week) => {
          const weekKey = toDateKey(week[0]);
          const weekSelected = mode === "week" && weekKey === selectedKey;
          const weekSelectable = selectable(week[0]);
          return (
            <div
              key={weekKey}
              role="row"
              data-week={weekKey}
              aria-selected={mode === "week" ? weekSelected : undefined}
              className={`flex rounded-md ${
                mode !== "week"
                  ? ""
                  : weekSelected
                    ? "bg-primary/15"
                    : weekSelectable
                      ? "hover:bg-border/40"
                      : ""
              }`}
            >
              {week.map((date) => {
                const key = toDateKey(date);
                const inMonth = compareMonths(currentMonth(date), month) === 0;
                const daySelected = mode === "day" && key === selectedKey;
                return (
                  <div
                    key={key}
                    role="gridcell"
                    aria-selected={mode === "day" ? daySelected : undefined}
                    className="flex-1"
                  >
                    <button
                      type="button"
                      data-date={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      disabled={!selectable(date)}
                      aria-label={formatDateHeading(date)}
                      onClick={() => onSelect(date)}
                      onKeyDown={(event) => handleKeyDown(event, date)}
                      className={`h-8 w-full rounded-md tabular-nums focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
                        daySelected
                          ? "bg-primary text-primary-foreground"
                          : `${inMonth ? "text-foreground" : "text-muted"} ${
                              mode === "day" ? "hover:bg-border/40" : ""
                            }`
                      }`}
                    >
                      {dayOfMonth(date)}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
