import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import { IconButton } from "@/components/ui/IconButton";
import { IconLink } from "@/components/ui/IconLink";
import { WeekPicker } from "@/components/ui/WeekPicker";
import { messages } from "@/lib/messages";
import type { WeekView } from "@/lib/time-entries/history";

const t = messages.history;

/**
 * 週の切り替え。「前の週」「次の週」で 1 週ずつ切り替え（今週より先には進めない）、
 * 週の入力欄で選んだ週を「表示」で表示する
 */
export function WeekControls({
  view,
  thisWeek,
}: {
  view: WeekView;
  /** 今週の月曜日。これより先の週は選べない */
  thisWeek: Date;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
      <nav aria-label={t.weekNav} className="flex shrink-0 gap-2">
        <IconLink
          href={`/history?week=${view.prevWeek}`}
          icon={ChevronLeft}
          label={t.prevWeek}
        />
        {view.nextWeek ? (
          <IconLink
            href={`/history?week=${view.nextWeek}`}
            icon={ChevronRight}
            label={t.nextWeek}
          />
        ) : (
          <IconButton icon={ChevronRight} label={t.nextWeek} disabled />
        )}
      </nav>
      {/* 表示中の週が変わったら入力欄を作り直し、URL の週を表示する */}
      <Form
        key={view.week}
        action="/history"
        className="flex min-w-0 flex-1 basis-80 items-center gap-2"
      >
        <WeekPicker
          name="week"
          value={view.days[0]}
          maxWeek={thisWeek}
          labels={{
            ...t.weekPicker,
            calendar: t.calendarButton(t.weekPicker.label),
          }}
        />
        <IconButton type="submit" icon={Search} label={t.show} />
      </Form>
    </div>
  );
}
