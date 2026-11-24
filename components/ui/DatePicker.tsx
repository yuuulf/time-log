"use client";

import { useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  dayRange,
  formatRangeHeading,
  parseDateValue,
  toDateKey,
} from "@/lib/time";
import { fieldFocusVisibleClassName } from "./fieldStyles";
import { MonthCalendar, type MonthCalendarLabels } from "./MonthCalendar";
import { usePopover } from "./usePopover";

type Props = {
  /** フォームで送る値の名前。値は「2026-10-01」の形（未入力なら空） */
  name: string;
  /** 最初の値（「2026-10-01」の形、未入力なら空） */
  defaultValue: string;
  /** 入力欄の名前（「開始日」など）。未入力のときは入力欄にもこの文字を控えめに出す */
  label: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  labels: MonthCalendarLabels;
};

/** 日付を「2026年10月1日」の形にする */
function formatDay(date: Date): string {
  return formatRangeHeading(date, date).split("〜")[0];
}

/**
 * 日付を選ぶ入力欄（週の指定と同じ見た目の月のカレンダー）。入力欄の見た目のボタンに日付を出し、
 * 押すと月曜日始まりの月のカレンダーを開く。日を選ぶとその日を入れて閉じる。値は hidden の欄で送る
 */
export function DatePicker({
  name,
  defaultValue,
  label,
  labels,
  ...aria
}: Props) {
  const gridId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const [selected, setSelected] = useState(() => parseDateValue(defaultValue));
  const text = selected ? formatDay(selected) : null;

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1" {...rootProps}>
      <button
        ref={triggerRef}
        type="button"
        // 誤りの状態（aria-invalid）を伝えられるよう、WAI-ARIA の日付選びの形にならって combobox にする
        role="combobox"
        aria-label={text ? `${label}：${text}` : label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2 text-left text-sm aria-[invalid=true]:border-danger ${fieldFocusVisibleClassName}`}
      >
        <CalendarDays
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
        <span className={`truncate ${text ? "text-foreground" : "text-muted"}`}>
          {text ?? label}
        </span>
      </button>
      <input
        type="hidden"
        name={name}
        value={selected ? toDateKey(selected) : ""}
      />
      {open && (
        // 週のカレンダーの列の見出し（sticky、z-30）などより手前に出す
        <div
          role="dialog"
          aria-label={label}
          className="absolute top-full left-0 z-40 mt-1 w-72 rounded-md border border-border bg-background p-3 shadow-lg"
        >
          <MonthCalendar
            id={gridId}
            mode="day"
            selected={selected}
            initialFocus={selected ?? dayRange(new Date()).from}
            onSelect={(date) => {
              setSelected(date);
              close(true);
            }}
            labels={labels}
          />
        </div>
      )}
    </div>
  );
}
