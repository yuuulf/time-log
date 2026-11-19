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

/** 過去の記録の表示。月の切り替えまたは「月ごとの表示」、期間の入力欄、記録の一覧を並べる */
export function HistoryContent({
  view,
  entries,
}: {
  view: HistoryView;
  entries: EntryItemData[];
}) {
  return (
    <div className="space-y-6">
      {view.mode === "month" ? (
        <nav aria-label={t.monthNav} className="flex gap-2">
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
        <IconLink href={HISTORY_PATH} icon={CalendarDays} label={t.monthView} />
      )}
      <RangeForm
        values={view.mode === "month" ? { from: "", to: "" } : view.values}
        error={view.mode === "rangeError" ? view.error : undefined}
      />
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
    <div className="space-y-1">
      <label htmlFor={`history-${name}`} className="block text-sm text-muted">
        {label}
      </label>
      <input
        id={`history-${name}`}
        name={name}
        type="date"
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "history-range-error" : undefined}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
      />
    </div>
  );

  return (
    <section aria-labelledby="history-range-heading" className="space-y-2">
      <h2 id="history-range-heading" className="text-sm font-medium text-muted">
        {t.rangeHeading}
      </h2>
      {/* 指定した値が変わったら入力欄を作り直し、URL の値を表示する */}
      <Form
        key={`${values.from}/${values.to}`}
        action={HISTORY_PATH}
        className="flex items-end gap-2"
      >
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {field("from", t.from)}
          {field("to", t.to)}
        </div>
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
