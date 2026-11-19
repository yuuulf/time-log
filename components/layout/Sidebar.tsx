import { Suspense } from "react";
import { messages } from "@/lib/messages";
import { RunningTask } from "./RunningTask";
import { SidebarNav } from "./SidebarNav";
import { SidebarShell } from "./SidebarShell";

/** 全ページ共通のサイドバー。アプリ名・ページのリンク・記録中のタスクを置く */
export function Sidebar() {
  return (
    <SidebarShell>
      <SidebarNav />
      {/* 記録中のタスクはリクエストごとに読むため、<Suspense> の中に置く */}
      <div className="px-3">
        <Suspense
          fallback={
            <p className="text-sm text-muted">{messages.timeEntries.loading}</p>
          }
        >
          <RunningTask />
        </Suspense>
      </div>
    </SidebarShell>
  );
}
