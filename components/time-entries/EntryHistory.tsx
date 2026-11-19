import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import {
  resolveHistoryQuery,
  type HistorySearchParams,
} from "@/lib/time-entries/history";
import { listEntriesBetween } from "@/lib/time-entries/repository";
import { HistoryContent } from "./HistoryContent";

/**
 * 過去の記録。URL のクエリ（月または期間）に合わせて記録を読む。
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
  const view = resolveHistoryQuery(params, new Date());
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
  const projects = listProjects(db).map(({ id, name, color }) => ({
    id,
    name,
    color,
  }));
  return <HistoryContent view={view} entries={entries} projects={projects} />;
}
