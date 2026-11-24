import { messages } from "@/lib/messages";
import { formatDuration } from "@/lib/time";

/** 日付の見出しの行。右端にその日の終了済みの記録の合計時間を出し、読み上げでは合計であることを添える */
export function DayHeading({
  heading,
  totalMs,
}: {
  heading: string;
  totalMs: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-1 text-sm font-medium text-muted">
      <h3>{heading}</h3>
      <p className="tabular-nums">
        <span className="sr-only">{messages.timeEntries.dayTotal} </span>
        {formatDuration(totalMs)}
      </p>
    </div>
  );
}
