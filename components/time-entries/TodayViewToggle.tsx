"use client";

import { CalendarDays, List } from "lucide-react";
import { IconButtonGroup } from "@/components/ui/IconButtonGroup";
import { messages } from "@/lib/messages";
import type { TodayView } from "@/lib/time-entries/today-view";

const t = messages.timeEntries.view;

const options = [
  { value: "list" as const, icon: List, label: t.list },
  { value: "timeline" as const, icon: CalendarDays, label: t.timeline },
];

/** 「今日の記録」の表示を一覧とタイムライン（「カレンダー」）で切り替えるボタングループ */
export function TodayViewToggle({
  view,
  onChange,
}: {
  view: TodayView;
  onChange: (view: TodayView) => void;
}) {
  return (
    <IconButtonGroup
      label={t.label}
      options={options}
      value={view}
      onChange={onChange}
    />
  );
}
