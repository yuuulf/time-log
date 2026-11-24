"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EntryProject } from "@/components/projects/types";
import { projectColorBlockClass } from "@/lib/projects/colors";
import { messages } from "@/lib/messages";
import { formatDuration, formatTime } from "@/lib/time";
import {
  DAY_MINUTES,
  MIN_BLOCK_MINUTES,
  initialScrollMinute,
  layoutTimeline,
  minuteOfDay,
  rangeFromClick,
  type TimeRange,
} from "@/lib/time-entries/timeline";
import type { EntryItemData } from "./EntryItem";
import { TimelineEntryEditor } from "./TimelineEntryEditor";

const t = messages.timeEntries;

/** 1 分の高さ（px）。1 時間 48px */
export const MINUTE_PX = 0.8;
/** 帯の最小の高さ（px）。短い記録も選べるようにする（重なりの判断と同じ長さ） */
const MIN_BLOCK_PX = MIN_BLOCK_MINUTES * MINUTE_PX;
/** 開いたときに、見せる時刻より何分前を枠の上端にするか */
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

/** タイムラインの 1 日の列 */
export type TimelineDay = {
  /** その日の 0 時（日本時間） */
  dayStart: Date;
  /** その日に開始した記録（順は問わない） */
  entries: EntryItemData[];
};

type Props = {
  /** 左から並べる日の列（今日のタイムラインは 1 日、週のカレンダーは 7 日） */
  days: TimelineDay[];
  /** 描いた時点の時刻。今の時刻の線と、今より後の場所に使う */
  now: Date;
  /** 帯の右に残す幅。記録のある時間でも、ここを選んで記録を追加できる */
  gutter: string;
  /** 列の見出し（週のカレンダーで使う）。枠の上に固定して、日付とその日の合計時間を出す */
  dayHeaders?: { label: string; totalMs: number }[];
  /** 入力欄のプロジェクトの選択肢（登録順） */
  projects: EntryProject[];
  /** 入力欄のタスク名の入力候補 */
  suggestions: string[];
};

/** 開いている入力欄。returnFocus は Escape・「閉じる」で閉じたときにフォーカスを戻す場所 */
type EditorState = (
  { mode: "create"; range: TimeRange } | { mode: "edit"; entryId: number }
) & { dayIndex: number; top: number; returnFocus: HTMLElement | null };

/**
 * タイムラインの格子。左に 0 時〜24 時の目盛り、右に日の列を並べ、記録をプロジェクトの色の帯で置く。
 * 帯のない場所を選ぶとその日の記録の追加の入力欄を、帯を選ぶと修正の入力欄を開く（入力欄は同時に 1 つ）。
 * 今日の列には今の時刻の線を引き、今より後の場所では追加しない。開いたときは見せる時刻のあたりまでスクロールする
 */
