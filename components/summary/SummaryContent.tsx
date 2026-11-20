import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { PeriodControls } from "@/components/time-entries/PeriodControls";
import { messages } from "@/lib/messages";
import type { Summary } from "@/lib/summary/summarize";
import { formatDuration, formatMonthDay } from "@/lib/time";
import type { HistoryView } from "@/lib/time-entries/history";

const t = messages.summary;

/**
 * 集計の表示。期間の切り替え、期間の見出し、合計時間と稼働日数、
 * 週ごと・プロジェクトごとの合計時間を上から並べる。入力に誤りがあれば集計は出さない
 */
export function SummaryContent({
  view,
  summary,
}: {
  view: HistoryView;
  /** 入力に誤りがあるときは null */
  summary: Summary | null;
}) {
  return (
    <div className="space-y-6">
      <PeriodControls view={view} basePath="/summary" />
      {view.mode !== "rangeError" && summary && (
        <section aria-labelledby="summary-heading" className="space-y-8">
          <h2
            id="summary-heading"
            className="text-lg font-semibold text-foreground"
          >
            {view.heading}
          </h2>
          <div className="space-y-2">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Stat label={t.total} value={formatDuration(summary.totalMs)} />
              <Stat label={t.workDays} value={t.days(summary.workDays)} />
            </dl>
            <p className="text-xs text-muted">{t.roundingNote}</p>
          </div>
          <WeeklyTable weeks={summary.weeks} />
          <ProjectTable projects={summary.projects} />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}

const thClass = "border-b border-border pb-1 text-sm font-medium text-muted";
const tdClass = "border-b border-border py-2 text-foreground";

function WeeklyTable({ weeks }: { weeks: Summary["weeks"] }) {
  return (
    <section aria-labelledby="summary-weekly" className="space-y-2">
      <h3
        id="summary-weekly"
        className="text-base font-semibold text-foreground"
      >
        {t.weekly}
      </h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={`${thClass} text-left`}>
              {t.week}
            </th>
            <th scope="col" className={`${thClass} text-right`}>
              {t.total}
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.first.getTime()}>
              <th scope="row" className={`${tdClass} text-left font-normal`}>
                {t.weekRange(
                  formatMonthDay(week.first),
                  formatMonthDay(week.last),
                )}
              </th>
              <td className={`${tdClass} text-right tabular-nums`}>
                {formatDuration(week.totalMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ProjectTable({ projects }: { projects: Summary["projects"] }) {
  return (
    <section aria-labelledby="summary-projects" className="space-y-2">
      <h3
        id="summary-projects"
        className="text-base font-semibold text-foreground"
      >
        {t.byProject}
      </h3>
      {projects.length === 0 ? (
        <p className="text-sm text-muted">{t.noEntries}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className={`${thClass} text-left`}>
                {t.project}
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                {t.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map(({ project, totalMs }) => (
              <tr key={project?.id ?? "none"}>
                <th scope="row" className={`${tdClass} text-left font-normal`}>
                  <span className="flex min-w-0 items-center gap-2">
                    {project ? (
                      <ProjectIcon
                        name={project.name}
                        color={project.color}
                        decorative
                      />
                    ) : (
                      // 名前の位置をそろえるため、アイコンと同じ幅を空ける
                      <span aria-hidden="true" className="size-4 shrink-0" />
                    )}
                    <span
                      className={`min-w-0 break-words ${project ? "" : "text-muted"}`}
                    >
                      {project?.name ?? messages.timeEntries.noProject}
                    </span>
                  </span>
                </th>
                <td
                  className={`${tdClass} text-right whitespace-nowrap tabular-nums`}
                >
                  {formatDuration(totalMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
