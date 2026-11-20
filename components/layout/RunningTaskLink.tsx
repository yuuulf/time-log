"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * サイドバーの記録中のタスクの枠を、トップページへのリンクにする。
 * トップページを開いているときは、ページのリンクと同じく選ばれている表示にする
 */
export function RunningTaskLink({ children }: { children: ReactNode }) {
  return (
    <RunningTaskLinkView pathname={usePathname()}>
      {children}
    </RunningTaskLinkView>
  );
}

/** pathname が「/」なら選ばれている表示にする。null ならどちらにもしない */
export function RunningTaskLinkView({
  pathname,
  children,
}: {
  pathname: string | null;
  children: ReactNode;
}) {
  const current = pathname === "/";
  return (
    <Link
      href="/"
      aria-current={current ? "page" : undefined}
      className={`block space-y-1 rounded-md px-3 py-2 transition-colors ${
        current ? "bg-border/60" : "hover:bg-border/40"
      }`}
    >
      {children}
    </Link>
  );
}
