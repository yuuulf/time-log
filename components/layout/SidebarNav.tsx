"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { messages } from "@/lib/messages";

const pages = [
  { href: "/", label: messages.nav.home },
  { href: "/history", label: messages.history.title },
] as const;

/** サイドバーのページのリンク。今いるページのリンクに aria-current を付ける */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label={messages.nav.label}>
      <ul className="space-y-1">
        {pages.map(({ href, label }) => {
          const current = pathname === href;
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
