"use client";

import { formatRangeHeading, parseDateValue } from "@/lib/time";
import { CalendarField, type CalendarFieldLabels } from "./CalendarField";

type Props = {
  /** フォームで送る値の名前。値は「2026-10-01」の形（未入力なら空） */
  name: string;
  /** 最初の値（「2026-10-01」の形、未入力なら空） */
  defaultValue: string;
  /** 入力欄の名前（「開始日」など）。未入力のときは入力欄にも控えめに出す */
  label: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  labels: CalendarFieldLabels;
};

/** 日付を「2026年10月1日」の形にする */
const dayText = (date: Date) => formatRangeHeading(date, date).split("〜")[0];

/**
 * 日付を選ぶ入力欄（週の指定と同じ見た目）。日付を直接入力でき、右端のボタンで月のカレンダーを開く
 */
export function DatePicker({
  name,
  defaultValue,
  label,
  labels,
  ...aria
}: Props) {
  return (
    <CalendarField
      name={name}
      mode="day"
      value={parseDateValue(defaultValue)}
      label={label}
      display={dayText}
      labels={labels}
      {...aria}
    />
  );
}
