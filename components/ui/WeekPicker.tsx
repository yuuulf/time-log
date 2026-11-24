"use client";

import { DAY_MS, formatRangeHeading } from "@/lib/time";
import { CalendarField, type CalendarFieldLabels } from "./CalendarField";

type Props = {
  /** フォームで送る値の名前。値は週の月曜日（「2026-11-16」） */
  name: string;
  /** 最初に選んでいる週の月曜日（日本時間の 0 時） */
  value: Date;
  /** 選べるいちばん後の週の月曜日（今週）。これより先の週は選べない */
  maxWeek: Date;
  labels: CalendarFieldLabels & {
    /** 入力欄の名前（例: 「週の指定」） */
    label: string;
  };
};

/** 週の期間（「2026年11月16日〜2026年11月22日」） */
const weekText = (monday: Date) =>
  formatRangeHeading(monday, new Date(monday.getTime() + 6 * DAY_MS));

/**
 * 週を選ぶ入力欄。週の期間を出し、日付を入力するとその日を含む週を選ぶ。
 * 右端のボタンで月曜日始まりの月のカレンダーを開き、週を行ごと選べる
 */
export function WeekPicker({ name, value, maxWeek, labels }: Props) {
  return (
    <CalendarField
      name={name}
      mode="week"
      value={value}
      max={maxWeek}
      label={labels.label}
      display={weekText}
      labels={labels}
    />
  );
}
