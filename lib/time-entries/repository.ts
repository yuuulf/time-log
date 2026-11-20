import { and, desc, eq, gte, isNull, lt, max, ne } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import {
  projects,
  timeEntries,
  type Project,
  type TimeEntry,
} from "@/lib/db/schema";
import { DAY_MS, dayRange, splitByJstDay } from "@/lib/time";

/** 記録に付けて返すプロジェクト */
export type EntryProject = Pick<Project, "id" | "name" | "color">;

/** プロジェクト（紐づいていなければ null）を付けた記録 */
export type EntryWithProject = TimeEntry & { project: EntryProject | null };

/** 記録とプロジェクトを left join して読むときの列 */
const entryWithProjectColumns = {
  entry: timeEntries,
  project: { id: projects.id, name: projects.name, color: projects.color },
};

function toEntryWithProject(row: {
  entry: TimeEntry;
  project: EntryProject | null;
}): EntryWithProject {
  return { ...row.entry, project: row.project };
}

/** プロジェクトを付けて記録を読むクエリ */
function selectEntriesWithProject(db: Db) {
  return db
    .select(entryWithProjectColumns)
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id));
}

/** タスク名の候補の最大件数 */
export const SUGGESTION_LIMIT = 10;

/** タスク名の候補にする期間の日数（今日を含む日本時間の日数） */
export const SUGGESTION_DAYS = 30;

/** 記録中の記録をプロジェクト付きで返す。なければ undefined */
export function getRunningEntry(db: Db): EntryWithProject | undefined {
  const row = selectEntriesWithProject(db)
    .where(isNull(timeEntries.endedAt))
    .get();
  return row && toEntryWithProject(row);
}

/**
 * 記録を開始する。記録中の記録があれば、同じ時刻で終了してから開始する。
 * タスク名は入力チェック済み（前後の空白を除いたもの）、projectId は存在を確かめたものを渡す
 * （省略時はプロジェクトなし）。
 */