export function TimelineBoard({
  days,
  now,
  gutter,
  dayHeaders,
  projects,
  suggestions,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTop = Math.max(
      0,
      (initialScrollMinute(days, now) - SCROLL_LEAD_MINUTES) * MINUTE_PX,
    );
    // 開いたときだけ合わせる（記録を操作するたびにスクロールを戻さない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const editingEntry =
    editor?.mode === "edit"
      ? days[editor.dayIndex]?.entries.find((e) => e.id === editor.entryId)
      : undefined;

  /** 入力欄を開く。上端は minute の位置にし、入力欄が下にはみ出さないよう収める */
  const openEditor = (
    target:
      { mode: "create"; range: TimeRange } | { mode: "edit"; entryId: number },
    dayIndex: number,
    minute: number,
  ) => {
    const active = document.activeElement;
    setEditor({
      ...target,
      dayIndex,
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

  const closeEditor = useCallback(
    (returnFocus: boolean) => {
      const target = editor?.returnFocus;
      setEditor(null);
      if (returnFocus) target?.focus();
    },
    [editor],
  );

  // 入力欄の横の位置。1 日なら右寄せ（今までどおり）、複数の日なら選んだ列の左端に合わせ、右にはみ出さないよう収める
  const editorLeft =
    editor && days.length > 1
      ? `min(calc(100% * ${editor.dayIndex / days.length}), calc(100% - 18rem))`
      : undefined;

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={t.timeline.label}
      className="max-h-[35rem] overflow-y-auto border-b border-border"
    >
      {dayHeaders && (
        // スクロールしても日付が見えるよう、枠の上に固定する。目盛りの列と幅をそろえる
        <div className="sticky top-0 z-30 flex border-b border-border bg-background pl-14">
          {dayHeaders.map(({ label, totalMs }) => (
            <div
              key={label}
              data-testid="timeline-day-header"
              className="min-w-0 flex-1 border-l border-border px-1 py-1 text-center text-xs"
            >
              <p className="truncate font-medium text-foreground">{label}</p>
              <p className="truncate text-muted tabular-nums">
                <span className="sr-only">{t.dayTotal} </span>
                {formatDuration(totalMs)}
              </p>
            </div>
          ))}
        </div>
      )}
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
        <div className="absolute inset-y-0 right-0 left-14 flex">
          {days.map((day, dayIndex) => (
            <DayColumn
              key={day.dayStart.getTime()}
              day={day}
              now={now}
              gutter={gutter}
              bordered={days.length > 1}
              onCreate={(range, minute) =>
                openEditor({ mode: "create", range }, dayIndex, minute)
              }
              onEdit={(entryId, minute) =>
                openEditor({ mode: "edit", entryId }, dayIndex, minute)
              }
            />
          ))}
          {editor?.mode === "create" && (
            <TimelineEntryEditor
              key={`create-${editor.range.startedAt.getTime()}`}
              mode="create"
              range={editor.range}
              projects={projects}
              suggestions={suggestions}
              top={editor.top}
              left={editorLeft}
              onClose={closeEditor}
            />
          )}
          {/* 保存のあとは新しくなった記録を渡す。記録が消えていたら（削除）出さない */}
          {editingEntry && editor && (
            <TimelineEntryEditor
              key={`edit-${editingEntry.id}`}
              mode="edit"
              entry={editingEntry}
              projects={projects}
              suggestions={suggestions}
              top={editor.top}
              left={editorLeft}
              onClose={closeEditor}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 1 日の列。帯のない場所を選ぶとその時刻から追加の入力欄を開く（今より後なら開かない）。
 * 今より後の場所には、追加用のポインタを出さない透明な領域を帯より下に重ねる
 */
function DayColumn({
  day,
  now,
  gutter,
  bordered,
  onCreate,
  onEdit,
}: {
  day: TimelineDay;
  now: Date;
  gutter: string;
  bordered: boolean;
  onCreate: (range: TimeRange, minute: number) => void;
  onEdit: (entryId: number, minute: number) => void;
}) {
  const { dayStart, entries } = day;
  const blocks = layoutTimeline(entries, dayStart);
  const dayEnd = dayStart.getTime() + DAY_MINUTES * 60 * 1000;
  const isToday = now >= dayStart && now.getTime() < dayEnd;
  const isFuture = now < dayStart;
  const nowMinute = minuteOfDay(now, dayStart);
  // 今より後の領域の上端。昨日以前の列にはない
  const futureTop = isFuture ? 0 : isToday ? nowMinute * MINUTE_PX : null;

  return (
    <div
      data-testid="timeline-area"
      className={`relative min-w-0 flex-1 cursor-copy ${bordered ? "border-l border-border" : ""}`}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const minute = (event.clientY - rect.top) / MINUTE_PX;
        const range = rangeFromClick(minute, entries, new Date(), dayStart);
        if (range) onCreate(range, minuteOfDay(range.startedAt, dayStart));
      }}
    >
      {/* 今より後は追加できないので、追加用のポインタを出さない（帯より下に重ね、クリックは背景のクリックにしない） */}
      {futureTop !== null && (
        <div
          aria-hidden="true"
          data-testid="timeline-future"
          className="absolute inset-x-0 bottom-0 cursor-auto"
          style={{ top: futureTop }}
        />
      )}
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
              onEdit(block.id, block.startMinute);
            }}
            aria-label={label}
            title={label}
            data-entry-id={block.id}
            // ボタンは既定で中身を上下の真ん中に置くので、長い帯でも文字を上端（開始時刻の近く）に寄せる
            className={`absolute flex items-start overflow-hidden rounded-sm border-l-4 px-2 py-0.5 text-left text-xs text-foreground hover:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${projectColorBlockClass(block.project?.color ?? null)}`}
            style={{
              top: block.startMinute * MINUTE_PX,
              height,
              // 右端に追加のために選べる幅を残し、残りを段の数で分ける
              left: `calc((100% - ${gutter}) * ${block.column / block.columns})`,
              width: `calc((100% - ${gutter}) / ${block.columns} - 4px)`,
            }}
          >
            <span className="block w-full min-w-0 truncate">
              <span className="font-medium">{name}</span>{" "}
              <span className="text-muted tabular-nums">{range}</span>
            </span>
          </button>
        );
      })}
      {isToday && (
        <div
          aria-hidden="true"
          data-testid="timeline-now"
          className="pointer-events-none absolute inset-x-0 h-px bg-primary"
          style={{ top: nowMinute * MINUTE_PX }}
        />
      )}
    </div>
  );
}
