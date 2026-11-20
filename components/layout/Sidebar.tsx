import Link from "next/link";
import { Suspense } from "react";
import { messages } from "@/lib/messages";
import { AppLogo } from "./AppLogo";
import { RunningTask } from "./RunningTask";
import { SidebarNav, SidebarNavLinks } from "./SidebarNav";
import { SidebarShell } from "./SidebarShell";

/** 全ページ共通のサイドバー。上からアプリ名・記録中のタスク・ページのリンクを置く */
export function Sidebar() {
  return (
    <SidebarShell>
      <Link
        href="/"
        className="flex items-center gap-2 px-3 text-lg font-semibold text-foreground"
      >
        <AppLogo />
        {messages.app.name}
      </Link>
      {/* 記録中のタスクはリクエストごとに読むため、<Suspense> の中に置く。枠はトップページへのリンク */}
      <div>
        <Suspense
          fallback={
            <p className="px-3 py-2 text-sm text-muted">
              {messages.timeEntries.loading}
            </p>
          }
        >
          <RunningTask />
        </Suspense>
      </div>
      {/* 今いるページはリクエストごとに決まる（動的なパラメータのページがある）ため、<Suspense> の中に置く */}
      <Suspense fallback={<SidebarNavLinks pathname={null} />}>
        <SidebarNav />
      </Suspense>
    </SidebarShell>
  );
}
