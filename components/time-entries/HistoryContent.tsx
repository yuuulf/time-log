import { FileSpreadsheet } from "lucide-react";
import { IconDownloadLink } from "@/components/ui/IconDownloadLink";
import { messages } from "@/lib/messages";
import { toDateKey, weekStart } from "@/lib/time";
import type { HistoryPageView } from "@/lib/time-entries/history";
import type { TodayView } from "@/lib/time-entries/today-view";
import type { EntryProject } from "@/components/projects/types";
import { EntryList } from "./EntryList";
import type { EntryItemData } from "./EntryItem";
import { HistoryViewToggle } from "./HistoryViewToggle";
import { PeriodControls } from "./PeriodControls";
import { WeekCalendar } from "./WeekCalendar";
import { WeekControls } from "./WeekControls";

const t = messages.history;

/**
 * 表示中の月・期間・週の CSV の URL。今月も month を明示し、日付をまたいだあとに開いても画面と同じ月にする。
 * 週は月曜日〜日曜日の期間として渡す
 */
function csvHref(
  view: Exclude<HistoryPageView, { mode: "rangeError" }>,
): string {
  const query =
    view.mode === "month"
      ? new URLSearchParams({ month: view.month })
      : view.mode === "week"
        ? new URLSearchParams({
            from: view.week,
            to: toDateKey(view.days[6]),
          })
        : new URLSearchParams(view.values);
  return `/history/export?${query}`;
}

/** 過去の記録の表示。期間（月・期間）の切り替えと記録の一覧、または週の切り替えと週のカレンダーを並べる */
export function HistoryContent({
  view,
  entries,
  projects = [],
  suggestions = [],
  now,
  switchHrefs,
}: {
  view: HistoryPageView;
  entries: EntryItemData[];
  /** 修正フォームのプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
  /** 週のカレンダーの入力欄のタスク名の入力候補 */
  suggestions?: string[];
  /** 描いた時点の時刻（週のカレンダーの今の時刻） */
  now: Date;
  /** 表示の切り替えの行き先 */
  switchHrefs: Record<TodayView, string>;
}) {
  if (view.mode === "rangeError") {
    return (
      <div className="space-y-6">
        <PeriodControls view={view} basePath="/history" />
      </div>
    );
  }
  const headingAction = (
    <>
      <HistoryViewToggle
        view={view.mode === "week" ? "timeline" : "list"}
        hrefs={switchHrefs}
      />
      {/* 表示の切り替えと紛れないよう、見出しの行の右端に寄せる */}
      <IconDownloadLink
        href={csvHref(view)}
        icon={FileSpreadsheet}
        label={t.csv.export}
        className="ml-auto"
      />
    </>
  );
  return (
    <div className="space-y-6">
      {view.mode === "week" ? (
        <>
          <WeekControls view={view} thisWeek={weekStart(now)} />
          <WeekCalendar
            heading={view.heading}
            days={view.days}
            entries={entries}
            now={now}
            headingAction={headingAction}
            projects={projects}
            suggestions={suggestions}
          />
        </>
      ) : (
        <>
          <PeriodControls view={view} basePath="/history" />
          <EntryList
            entries={entries}
            heading={view.heading}
            emptyMessage={t.empty}
            projects={projects}
            headingAction={headingAction}
          />
        </>
      )}
    </div>
  );
}
