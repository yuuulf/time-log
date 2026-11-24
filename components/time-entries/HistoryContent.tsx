import { FileSpreadsheet } from "lucide-react";
import { IconDownloadLink } from "@/components/ui/IconDownloadLink";
import { messages } from "@/lib/messages";
import type { HistoryView } from "@/lib/time-entries/history";
import type { EntryProject } from "@/components/projects/types";
import { EntryList } from "./EntryList";
import type { EntryItemData } from "./EntryItem";
import { PeriodControls } from "./PeriodControls";

const t = messages.history;

/** 表示中の月・期間の CSV の URL。今月も month を明示し、日付をまたいだあとに開いても画面と同じ月にする */
function csvHref(view: Exclude<HistoryView, { mode: "rangeError" }>): string {
  const query =
    view.mode === "month"
      ? new URLSearchParams({ month: view.month })
      : new URLSearchParams(view.values);
  return `/history/export?${query}`;
}

/** 過去の記録の表示。期間の切り替えと記録の一覧を並べる */
export function HistoryContent({
  view,
  entries,
  projects = [],
}: {
  view: HistoryView;
  entries: EntryItemData[];
  /** 修正フォームのプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
}) {
  return (
    <div className="space-y-6">
      <PeriodControls view={view} basePath="/history" />
      {view.mode !== "rangeError" && (
        <EntryList
          entries={entries}
          heading={view.heading}
          emptyMessage={t.empty}
          projects={projects}
          headingAction={
            <IconDownloadLink
              href={csvHref(view)}
              icon={FileSpreadsheet}
              label={t.csv.export}
            />
          }
        />
      )}
    </div>
  );
}
