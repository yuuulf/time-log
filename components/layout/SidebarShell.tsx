"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { messages } from "@/lib/messages";

const SIDEBAR_ID = "sidebar";

/**
 * サイドバーの枠。幅 768px 以上では本文の左に常に表示し、
 * それより狭いときは上部のメニューボタンで本文の上に重ねて開く。
 * 中身は 1 か所だけに描画し、幅による違いは CSS で出し分ける
 */
export function SidebarShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // 開いたら閉じるボタンへ、閉じたらメニューボタンへフォーカスを移す
  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    } else if (wasOpen.current) {
      menuRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 md:hidden">
        <IconButton
          ref={menuRef}
          icon={Menu}
          label={messages.nav.menu}
          aria-expanded={open}
          aria-controls={SIDEBAR_ID}
          onClick={() => setOpen(true)}
        />
        <Link href="/" className="text-lg font-semibold text-foreground">
          {messages.app.name}
        </Link>
      </div>
      {open && (
        <div
          aria-hidden="true"
          data-sidebar-backdrop=""
          onClick={close}
          className="fixed inset-0 z-40 bg-foreground/30 md:hidden"
        />
      )}
      {/* 中のリンクを選んだら閉じる（中身は Server Component なので、ここでまとめて受ける） */}
      <aside
        id={SIDEBAR_ID}
        onClick={(e) => {
          if ((e.target as Element).closest("a")) close();
        }}
        // 開くときは visibility をすぐ切り替えて閉じるボタンにフォーカスできるようにし、
        // 閉じるときは visibility も遷移させて、隠れ終わるまで表示を残す
        className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 overflow-y-auto border-r border-border bg-background p-4 md:visible md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          open
            ? "visible translate-x-0 transition-transform"
            : "invisible -translate-x-full transition-[translate,visibility]"
        }`}
      >
        <div className="mb-2 flex justify-end md:hidden">
          <IconButton
            ref={closeRef}
            icon={X}
            label={messages.nav.close}
            onClick={close}
          />
        </div>
        <div className="space-y-8">{children}</div>
      </aside>
    </>
  );
}
