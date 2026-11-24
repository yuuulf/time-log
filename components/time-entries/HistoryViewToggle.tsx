"use client";

import { useRouter } from "next/navigation";
import {
  HISTORY_VIEW_COOKIE,
  viewCookie,
  type TodayView,
} from "@/lib/time-entries/today-view";
import { TodayViewToggle } from "./TodayViewToggle";

/**
 * 「過去の記録」の表示の切り替え（今日の記録と同じ「一覧」「カレンダー」のボタングループ）。
 * 選んだら表示を Cookie に覚え（今日の記録とは別）、その表示の行き先へ移動する
 */
export function HistoryViewToggle({
  view,
  hrefs,
}: {
  view: TodayView;
  hrefs: Record<TodayView, string>;
}) {
  const router = useRouter();
  return (
    <TodayViewToggle
      view={view}
      onChange={(next) => {
        if (next === view) return;
        document.cookie = viewCookie(HISTORY_VIEW_COOKIE, next);
        router.push(hrefs[next]);
      }}
    />
  );
}
