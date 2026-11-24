import type { ReactNode } from "react";
import { messages } from "@/lib/messages";
import { entryDurationMs, formatDateHeading, toDateKey } from "@/lib/time";
import type { EntryProject } from "@/components/projects/types";
import { DayHeading } from "./DayHeading";
import { EntryItem, type EntryItemData } from "./EntryItem";

const t = messages.timeEntries;

/**
 * 新しい順に並んだ記録を、開始日（日本時間）ごとにまとめる。
 * totalMs はその日の終了済みの記録の作業時間（記録ごとに分へ切り捨て）の合計で、記録中の記録は含めない
 */
function groupByDate(entries: EntryItemData[]) {
  const groups: {
    key: string;
    heading: string;
    totalMs: number;
    entries: EntryItemData[];
  }[] = [];
  for (const entry of entries) {
    const key = toDateKey(entry.startedAt);
    const last = groups.at(-1);
    if (last?.key === key) {
      last.entries.push(entry);
      last.totalMs += entryDurationMs(entry);
    } else {
      groups.push({
        key,
        heading: formatDateHeading(entry.startedAt),
        totalMs: entryDurationMs(entry),
        entries: [entry],
      });
    }
  }
  return groups;
}

type Props = {
  /** 開始時刻の新しい順に並んだ記録 */
  entries: EntryItemData[];
  /** 一覧の見出し。省略時は「記録」 */
  heading?: string;
  /** 記録がないときの文言。省略時は記録の始め方の案内 */
  emptyMessage?: string;
  /** 修正フォームのプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
  /** 見出しの横に置く要素（「過去の記録」の「CSV 出力」など） */
  headingAction?: ReactNode;
};

/** 記録の一覧 */
export function EntryList({
  entries,
  heading = t.listHeading,
  emptyMessage = t.empty,
  projects = [],
  headingAction,
}: Props) {
  return (
    <section aria-labelledby="entry-list-heading" className="space-y-4">
      <div className="flex items-center gap-3">
        <h2
          id="entry-list-heading"
          className="text-lg font-semibold text-foreground"
        >
          {heading}
        </h2>
        {headingAction}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        groupByDate(entries).map((group) => (
          <section key={group.key} aria-label={group.heading}>
            <DayHeading heading={group.heading} totalMs={group.totalMs} />
            <ul className="divide-y divide-border">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <EntryItem entry={entry} projects={projects} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
