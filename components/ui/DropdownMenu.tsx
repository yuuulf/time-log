"use client";

import { useEffect, useId, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { iconControlClassName } from "./IconButton";
import { nextIndex, usePopover } from "./usePopover";

export type DropdownMenuItem = {
  /** 項目の文字（名詞形） */
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "danger";
};

type Props = {
  /** ボタンのアイコン */
  icon: LucideIcon;
  /** ボタンの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
  items: DropdownMenuItem[];
  disabled?: boolean;
};

/**
 * アイコンのボタンで開くメニュー（WAI-ARIA の menu button）。
 * 項目はアイコンと文字で表示する。開くと最初の項目にフォーカスし、上下の矢印キー・Home・End で移る
 */
export function DropdownMenu({ icon: Icon, label, items, disabled }: Props) {
  const menuId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open) itemRefs.current[0]?.focus();
  }, [open]);

  const select = (item: DropdownMenuItem) => {
    close(true);
    item.onSelect();
  };

  return (
    <div ref={rootRef} className="relative" {...rootProps}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={iconControlClassName("secondary")}
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute top-full right-0 z-10 mt-1 min-w-32 rounded-md border border-border bg-background py-1 shadow-lg"
        >
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => select(item)}
                onKeyDown={(e) => {
                  const next = nextIndex(e.key, index, items.length);
                  if (next === undefined) return;
                  e.preventDefault();
                  itemRefs.current[next]?.focus();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-border/40 focus:bg-border/40 focus:outline-none ${
                  item.variant === "danger" ? "text-danger" : "text-foreground"
                }`}
              >
                <ItemIcon aria-hidden="true" className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
