import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** 時間の記録。ended_at が null の記録は記録中 */
export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskName: text("task_name").notNull().default(""),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("time_entries_started_at_idx").on(table.startedAt),
    // 記録中（ended_at IS NULL）は 1 件まで。NULL どうしは一意インデックスで重複扱いにならないため、式に張る
    uniqueIndex("time_entries_one_running_idx")
      .on(sql`(${table.endedAt} IS NULL)`)
      .where(sql`${table.endedAt} IS NULL`),
  ],
);

export type TimeEntry = typeof timeEntries.$inferSelect;
