import { desc, eq, gte, isNull, max, ne } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { timeEntries, type TimeEntry } from "@/lib/db/schema";

/** 一覧に表示する期間（現在時刻からさかのぼる日数） */
export const RECENT_DAYS = 30;

/** タスク名の候補の最大件数 */
export const SUGGESTION_LIMIT = 20;

/** 記録中の記録を返す。なければ undefined */
export function getRunningEntry(db: Db): TimeEntry | undefined {
  return db.select().from(timeEntries).where(isNull(timeEntries.endedAt)).get();
}

/**
 * 記録を開始する。記録中の記録があれば、同じ時刻で終了してから開始する。
 * タスク名は入力チェック済み（前後の空白を除いたもの）を渡す。
 */
export function startEntry(
  db: Db,
  { taskName, now }: { taskName: string; now: Date },
): TimeEntry {
  return db.transaction((tx) => {
    tx.update(timeEntries)
      .set({ endedAt: now, updatedAt: now })
      .where(isNull(timeEntries.endedAt))
      .run();
    return tx
      .insert(timeEntries)
      .values({ taskName, startedAt: now, createdAt: now, updatedAt: now })
      .returning()
      .get();
  });
}

/** 記録中の記録を現在時刻で終了する。記録中の記録がなければ何もせず undefined を返す */
export function stopRunningEntry(db: Db, now: Date): TimeEntry | undefined {
  return db
    .update(timeEntries)
    .set({ endedAt: now, updatedAt: now })
    .where(isNull(timeEntries.endedAt))
    .returning()
    .get();
}

/** 記録を 1 件返す。なければ undefined */
export function getEntry(db: Db, id: number): TimeEntry | undefined {
  return db.select().from(timeEntries).where(eq(timeEntries.id, id)).get();
}

/** 直近 RECENT_DAYS 日（現在時刻から RECENT_DAYS×24 時間前以降）に開始した記録を新しい順に返す */
export function listRecentEntries(db: Db, now: Date): TimeEntry[] {
  const since = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(timeEntries)
    .where(gte(timeEntries.startedAt, since))
    .orderBy(desc(timeEntries.startedAt), desc(timeEntries.id))
    .all();
}

/** 過去に使ったタスク名を、最近使った順に重複なく返す。空のタスク名は含めない */
export function listTaskNameSuggestions(db: Db): string[] {
  const lastUsed = max(timeEntries.startedAt);
  return db
    .select({ taskName: timeEntries.taskName, lastUsed })
    .from(timeEntries)
    .where(ne(timeEntries.taskName, ""))
    .groupBy(timeEntries.taskName)
    .orderBy(desc(lastUsed))
    .limit(SUGGESTION_LIMIT)
    .all()
    .map((row) => row.taskName);
}
