import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { IconLink } from "@/components/ui/IconLink";
import { messages } from "@/lib/messages";
import type { WeekView } from "@/lib/time-entries/history";

const t = messages.history;

/** 週の切り替え。「前の週」「次の週」で 1 週ずつ切り替え、今週より先には進めない */
export function WeekControls({ view }: { view: WeekView }) {
  return (
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
  );
}
