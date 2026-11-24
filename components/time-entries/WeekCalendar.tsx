"use client";

import type { ReactNode } from "react";
import type { EntryProject } from "@/components/projects/types";
import { entryDurationMs, formatShortDayHeading, toDateKey } from "@/lib/time";
import type { EntryItemData } from "./EntryItem";
import { TimelineBoard } from "./TimelineBoard";

type Props = {
  /** 週の期間の見出し（「2026年11月16日〜2026年11月22日」） */
  heading: string;
  /** 月曜日〜日曜日の各日の 0 時（日本時間） */
  days: Date[];
  /** その週に開始した記録（順は問わない） */
  entries: EntryItemData[];
  /** 描いた時点の時刻。今週なら今日の列に今の時刻の線を引く */
  now: Date;
  /** 見出しの横に置く要素（表示の切り替え・CSV 出力） */
  headingAction?: ReactNode;
  /** 入力欄のプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
  /** 入力欄のタスク名の入力候補 */
  suggestions?: string[];
};

/**
 * 週のカレンダー。左に 0 時〜24 時の目盛り、右に月曜日〜日曜日の列を並べ、記録を開始した日の列に帯で置く。
 * 列の上には日付とその日の終了済みの記録の作業時間の合計を出す
 */
export function WeekCalendar({
  heading,
  days,
  entries,
  now,
  headingAction,
  projects = [],
  suggestions = [],
}: Props) {
  const columns = days.map((dayStart) => {
    const key = toDateKey(dayStart);
    return {
      dayStart,
      entries: entries.filter((e) => toDateKey(e.startedAt) === key),
    };
  });

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
      <TimelineBoard
        days={columns}
        now={now}
        gutter="1rem"
        dayHeaders={columns.map((column) => ({
          label: formatShortDayHeading(column.dayStart),
          totalMs: column.entries.reduce(
            (sum, e) => sum + entryDurationMs(e),
            0,
          ),
        }))}
        projects={projects}
        suggestions={suggestions}
      />
    </section>
  );
}
