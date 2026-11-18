import { eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { timeEntries, type TimeEntry } from "@/lib/db/schema";

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
