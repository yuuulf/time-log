"use client";

import { useEffect, useId, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { nextIndex, usePopover } from "@/components/ui/usePopover";
import { messages } from "@/lib/messages";
import { ProjectIcon } from "./ProjectIcon";
import type { EntryProject } from "./types";

const t = messages.timeEntries;

type Props = {
  /** 今のプロジェクト。なければ null */
  value: EntryProject | null;
  /** 選択肢のプロジェクト（登録順） */
  projects: EntryProject[];
  /** 選んだときに呼ぶ。「プロジェクトなし」なら null */
  onChange: (projectId: number | null) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * 色のアイコン付きのプロジェクトのプルダウン（WAI-ARIA の listbox）。
 * ボタンに今のプロジェクトのアイコンと名前を出し、選択肢にもそれぞれの色のアイコンを出す
 */
export function ProjectPicker({
  value,
  projects,
  onChange,
  disabled,
  ...aria
}: Props) {
  const listId = useId();
  const { open, setOpen, close, rootRef, triggerRef, rootProps } = usePopover();
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const options: (EntryProject | null)[] = [null, ...projects];
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => (o?.id ?? null) === (value?.id ?? null)),
  );
  const name = value?.name ?? t.noProject;

  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.focus();
    // 開いたときだけ今の項目にフォーカスする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const select = (option: EntryProject | null) => {
    close(true);
    if ((option?.id ?? null) !== (value?.id ?? null)) {
      onChange(option?.id ?? null);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0" {...rootProps}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.projectButton(name)}
        title={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex w-full min-w-0 items-center gap-2 rounded-md border border-transparent px-2 py-2 text-left text-sm hover:border-border focus-visible:border-border disabled:opacity-50"
        {...aria}
      >
        {value && (
          <ProjectIcon name={value.name} color={value.color} decorative />
        )}
        <span
          className={`min-w-0 flex-1 truncate ${value ? "text-foreground" : "text-muted"}`}
        >
          {name}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted"
        />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={t.project}
          className="absolute top-full left-0 z-10 mt-1 max-h-72 min-w-full overflow-y-auto rounded-md border border-border bg-background py-1 shadow-lg"
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            return (
              <div
                key={option?.id ?? "none"}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onClick={() => select(option)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(option);
                    return;
                  }
                  const next = nextIndex(e.key, index, options.length);
                  if (next === undefined) return;
                  e.preventDefault();
                  optionRefs.current[next]?.focus();
                }}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm whitespace-nowrap hover:bg-border/40 focus:bg-border/40 focus:outline-none"
              >
                {option ? (
                  <ProjectIcon
                    name={option.name}
                    color={option.color}
                    decorative
                  />
                ) : (
                  <span aria-hidden="true" className="size-4 shrink-0" />
                )}
                <span
                  className={`flex-1 ${option ? "text-foreground" : "text-muted"}`}
                >
                  {option?.name ?? t.noProject}
                </span>
                <Check
                  aria-hidden="true"
                  className={`size-4 shrink-0 ${selected ? "text-foreground" : "invisible"}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
