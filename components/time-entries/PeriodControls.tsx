import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import { IconButton } from "@/components/ui/IconButton";
import { IconLink } from "@/components/ui/IconLink";
import { messages } from "@/lib/messages";
import type { HistoryView } from "@/lib/time-entries/history";

const t = messages.history;

/**
 * 期間の切り替え。月の切り替え（期間の指定中は「月ごとの表示」）と期間の入力欄を並べる。
 * リンクとフォームの行き先は basePath（「/history」「/summary」など）
 */
export function PeriodControls({
  view,
  basePath,
}: {
  view: HistoryView;
  basePath: string;
}) {
  return (
    // 下の内容に使える縦の幅を広げるため、月の切り替えと期間の入力欄を 1 行に並べる（幅が足りなければ折り返す）
    <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
      {view.mode === "month" ? (
        <nav aria-label={t.monthNav} className="flex shrink-0 gap-2">
          <IconLink
            href={`${basePath}?month=${view.prevMonth}`}
            icon={ChevronLeft}
            label={t.prevMonth}
          />
          {view.nextMonth ? (
            <IconLink
              href={`${basePath}?month=${view.nextMonth}`}
              icon={ChevronRight}
              label={t.nextMonth}
            />
          ) : (
            <IconButton icon={ChevronRight} label={t.nextMonth} disabled />
          )}
        </nav>
      ) : (
        <IconLink
          href={basePath}
          icon={CalendarDays}
          label={t.monthView}
          className="shrink-0"
        />
      )}
      <RangeForm
        basePath={basePath}
        values={view.mode === "month" ? { from: "", to: "" } : view.values}
        error={view.mode === "rangeError" ? view.error : undefined}
      />
    </div>
  );
}

function RangeForm({
  basePath,
  values,
  error,
}: {
  basePath: string;
  values: { from: string; to: string };
  error?: string;
}) {
  const field = (name: "from" | "to", label: string) => (
    <div className="min-w-0 flex-1">
      {/* ラベルは読み上げ用。画面では「開始日 〜 終了日」の並びで示す */}
      <label htmlFor={`period-${name}`} className="sr-only">
        {label}
      </label>
      <input
        id={`period-${name}`}
        name={name}
        type="date"
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "period-range-error" : undefined}
        className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-2 text-foreground"
      />
    </div>
  );

  return (
    <section
      aria-labelledby="period-range-heading"
      className="min-w-0 flex-1 basis-80 space-y-2"
    >
      <h2 id="period-range-heading" className="sr-only">
        {t.rangeHeading}
      </h2>
      {/* 指定した値が変わったら入力欄を作り直し、URL の値を表示する */}
      <Form
        key={`${values.from}/${values.to}`}
        action={basePath}
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
        <p id="period-range-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
