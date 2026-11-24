"use client";

import { useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import { DAY_MS, formatRangeHeading, toDateKey, weekStart } from "@/lib/time";
import { fieldFocusVisibleClassName } from "./fieldStyles";
import { MonthCalendar, type MonthCalendarLabels } from "./MonthCalendar";
import { usePopover } from "./usePopover";

type Props = {
  /** フォームで送る値の名前。値は週の月曜日（「2026-11-16」） */
  name: string;
  /** 最初に選んでいる週の月曜日（日本時間の 0 時） */
  value: Date;
  /** 選べるいちばん後の週の月曜日（今週）。これより先の週の日は選べない */
  maxWeek: Date;
  labels: MonthCalendarLabels & {
    /** ボタンの読み上げ名に使う（例: 「表示する週」） */
    label: string;
  };
};

/**
 * 週を選ぶ入力欄。入力欄の見た目のボタンに週の期間を出し、押すと月曜日始まりの月のカレンダーを開く。
 * ポインタを合わせた週と選んでいる週を行ごと強調し、日を選ぶとその日を含む週を選んで閉じる。
 * 矢印キーで日を移り（上下は 1 週）、Enter で選び、Escape で閉じる。値は hidden の欄で送る
 */
export function WeekPicker({ name, value, maxWeek, labels }: Props) {
  const gridId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const [selected, setSelected] = useState(value);
  const rangeText = formatRangeHeading(
    selected,
    new Date(selected.getTime() + 6 * DAY_MS),
  );

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1" {...rootProps}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${labels.label}：${rangeText}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-sm text-foreground ${fieldFocusVisibleClassName}`}
      >
        <CalendarDays
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
        <span className="truncate">{rangeText}</span>
      </button>
      <input type="hidden" name={name} value={toDateKey(selected)} />
      {open && (
        // 週のカレンダーの列の見出し（sticky、z-30）より手前に出す
        <div
          role="dialog"
          aria-label={labels.label}
          className="absolute top-full left-0 z-40 mt-1 w-72 rounded-md border border-border bg-background p-3 shadow-lg"
        >
          <MonthCalendar
            id={gridId}
            mode="week"
            selected={selected}
            initialFocus={selected}
            max={maxWeek}
            onSelect={(date) => {
              setSelected(weekStart(date));
              close(true);
            }}
            labels={labels}
          />
        </div>
      )}
    </div>
  );
}
