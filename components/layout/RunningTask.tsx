import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { getRunningEntry } from "@/lib/time-entries/repository";
import { RunningTaskView } from "./RunningTaskView";

/** 記録中のタスクを読んで表示する。リクエストごとに読むため、<Suspense> の中に置く */
export async function RunningTask() {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const running = getRunningEntry(getDb());
  return (
    <RunningTaskView
      running={
        running
          ? {
              taskName: running.taskName,
              startedAt: running.startedAt,
              project: running.project,
            }
          : null
      }
    />
  );
}
