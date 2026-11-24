import { connection, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/messages";
import { toEntriesCsv } from "@/lib/time-entries/csv";
import { resolveHistoryQuery } from "@/lib/time-entries/history";
import { listEntriesBetween } from "@/lib/time-entries/repository";

/** 日本語のファイル名を受け取れないブラウザ向けの名前 */
const FALLBACK_FILENAME = "timelog.csv";

/**
 * 「過去の記録」ページで表示中の月・期間の記録を CSV で返す。
 * クエリ（month、または from・to）はページと同じ resolveHistoryQuery で解釈し、画面の記録と一致させる
 */
export async function GET(request: NextRequest) {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const view = resolveHistoryQuery(
    Object.fromEntries(request.nextUrl.searchParams),
    new Date(),
  );
  if (view.mode === "rangeError") {
    return new Response(view.error, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const entries = listEntriesBetween(getDb(), view.range.from, view.range.to);
  const filename = messages.history.csv.filename(view.heading);
  return new Response(toEntriesCsv(entries), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // 日本語のファイル名は filename*（RFC 6266 / 5987）で渡す
      "Content-Disposition": `attachment; filename="${FALLBACK_FILENAME}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
