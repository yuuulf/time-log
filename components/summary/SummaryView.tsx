import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { summarize } from "@/lib/summary/summarize";
import {
  resolveHistoryQuery,
  type HistorySearchParams,
} from "@/lib/time-entries/history";
import { listEntriesBetween } from "@/lib/time-entries/repository";
import { SummaryContent } from "./SummaryContent";

/**
 * 集計。URL のクエリ（月または期間）に合わせて記録を読んで集計する。
 * searchParams はリクエスト時の値なので、<Suspense> の中に置く
 */
export async function SummaryView({
  searchParams,
}: {
  searchParams: Promise<HistorySearchParams>;
}) {
  const params = await searchParams;
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const view = resolveHistoryQuery(params, new Date());
  const summary =
    view.mode === "rangeError"
      ? null
      : summarize(
          listEntriesBetween(getDb(), view.range.from, view.range.to),
          view.range,
        );
  return <SummaryContent view={view} summary={summary} />;
}
