import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import { IconButton } from "@/components/ui/IconButton";
import { IconLink } from "@/components/ui/IconLink";
import { messages } from "@/lib/messages";
import type { HistoryView } from "@/lib/time-entries/history";
import { EntryList } from "./EntryList";
import type { EntryItemData } from "./EntryItem";

const t = messages.history;
const HISTORY_PATH = "/history";

/** 過去の記録の表示。操作の行（月の切り替えまたは「月ごとの表示」と期間の入力欄）と記録の一覧を並べる */
export function HistoryContent({
  view,
  entries,
}: {
  view: HistoryView;
  entries: EntryItemData[];
}) {
  return (
    <div className="space-y-6">
      {/* 一覧に使える縦の幅を広げるため、月の切り替えと期間の入力欄を 1 行に並べる（幅が足りなければ折り返す） */}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {view.mode === "month" ? (
          <nav aria-label={t.monthNav} className="flex shrink-0 gap-2">
            <IconLink
              href={`${HISTORY_PATH}?month=${view.prevMonth}`}
              icon={ChevronLeft}
              label={t.prevMonth}
            />
            {view.nextMonth ? (
              <IconLink
                href={`${HISTORY_PATH}?month=${view.nextMonth}`}
                icon={ChevronRight}
                label={t.nextMonth}
              />
            ) : (
              <IconButton icon={ChevronRight} label={t.nextMonth} disabled />
            )}
          </nav>
        ) : (
          <IconLink
            href={HISTORY_PATH}
            icon={CalendarDays}
            label={t.monthView}
            className="shrink-0"
          />
        )}
        <RangeForm
          values={view.mode === "month" ? { from: "", to: "" } : view.values}
          error={view.mode === "rangeError" ? view.error : undefined}
        />
      </div>
      {view.mode !== "rangeError" && (
        <EntryList
          entries={entries}
          heading={view.heading}
          emptyMessage={t.empty}
        />
      )}
    </div>
  );
}

function RangeForm({
  values,
  error,
}: {
  values: { from: string; to: string };
  error?: string;
}) {
  const field = (name: "from" | "to", label: string) => (
    <div className="min-w-0 flex-1">
      {/* ラベルは読み上げ用。画面では「開始日 〜 終了日」の並びで示す */}
      <label htmlFor={`history-${name}`} className="sr-only">
        {label}
      </label>
      <input
        id={`history-${name}`}
        name={name}
        type="date"
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "history-range-error" : undefined}
        className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-2 text-foreground"
      />
    </div>
  );

  return (
    <section
      aria-labelledby="history-range-heading"
      className="min-w-0 flex-1 basis-80 space-y-2"
    >
      <h2 id="history-range-heading" className="sr-only">
        {t.rangeHeading}
      </h2>
      {/* 指定した値が変わったら入力欄を作り直し、URL の値を表示する */}
      <Form
        key={`${values.from}/${values.to}`}
        action={HISTORY_PATH}
        className="flex items-center gap-2"
      >
        {field("from", t.from)}
        <span aria-hidden="true" className="text-muted">
          {t.rangeSeparator}
        </span>
        {field("to", t.to)}
        <IconButton type="submit" icon={Search} label={t.show} />
      </Form>
      {error && (
        <p
          id="history-range-error"
          role="alert"
          className="text-sm text-danger"
        >
          {error}
        </p>
      )}
    </section>
  );
}
