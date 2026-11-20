import type { EntryProject } from "@/lib/time-entries/repository";
import type { DateRange } from "@/lib/time-entries/history";
import { jstWeekdayFromMonday, toDateKey } from "@/lib/time";

// 日本時間には夏時間がないため、1 日はいつも 24 時間
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** 集計に使う記録 */
export type SummaryEntry = {
  startedAt: Date;
  /** 記録中なら null */
  endedAt: Date | null;
  project: EntryProject | null;
};

export type WeekTotal = {
  /** 週の最初の日（日本時間 0 時） */
  first: Date;
  /** 週の最後の日（日本時間 0 時） */
  last: Date;
  totalMs: number;
};

export type ProjectTotal = {
  /** null は「プロジェクトなし」 */
  project: EntryProject | null;
  totalMs: number;
};

export type Summary = {
  /** 終了済みの記録の作業時間の合計（ミリ秒） */
  totalMs: number;
  /** 記録（記録中を含む）を開始した日の数 */
  workDays: number;
  /** 月曜日で区切った週（古い順） */
  weeks: WeekTotal[];
  /** プロジェクトごとの合計（長い順。1 分未満は除く） */
  projects: ProjectTotal[];
};

function durationMs(entry: SummaryEntry): number {
  return entry.endedAt
    ? Math.max(0, entry.endedAt.getTime() - entry.startedAt.getTime())
    : 0;
}

/**
 * range（from は日本時間の 0 時、to はその日を含まない次の日の 0 時）に開始した記録を集計する。
 * 時間はミリ秒のまま足し、分への切り捨ては表示のときに行う
 */
export function summarize(entries: SummaryEntry[], range: DateRange): Summary {
  const inRange = entries.filter(
    (e) => e.startedAt >= range.from && e.startedAt < range.to,
  );

  const totalMs = inRange.reduce((sum, e) => sum + durationMs(e), 0);
  const workDays = new Set(inRange.map((e) => toDateKey(e.startedAt))).size;

  // 範囲の初日から 1 日ずつ進め、月曜日だけで区切る（月の境目では区切らない）
  const weeks: WeekTotal[] = [];
  for (let day = range.from; day < range.to;) {
    const daysToMonday = 7 - jstWeekdayFromMonday(day);
    const next = new Date(
      Math.min(day.getTime() + daysToMonday * DAY_MS, range.to.getTime()),
    );
    const weekEntries = inRange.filter(
      (e) => e.startedAt >= day && e.startedAt < next,
    );
    weeks.push({
      first: day,
      last: new Date(next.getTime() - DAY_MS),
      totalMs: weekEntries.reduce((sum, e) => sum + durationMs(e), 0),
    });
    day = next;
  }

  const byProject = new Map<number | null, ProjectTotal>();
  for (const entry of inRange) {
    const key = entry.project?.id ?? null;
    const total = byProject.get(key) ?? { project: entry.project, totalMs: 0 };
    total.totalMs += durationMs(entry);
    byProject.set(key, total);
  }
  // 表示する分の長い順。同じなら登録順（id の小さい順）、「プロジェクトなし」は最後
  const minutes = (p: ProjectTotal) => Math.floor(p.totalMs / MINUTE_MS);
  const order = (p: ProjectTotal) => p.project?.id ?? Number.POSITIVE_INFINITY;
  const projects = [...byProject.values()]
    .filter((p) => minutes(p) > 0)
    .sort((a, b) => minutes(b) - minutes(a) || order(a) - order(b));

  return { totalMs, workDays, weeks, projects };
}
