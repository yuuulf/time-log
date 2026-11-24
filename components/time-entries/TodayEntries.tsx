"use client";

import { useState } from "react";
import type { EntryProject } from "@/components/projects/types";
import { messages } from "@/lib/messages";
import { todayViewCookie, type TodayView } from "@/lib/time-entries/today-view";
import type { EntryItemData } from "./EntryItem";
import { EntryList } from "./EntryList";
import { EntryTimeline } from "./EntryTimeline";
import { TodayViewToggle } from "./TodayViewToggle";

type Props = {
  /** 今日に開始した記録（新しい順） */
  entries: EntryItemData[];
  /** 描いた時点の時刻 */
  now: Date;
  /** プロジェクトの選択肢（登録順） */
  projects: EntryProject[];
  /** タスク名の入力候補（タイムラインの入力欄で使う） */
  suggestions: string[];
  /** 最初の表示（Cookie で覚えている表示） */
  initialView: TodayView;
};

/** トップページの「今日の記録」。見出しの横のボタンで一覧とタイムラインを切り替え、選んだ表示を Cookie に覚えておく */
export function TodayEntries({
  entries,
  now,
  projects,
  suggestions,
  initialView,
}: Props) {
  const [view, setView] = useState(initialView);

  const changeView = (next: TodayView) => {
    setView(next);
    document.cookie = todayViewCookie(next);
  };
  const toggle = <TodayViewToggle view={view} onChange={changeView} />;

  return view === "timeline" ? (
    <EntryTimeline
      entries={entries}
      now={now}
      headingAction={toggle}
      projects={projects}
      suggestions={suggestions}
    />
  ) : (
    <EntryList
      entries={entries}
      heading={messages.timeEntries.listHeading}
      emptyMessage={messages.timeEntries.empty}
      projects={projects}
      headingAction={toggle}
    />
  );
}
