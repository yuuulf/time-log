"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import type { EntryProject } from "@/components/projects/types";
import { IconButton } from "@/components/ui/IconButton";
import { projectColorBlockClass } from "@/lib/projects/colors";
import { messages } from "@/lib/messages";
import {
  dayRange,
  entryDurationMs,
  formatDateHeading,
  formatTime,
} from "@/lib/time";
import {
  DAY_MINUTES,
  layoutTimeline,
  minuteOfDay,
  rangeBeforeNow,
  rangeFromClick,
  type TimeRange,
} from "@/lib/time-entries/timeline";
import { DayHeading } from "./DayHeading";
import type { EntryItemData } from "./EntryItem";
import { TimelineEntryEditor } from "./TimelineEntryEditor";

const t = messages.timeEntries;

/** 1 分の高さ（px）。1 時間 48px */
export const MINUTE_PX = 0.8;
/** 帯の最小の高さ（px）。短い記録も選べるようにする */
const MIN_BLOCK_PX = 20;
/** 開いたときに、今の時刻より何分前を枠の上端にするか */
const SCROLL_LEAD_MINUTES = 60;

/** 入力欄が下にはみ出さないよう、上端をこの高さ（px）ぶん上に収める */
const EDITOR_HEIGHT_PX = 300;

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** 帯の時刻の文言（記録中は終了の代わりに「記録中」） */
function rangeText({ startedAt, endedAt }: EntryItemData): string {
  return t.timeline.range(
    formatTime(startedAt),
    endedAt ? formatTime(endedAt) : t.running,
  );
}

type Props = {
  /** 今日に開始した記録（順は問わない） */
  entries: EntryItemData[];
  /** 描いた時点の時刻。今の時刻の線と日付に使う */
  now: Date;
  /** 一覧の見出し。省略時は「今日の記録」 */
  heading?: string;
  /** 見出しの横に置く要素（表示の切り替えなど） */
  headingAction?: ReactNode;
  /** 入力欄のプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
  /** 入力欄のタスク名の入力候補 */
  suggestions?: string[];
};

/** 開いている入力欄。returnFocus は Escape・「閉じる」で閉じたときにフォーカスを戻す場所 */
type EditorState = (
  { mode: "create"; range: TimeRange } | { mode: "edit"; entry: EntryItemData }
) & { top: number; returnFocus: HTMLElement | null };

/**
 * 今日の記録のタイムライン。上から 0 時〜24 時の目盛りを並べ、記録をプロジェクトの色の帯で置く。
 * 記録中の記録は決まった高さの帯にする。開いたときは今の時刻のあたりまでスクロールする
 */
