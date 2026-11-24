"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { CalendarDays } from "lucide-react";
import {
  dayRange,
  formatDateInput,
  parseDateInput,
  toDateKey,
  weekStart,
} from "@/lib/time";
import { isComposing } from "@/lib/keyboard";
import { fieldFocusClassName } from "./fieldStyles";
import { IconButton } from "./IconButton";
import { MonthCalendar, type MonthCalendarLabels } from "./MonthCalendar";
import { usePopover } from "./usePopover";

export type CalendarFieldLabels = MonthCalendarLabels & {
  /** カレンダーを開くボタンの名前（例: 「開始日のカレンダー」） */
  calendar: (label: string) => string;
};

type Props = {
  /** フォームで送る値の名前。値は「2026-10-01」の形（未入力なら空） */
  name: string;
  /** week は日を含む週の月曜日を値にし、週を行ごと選ぶ。day は日を値にする */
  mode: "week" | "day";
  /** 最初の値（日の 0 時。week なら週の月曜日）。未入力なら null */
  value: Date | null;
  /** 選べるいちばん後の日。week ならその日を含む週まで。省略で制限なし */
  max?: Date;
  /** 入力欄の名前（「開始日」「表示する週」など）。未入力のときは入力欄にも控えめに出す */
  label: string;
  /** フォーカスしていないときの見やすい文字（日付は「2026年10月1日」、週は期間） */
  display: (value: Date) => string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  labels: CalendarFieldLabels;
};

/**
 * 日付・週の入力欄（週の指定と期間の日付で共通）。日付を直接入力でき、右端のボタンで月のカレンダーを開く。
 * フォーカスしていないときは見やすい文字、フォーカスすると「2026/10/01」の編集できる文字にする（一覧の時刻と同じ考え方）。
 * フォーカスが外れたとき・Enter で入力を読み、読めない日付や選べない日付なら前の値に戻す（day で空にしたら未入力）。
 * Enter は読んだ値でそのままフォームを送り、Escape は入力を取り消す。値は hidden の欄で送る
 */
export function CalendarField({
  name,
  mode,
  value,
  max,
  label,
  display,
  labels,
  ...aria
}: Props) {
  const gridId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const [selected, setSelected] = useState(value);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  const toValue = (date: Date) => (mode === "week" ? weekStart(date) : date);
  const editText = (date: Date | null) => (date ? formatDateInput(date) : "");
  // 選べるいちばん後の日（week ならその週の月曜日まで）
  const tooLate = (date: Date) =>
    max !== undefined &&
    toValue(date) > (mode === "week" ? weekStart(max) : max);

  /** 入力した文字を読む。読めた値（読めなければ前の値）を返す */
  const read = (): Date | null => {
    if (text.trim() === "") return mode === "day" ? null : selected;
    const parsed = parseDateInput(text);
    if (!parsed || tooLate(parsed)) return selected;
    return toValue(parsed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isComposing(event)) return;
    if (event.key === "Enter") {
      // 送信は止めず、hidden の値を先に新しくしてから送らせる
      flushSync(() => {
        const next = read();
        setSelected(next);
        setText(editText(next));
      });
    } else if (event.key === "Escape" && !open) {
      event.preventDefault();
      setText(editText(selected));
    }
  };

  const inputValue = editing ? text : selected ? display(selected) : "";

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1" {...rootProps}>
      <input
        type="text"
        aria-label={label}
        value={inputValue}
        placeholder={
          editing ? formatDateInput(dayRange(new Date()).from) : label
        }
        autoComplete="off"
        onFocus={() => {
          setEditing(true);
          setText(editText(selected));
        }}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          setSelected(read());
          setEditing(false);
        }}
        onKeyDown={handleKeyDown}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        className={`h-10 w-full min-w-0 rounded-md border border-border bg-background pr-10 pl-3 text-sm text-foreground placeholder:text-muted aria-[invalid=true]:border-danger ${fieldFocusClassName}`}
      />
      <IconButton
        ref={triggerRef}
        icon={CalendarDays}
        label={labels.calendar(label)}
        variant="ghost"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        onClick={() => setOpen(!open)}
        className="absolute top-0 right-0"
      />
      <input
        type="hidden"
        name={name}
        value={selected ? toDateKey(selected) : ""}
      />
      {open && (
        // 週のカレンダーの列の見出し（sticky、z-30）などより手前に出す
        <div
          role="dialog"
          aria-label={labels.calendar(label)}
          className="absolute top-full left-0 z-40 mt-1 w-72 rounded-md border border-border bg-background p-3 shadow-lg"
        >
          <MonthCalendar
            id={gridId}
            mode={mode}
            selected={selected}
            initialFocus={selected ?? dayRange(new Date()).from}
            max={max}
            onSelect={(date) => {
              setSelected(toValue(date));
              close(true);
            }}
            labels={labels}
          />
        </div>
      )}
    </div>
  );
}
