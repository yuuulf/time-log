import { messages } from "@/lib/messages";
import type { HistoryView } from "@/lib/time-entries/history";
import type { EntryProject } from "@/components/projects/types";
import { EntryList } from "./EntryList";
import type { EntryItemData } from "./EntryItem";
import { PeriodControls } from "./PeriodControls";

const t = messages.history;

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
        />
      )}
    </div>
  );
}
