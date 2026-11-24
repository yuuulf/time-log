"use client";

import type { ReactNode } from "react";
import type { EntryProject } from "@/components/projects/types";
import { messages } from "@/lib/messages";
import { dayRange, entryDurationMs, formatDateHeading } from "@/lib/time";
import { DayHeading } from "./DayHeading";
import type { EntryItemData } from "./EntryItem";
import { TimelineBoard } from "./TimelineBoard";

export { MINUTE_PX } from "./TimelineBoard";

const t = messages.timeEntries;

type Props = {
  /** 今日に開始した記録（順は問わない） */
  entries: EntryItemData[];
  /** 描いた時点の時刻。今の時刻の線と日付に使う */
  now: Date;
  /** 一覧の見出し。省略時は「今日の記録」 */
  heading?: string;
  /** 見出しの横に置く要素（表示の切り替えなど） */
  headingAction?: ReactNode;
  /** 入力欄のプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
  /** 入力欄のタスク名の入力候補 */
  suggestions?: string[];
};

/**
 * 今日の記録のタイムライン。見出しと日付の見出し（合計時間）の下に、今日 1 日ぶんのタイムラインの格子を置く
 */
export function EntryTimeline({
  entries,
  now,
  heading = t.listHeading,
  headingAction,
  projects = [],
  suggestions = [],
}: Props) {
  const totalMs = entries.reduce((sum, e) => sum + entryDurationMs(e), 0);
  const dateHeading = formatDateHeading(now);

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
      <section aria-label={dateHeading}>
        <DayHeading heading={dateHeading} totalMs={totalMs} />
        <TimelineBoard
          days={[{ dayStart: dayRange(now).from, entries }]}
          now={now}
          gutter="2rem"
          projects={projects}
          suggestions={suggestions}
        />
      </section>
    </section>
  );
}
