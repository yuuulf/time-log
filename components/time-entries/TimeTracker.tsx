import { cookies } from "next/headers";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import {
  getRunningEntry,
  listEntriesOfDay,
  listTaskNameSuggestions,
} from "@/lib/time-entries/repository";
import {
  parseTodayView,
  TODAY_VIEW_COOKIE,
} from "@/lib/time-entries/today-view";
import { StartStopForm } from "./StartStopForm";
import { TodayEntries } from "./TodayEntries";

/** 時間記録の画面。記録中の枠と今日の記録（一覧かタイムライン）を並べる。リクエストごとに最新の記録を読むため、<Suspense> の中に置く */
export async function TimeTracker() {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const db = getDb();
  const now = new Date();
  const initialView = parseTodayView(
    (await cookies()).get(TODAY_VIEW_COOKIE)?.value,
  );
  const running = getRunningEntry(db);
  const entries = listEntriesOfDay(db, now);
  const suggestions = listTaskNameSuggestions(db, now);
  const projects = listProjects(db, { archived: false }).map(
    ({ id, name, color }) => ({
      id,
      name,
      color,
    }),
  );

  return (
    <div className="space-y-8">
      <StartStopForm
        running={
          running
            ? {
                taskName: running.taskName,
                startedAt: running.startedAt,
                project: running.project,
              }
            : null
        }
        suggestions={suggestions}
        projects={projects}
      />
      <TodayEntries
        entries={entries.map(
          ({ id, taskName, startedAt, endedAt, project }) => ({
            id,
            taskName,
            startedAt,
            endedAt,
            project,
          }),
        )}
        now={now}
        projects={projects}
        initialView={initialView}
      />
    </div>
  );
}
