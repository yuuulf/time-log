"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages } from "@/lib/messages";

const pages = [
  { href: "/", label: messages.nav.home },
  { href: "/history", label: messages.history.title },
  { href: "/projects", label: messages.projects.title },
] as const;

/**
 * サイドバーのページのリンク。今いるページのリンクに aria-current を付ける。
 * usePathname は動的なパラメータのページでプリレンダー中に止まるため、使う側で <Suspense> で囲み、
 * フォールバックには `<SidebarNavLinks pathname={null} />`（選ばれている表示なし）を出す
 */
export function SidebarNav() {
  return <SidebarNavLinks pathname={usePathname()} />;
}

/** ページのリンクの一覧。pathname が null なら、どのリンクも選ばれている表示にしない */
export function SidebarNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label={messages.nav.label}>
      <ul className="space-y-1">
        {pages.map(({ href, label }) => {
          // ホームは完全一致、それ以外はその下のページ（プロジェクトの詳細など）でも選ばれている表示にする
          const current =
            pathname !== null &&
            (pathname === href ||
              (href !== "/" && pathname.startsWith(`${href}/`)));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  current
                    ? "bg-border/60 font-medium text-foreground"
                    : "text-muted hover:bg-border/40 hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