export function EntryTimeline({
  entries,
  now,
  heading = t.listHeading,
  headingAction,
  projects = [],
  suggestions = [],
}: Props) {
  const dayStart = dayRange(now).from;
  const blocks = layoutTimeline(entries, dayStart);
  const nowMinute = minuteOfDay(now, dayStart);
  const totalMs = entries.reduce((sum, e) => sum + entryDurationMs(e), 0);
  const dateHeading = formatDateHeading(now);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = Math.max(
      0,
      (nowMinute - SCROLL_LEAD_MINUTES) * MINUTE_PX,
    );
    // 開いたときだけ合わせる（記録を操作するたびにスクロールを戻さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editor, setEditor] = useState<EditorState | null>(null);

  /** 入力欄を開く。上端は minute の位置にし、入力欄が下にはみ出さないよう収める */
  const openEditor = (
    target:
      | { mode: "create"; range: TimeRange }
      | { mode: "edit"; entry: EntryItemData },
    minute: number,
  ) => {
    const active = document.activeElement;
    setEditor({
      ...target,
      top: Math.max(
        0,
        Math.min(
          minute * MINUTE_PX,
          DAY_MINUTES * MINUTE_PX - EDITOR_HEIGHT_PX,
        ),
      ),
      returnFocus:
        active instanceof HTMLElement && active !== document.body
          ? active
          : null,
    });
  };
  const openCreate = (range: TimeRange) =>
    openEditor(
      { mode: "create", range },
      minuteOfDay(range.startedAt, dayStart),
    );

  const closeEditor = useCallback(
    (returnFocus: boolean) => {
      const target = editor?.returnFocus;
      setEditor(null);
      if (returnFocus) target?.focus();
    },
    [editor],
  );

  /**
   * 帯のない場所を選んだら、その時刻から入力欄を開く（今より後なら開かない）。
   * キーボードでは「記録の追加」ボタンで代える
   */
  const handleAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const minute = (event.clientY - rect.top) / MINUTE_PX;
    const range = rangeFromClick(minute, entries, new Date(), dayStart);
    if (range) openCreate(range);
  };

  return (
    <section aria-labelledby="entry-list-heading" className="space-y-4">
      <div className="flex items-center gap-3">
        <h2
          id="entry-list-heading"
          className="text-lg font-semibold text-foreground"
        >
          {heading}
        </h2>
        {headingAction}
        <IconButton
          icon={Plus}
          label={t.timeline.add}
          className="ml-auto"
          onClick={() => openCreate(rangeBeforeNow(new Date()))}
        />
      </div>
      <section aria-label={dateHeading}>
        <DayHeading heading={dateHeading} totalMs={totalMs} />
        <div
          ref={scrollRef}
          role="group"
          aria-label={t.timeline.label}
          className="max-h-[32rem] overflow-y-auto border-b border-border"
        >
          <div className="relative" style={{ height: DAY_MINUTES * MINUTE_PX }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                aria-hidden="true"
                className="absolute inset-x-0 border-t border-border"
                style={{ top: hour * 60 * MINUTE_PX }}
              >
                <span className="block w-12 pt-0.5 pr-2 text-right text-xs text-muted tabular-nums">
                  {hour}:00
                </span>
              </div>
            ))}
            {/* 帯のない場所を選ぶと記録を追加する。キーボードでは見出しの横の「記録の追加」ボタンで代える */}
            <div
              data-testid="timeline-area"
              className="absolute inset-y-0 right-0 left-14 cursor-copy"
              onClick={handleAreaClick}
            >
              {blocks.map((block) => {
                const name = block.taskName || t.untitled;
                const range = rangeText(block);
                const label = t.timeline.entryLabel(name, range);
                const height = Math.max(
                  MIN_BLOCK_PX,
                  (block.endMinute - block.startMinute) * MINUTE_PX,
                );
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={(event) => {
                      // クリックではフォーカスしないブラウザがあるので、閉じたときに戻す先として先にフォーカスする
                      event.currentTarget.focus();
                      openEditor(
                        { mode: "edit", entry: block },
                        block.startMinute,
                      );
                    }}
                    aria-label={label}
                    title={label}
                    data-entry-id={block.id}
                    className={`absolute overflow-hidden rounded-sm border-l-4 px-2 py-0.5 text-left text-xs text-foreground hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${projectColorBlockClass(block.project?.color ?? null)}`}
                    style={{
                      top: block.startMinute * MINUTE_PX,
                      height,
                      left: `${(block.column / block.columns) * 100}%`,
                      width: `calc(${100 / block.columns}% - 4px)`,
                    }}
                  >
                    <span className="block truncate font-medium">{name}</span>
                    <span className="block truncate text-muted tabular-nums">
                      {range}
                    </span>
                  </button>
                );
              })}
              <div
                aria-hidden="true"
                data-testid="timeline-now"
                className="pointer-events-none absolute inset-x-0 h-px bg-primary"
                style={{ top: nowMinute * MINUTE_PX }}
              />
              {editor && (
                <TimelineEntryEditor
                  key={
                    editor.mode === "edit"
                      ? `edit-${editor.entry.id}`
                      : `create-${editor.range.startedAt.getTime()}`
                  }
                  entryId={editor.mode === "edit" ? editor.entry.id : undefined}
                  initial={
                    editor.mode === "edit"
                      ? {
                          taskName: editor.entry.taskName,
                          startedAt: editor.entry.startedAt,
                          endedAt: editor.entry.endedAt,
                          project: editor.entry.project ?? null,
                        }
                      : {
                          taskName: "",
                          startedAt: editor.range.startedAt,
                          endedAt: editor.range.endedAt,
                          project: null,
                        }
                  }
                  projects={projects}
                  suggestions={suggestions}
                  top={editor.top}
                  onClose={closeEditor}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
