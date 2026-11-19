import { ProjectIcon } from "@/components/projects/ProjectIcon";
import type { EntryProject } from "@/components/projects/types";
import { messages } from "@/lib/messages";
import { formatTime } from "@/lib/time";

const t = messages.timeEntries;

type Props = {
  /** 記録中の記録。なければ null */
  running: {
    taskName: string;
    startedAt: Date;
    project?: EntryProject | null;
  } | null;
};

/** サイドバーの記録中のタスク。表示だけで、停止はトップページから行う */
export function RunningTaskView({ running }: Props) {
  return (
    <section aria-labelledby="sidebar-running-heading" className="space-y-1">
      <h2 id="sidebar-running-heading" className="text-xs text-muted">
        {t.runningHeading}
      </h2>
      {running ? (
        <>
          {/* 開始時刻は見出しのすぐ下に置く */}
          <p className="text-xs text-muted tabular-nums">
            {t.startedAt} {formatTime(running.startedAt)}
          </p>
          {/* 一覧と同じくプロジェクト → タスク名の順。プロジェクトはアイコンだけ（名前はポインタを合わせると出る） */}
          <p className="text-sm font-medium break-words text-foreground">
            {running.project && (
              <span className="mr-2 inline-flex align-middle">
                <ProjectIcon
                  name={running.project.name}
                  color={running.project.color}
                />
              </span>
            )}
            {running.taskName || t.untitled}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted">{messages.nav.noRunning}</p>
      )}
    </section>
  );
}
