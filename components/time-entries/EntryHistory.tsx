import { connection } from "next/server";
import { getDb } from "@/lib/db";
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
  const view = resolveHistoryQuery(params, new Date());
  const entries =
    view.mode === "rangeError"
      ? []
      : listEntriesBetween(getDb(), view.range.from, view.range.to).map(
          ({ id, taskName, startedAt, endedAt }) => ({
            id,
            taskName,
            startedAt,
            endedAt,
          }),
        );
  return <HistoryContent view={view} entries={entries} />;
}
