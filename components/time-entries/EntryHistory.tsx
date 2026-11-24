import { cookies } from "next/headers";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import {
  historySwitchHrefs,
  resolveHistoryPageQuery,
  type HistorySearchParams,
} from "@/lib/time-entries/history";
import {
  listEntriesBetween,
  listTaskNameSuggestions,
} from "@/lib/time-entries/repository";
import {
  HISTORY_VIEW_COOKIE,
  parseTodayView,
} from "@/lib/time-entries/today-view";
import { HistoryContent } from "./HistoryContent";

/**
 * 過去の記録。URL のクエリ（月・期間・週）と覚えている表示（Cookie）に合わせて記録を読む。
 * searchParams はリクエスト時の値なので、<Suspense> の中に置く
 */
export async function EntryHistory({
  searchParams,
}: {
  searchParams: Promise<HistorySearchParams>;
}) {
  const params = await searchParams;
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const db = getDb();
  const now = new Date();
  const preferred = parseTodayView(
    (await cookies()).get(HISTORY_VIEW_COOKIE)?.value,
  );
  const view = resolveHistoryPageQuery(params, now, preferred);
  const entries =
    view.mode === "rangeError"
      ? []
      : listEntriesBetween(db, view.range.from, view.range.to).map(
          ({ id, taskName, startedAt, endedAt, project }) => ({
            id,
            taskName,
            startedAt,
            endedAt,
            project,
          }),
        );
  const projects = listProjects(db, { archived: false }).map(
    ({ id, name, color }) => ({
      id,
      name,
      color,
    }),
  );
  return (
    <HistoryContent
      view={view}
      entries={entries}
      projects={projects}
      suggestions={view.mode === "week" ? listTaskNameSuggestions(db, now) : []}
      now={now}
      switchHrefs={historySwitchHrefs(view, now)}
    />
  );
}
