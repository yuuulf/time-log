"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DAY_MS,
  addMonths,
  calendarWeeks,
  compareMonths,
  currentMonth,
  dayOfMonth,
  formatDateHeading,
  formatMonthHeading,
  formatRangeHeading,
  toDateKey,
  weekStart,
  type YearMonth,
} from "@/lib/time";
import { fieldFocusVisibleClassName } from "./fieldStyles";
import { IconButton } from "./IconButton";
import { usePopover } from "./usePopover";

type Props = {
  /** フォームで送る値の名前。値は週の月曜日（「2026-11-16」） */
  name: string;
  /** 最初に選んでいる週の月曜日（日本時間の 0 時） */
  value: Date;
  /** 選べるいちばん後の週の月曜日（今週）。これより先の週の日は選べない */
  maxWeek: Date;
  labels: {
    /** ボタンの読み上げ名に使う（例: 「表示する週」） */
    label: string;
    prevMonth: string;
    nextMonth: string;
    /** 月曜日始まりの曜日の見出し */
    weekdays: readonly string[];
  };
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

/**
 * 週を選ぶ入力欄。入力欄の見た目のボタンに週の期間を出し、押すと月曜日始まりの月のカレンダーを開く。
 * ポインタを合わせた週と選んでいる週を行ごと強調し、日を選ぶとその日を含む週を選んで閉じる。
 * 矢印キーで日を移り（上下は 1 週）、Enter で選び、Escape で閉じる。値は hidden の欄で送る
 */
export function WeekPicker({ name, value, maxWeek, labels }: Props) {
  const gridId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const [selected, setSelected] = useState(value);
  const [focusDate, setFocusDate] = useState(value);
  const [month, setMonth] = useState<YearMonth>(currentMonth(value));
  const gridRef = useRef<HTMLDivElement>(null);
  const maxMonth = currentMonth(addDays(maxWeek, 6));
  const rangeText = formatRangeHeading(selected, addDays(selected, 6));

  // 開いたら（また、キーボードで日を移ったら）フォーカスする日にフォーカスを移す
  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-date="${toDateKey(focusDate)}"]`,
      )
      ?.focus();
  }, [open, focusDate, month]);

  const openPicker = () => {
    setFocusDate(selected);
    setMonth(currentMonth(selected));
    setOpen(true);
  };

  const select = (date: Date) => {
    setSelected(weekStart(date));
    close(true);
  };

  /** 日を移る。今週より先の週には移らない。月の外に出たら月を切り替える */
  const moveFocus = (date: Date) => {
    if (weekStart(date) > maxWeek) return;
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

  const selectedKey = toDateKey(selected);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1" {...rootProps}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${labels.label}：${rangeText}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        onClick={() => (open ? close() : openPicker())}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-sm text-foreground ${fieldFocusVisibleClassName}`}
      >
        <CalendarDays
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
        <span className="truncate">{rangeText}</span>
      </button>
      <input type="hidden" name={name} value={selectedKey} />
      {open && (
        <div
          role="dialog"
          aria-label={labels.label}
          className="absolute top-full left-0 z-20 mt-1 w-72 rounded-md border border-border bg-background p-3 shadow-lg"
        >
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
              disabled={compareMonths(month, maxMonth) >= 0}
              onClick={() => setMonth(addMonths(month, 1))}
            />
          </div>
          <div
            id={gridId}
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
              const isSelected = weekKey === selectedKey;
              const selectable = week[0] <= maxWeek;
              return (
                <div
                  key={weekKey}
                  role="row"
                  data-week={weekKey}
                  aria-selected={isSelected}
                  className={`flex rounded-md ${
                    isSelected
                      ? "bg-primary/15"
                      : selectable
                        ? "hover:bg-border/40"
                        : ""
                  }`}
                >
                  {week.map((date) => {
                    const key = toDateKey(date);
                    const inMonth =
                      compareMonths(currentMonth(date), month) === 0;
                    return (
                      <div key={key} role="gridcell" className="flex-1">
                        <button
                          type="button"
                          data-date={key}
                          tabIndex={key === toDateKey(focusDate) ? 0 : -1}
                          disabled={!selectable}
                          aria-label={formatDateHeading(date)}
                          onClick={() => select(date)}
                          onKeyDown={(event) => handleKeyDown(event, date)}
                          className={`h-8 w-full rounded-md tabular-nums focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
                            inMonth ? "text-foreground" : "text-muted"
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
      )}
    </div>
  );
}
