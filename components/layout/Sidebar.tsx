import Link from "next/link";
import { Suspense } from "react";
import { messages } from "@/lib/messages";
import { RunningTask } from "./RunningTask";
import { SidebarNav } from "./SidebarNav";
import { SidebarShell } from "./SidebarShell";

/** 全ページ共通のサイドバー。上からアプリ名・記録中のタスク・ページのリンクを置く */
export function Sidebar() {
  return (
    <SidebarShell>
      <Link
        href="/"
        className="block px-3 text-lg font-semibold text-foreground"
      >
        {messages.app.name}
      </Link>
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
      <SidebarNav />
    </SidebarShell>
  );
}
