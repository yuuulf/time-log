import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import {
  getRunningEntry,
  listRecentEntries,
  listTaskNameSuggestions,
} from "@/lib/time-entries/repository";
import { EntryList } from "./EntryList";
import { StartStopForm } from "./StartStopForm";

/** 時間記録の画面。リクエストごとに最新の記録を読むため、<Suspense> の中に置く */
export async function TimeTracker() {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const db = getDb();
  const now = new Date();
  const running = getRunningEntry(db);
  const entries = listRecentEntries(db, now);
  const suggestions = listTaskNameSuggestions(db);
  const projects = listProjects(db).map(({ id, name, color }) => ({
    id,
    name,
    color,
  }));

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
      <EntryList
        entries={entries.map(({ id, taskName, startedAt, endedAt }) => ({
          id,
          taskName,
          startedAt,
          endedAt,
        }))}
      />
    </div>
  );
}
