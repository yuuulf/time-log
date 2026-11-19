"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

/**
 * ボタンで開くメニュー・プルダウンに共通の開閉の処理。
 * 外側を押したとき・フォーカスが外へ出たとき（Tab など）に閉じ、Escape で閉じてボタンにフォーカスを戻す。
 * 返す rootRef をボタンと一覧を囲む要素に、triggerRef をボタンに、rootProps を囲む要素に付ける
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /** 閉じる。returnFocus が true ならボタンにフォーカスを戻す */
  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const rootProps = {
    onKeyDown: (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    },
    onBlur: (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (open && next && !rootRef.current?.contains(next)) setOpen(false);
    },
  };

  return { open, setOpen, close, rootRef, triggerRef, rootProps };
}

/** 一覧の中でフォーカスを移す先の位置を、押したキーから求める。対象のキーでなければ undefined */
export function nextIndex(
  key: string,
  current: number,
  length: number,
): number | undefined {
  switch (key) {
    case "ArrowDown":
      return (current + 1) % length;
    case "ArrowUp":
      return (current - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return undefined;
  }
}
