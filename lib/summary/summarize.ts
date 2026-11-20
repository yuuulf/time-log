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
  /** その週に記録（記録中を含む）を開始した日の数 */
  workDays: number;
};

export type ProjectTotal = {
  /** null は「プロジェクトなし」 */
  project: EntryProject | null;
  totalMs: number;
  /** そのプロジェクトの記録（記録中を含む）を開始した日の数 */
  workDays: number;
};

export type Summary = {
  /** 終了済みの記録の作業時間（記録ごとに分へ切り捨て）の合計（ミリ秒） */
  totalMs: number;
  /** 記録（記録中を含む）を開始した日の数 */
  workDays: number;
  /** 月曜日で区切った週（古い順） */
  weeks: WeekTotal[];
  /** プロジェクトごとの合計（長い順。1 分未満は除く） */
  projects: ProjectTotal[];
};

/** 記録の作業時間。記録の一覧の表示と同じく、分に切り捨てる。記録中なら 0 */
function durationMs(entry: SummaryEntry): number {
  if (!entry.endedAt) return 0;
  const ms = Math.max(0, entry.endedAt.getTime() - entry.startedAt.getTime());
  return Math.floor(ms / MINUTE_MS) * MINUTE_MS;
}

/** 記録の作業時間の合計と、記録（記録中を含む）を開始した日の数 */
function totals(entries: SummaryEntry[]): {
  totalMs: number;
  workDays: number;
} {
  return {
    totalMs: entries.reduce((sum, e) => sum + durationMs(e), 0),
    workDays: new Set(entries.map((e) => toDateKey(e.startedAt))).size,
  };
}

/**
 * range（from は日本時間の 0 時、to はその日を含まない次の日の 0 時）に開始した記録を集計する。
 * 各記録の作業時間は分に切り捨ててから足す（記録の一覧に出る作業時間の合計と一致させる）
 */
export function summarize(entries: SummaryEntry[], range: DateRange): Summary {
  const inRange = entries.filter(
    (e) => e.startedAt >= range.from && e.startedAt < range.to,
  );

  const { totalMs, workDays } = totals(inRange);

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
      ...totals(weekEntries),
    });
    day = next;
  }

  const byProject = new Map<
    number | null,
    { project: EntryProject | null; entries: SummaryEntry[] }
  >();
  for (const entry of inRange) {
    const key = entry.project?.id ?? null;
    const group = byProject.get(key) ?? { project: entry.project, entries: [] };
    group.entries.push(entry);
    byProject.set(key, group);
  }
  // 長い順。同じなら登録順（id の小さい順）、「プロジェクトなし」は最後
  const order = (p: ProjectTotal) => p.project?.id ?? Number.POSITIVE_INFINITY;
  const projects = [...byProject.values()]
    .map(({ project, entries }) => ({ project, ...totals(entries) }))
    .filter((p) => p.totalMs > 0)
    .sort((a, b) => b.totalMs - a.totalMs || order(a) - order(b));

  return { totalMs, workDays, weeks, projects };
}
