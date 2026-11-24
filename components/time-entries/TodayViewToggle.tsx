"use client";

import { CalendarDays, List } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { messages } from "@/lib/messages";
import type { TodayView } from "@/lib/time-entries/today-view";

const t = messages.timeEntries.view;

/** 「今日の記録」の表示を一覧とタイムライン（「カレンダー」）で切り替えるボタン。選んでいるほうを押された状態にする */
export function TodayViewToggle({
  view,
  onChange,
}: {
  view: TodayView;
  onChange: (view: TodayView) => void;
}) {
  const options = [
    { value: "list", icon: List, label: t.list },
    { value: "timeline", icon: CalendarDays, label: t.timeline },
  ] as const;
  return (
    <div role="group" aria-label={t.label} className="flex gap-1">
      {options.map(({ value, icon, label }) => (
        <IconButton
          key={value}
          icon={icon}
          label={label}
          aria-pressed={view === value}
          variant={view === value ? "primary" : "secondary"}
          onClick={() => onChange(value)}
        />
      ))}
    </div>
  );
}