export function startEntry(
  db: Db,
  {
    taskName,
    projectId = null,
    now,
  }: { taskName: string; projectId?: number | null; now: Date },
): TimeEntry {
  return db.transaction((tx) => {
    finishRunningEntry(tx, now);
    return tx
      .insert(timeEntries)
      .values({
        taskName,
        projectId,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  });
}

/** db.transaction のコールバックが受け取るトランザクション */
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * 記録を startedAt〜endedAt で保存する。日本時間の日をまたぐときは日ごとに分け、
 * 元の記録を開始日の区間にし、2 日目以降は同じタスク名・同じプロジェクトの記録として足す。
 * 元の記録（開始日の区間）を返す。トランザクションの中で呼ぶ
 */
function saveSplitByDay(
  tx: Tx,
  entry: TimeEntry,
  values: { taskName: string; projectId: number | null; startedAt: Date },
  endedAt: Date,
  now: Date,
): TimeEntry {
  const [first, ...rest] = splitByJstDay(values.startedAt, endedAt);
  const updated = tx
    .update(timeEntries)
    .set({
      taskName: values.taskName,
      projectId: values.projectId,
      startedAt: first.startedAt,
      endedAt: first.endedAt,
      updatedAt: now,
    })
    .where(eq(timeEntries.id, entry.id))
    .returning()
    .get();
  if (rest.length > 0) {
    tx.insert(timeEntries)
      .values(
        rest.map((span) => ({
          taskName: values.taskName,
          projectId: values.projectId,
          startedAt: span.startedAt,
          endedAt: span.endedAt,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .run();
  }
  return updated;
}

/** 記録中の記録を now で終了する（日をまたぐときは日ごとに分ける）。なければ undefined */
function finishRunningEntry(tx: Tx, now: Date): TimeEntry | undefined {
  const running = tx
    .select()
    .from(timeEntries)
    .where(isNull(timeEntries.endedAt))
    .get();
  if (!running) return undefined;
  return saveSplitByDay(tx, running, running, now, now);
}

/**
 * 記録中の記録を現在時刻で終了する。日をまたぐときは日ごとに分け、開始日の記録を返す。
 * 記録中の記録がなければ何もせず undefined を返す
 */
export function stopRunningEntry(db: Db, now: Date): TimeEntry | undefined {
  return db.transaction((tx) => finishRunningEntry(tx, now));
}

/** 記録を 1 件返す。なければ undefined */
export function getEntry(db: Db, id: number): TimeEntry | undefined {
  return db.select().from(timeEntries).where(eq(timeEntries.id, id)).get();
}

/** now と同じ日（日本時間の 0 時から翌日 0 時の前まで）に開始した記録を、プロジェクト付きで新しい順に返す */
export function listEntriesOfDay(db: Db, now: Date): EntryWithProject[] {
  const { from, to } = dayRange(now);
  return listEntriesBetween(db, from, to);
}

/** from 以降、to より前（to は含まない）に開始した記録を、プロジェクト付きで新しい順に返す */
export function listEntriesBetween(
  db: Db,
  from: Date,
  to: Date,
): EntryWithProject[] {
  return selectEntriesWithProject(db)
    .where(and(gte(timeEntries.startedAt, from), lt(timeEntries.startedAt, to)))
    .orderBy(desc(timeEntries.startedAt), desc(timeEntries.id))
    .all()
    .map(toEntryWithProject);
}

/**
 * 最近（今日を含む日本時間の SUGGESTION_DAYS 日間）に開始した記録のタスク名を、最近使った順に重複なく
 * SUGGESTION_LIMIT 件まで返す。空のタスク名は含めない
 */
export function listTaskNameSuggestions(db: Db, now: Date): string[] {
  const from = new Date(
    dayRange(now).from.getTime() - (SUGGESTION_DAYS - 1) * DAY_MS,
  );
  const lastUsed = max(timeEntries.startedAt);
  return db
    .select({ taskName: timeEntries.taskName, lastUsed })
    .from(timeEntries)
    .where(and(ne(timeEntries.taskName, ""), gte(timeEntries.startedAt, from)))
    .groupBy(timeEntries.taskName)
    .orderBy(desc(lastUsed))
    .limit(SUGGESTION_LIMIT)
    .all()
    .map((row) => row.taskName);
}

/**
 * 記録を修正する。入力チェック済みの値を渡す。projectId を省略するとプロジェクトは変えない。
 * 記録中の記録では終了時刻を変えず、分けもしない（終了は stopRunningEntry で行う）。
 * 終了した記録が日本時間の日をまたぐときは、日ごとに分けて開始日の記録を返す。
 * 記録が存在しなければ undefined を返す。
 */
export function updateEntry(
  db: Db,
  id: number,
  input: {
    taskName: string;
    projectId?: number | null;
    startedAt: Date;
    endedAt?: Date;
  },
  now: Date,
): TimeEntry | undefined {
  return db.transaction((tx) => {
    const entry = tx
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .get();
    if (!entry) return undefined;
    const values = {
      taskName: input.taskName,
      projectId:
        input.projectId === undefined ? entry.projectId : input.projectId,
      startedAt: input.startedAt,
    };
    if (entry.endedAt === null) {
      return tx
        .update(timeEntries)
        .set({ ...values, updatedAt: now })
        .where(eq(timeEntries.id, id))
        .returning()
        .get();
    }
    const endedAt = input.endedAt ?? entry.endedAt;
    return saveSplitByDay(tx, entry, values, endedAt, now);
  });
}

/** 記録を削除する。削除できたら true、存在しなければ false を返す */
export function deleteEntry(db: Db, id: number): boolean {
  const deleted = db
    .delete(timeEntries)
    .where(eq(timeEntries.id, id))
    .returning({ id: timeEntries.id })
    .get();
  return deleted !== undefined;
}
