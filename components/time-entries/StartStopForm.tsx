"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { Play, Square } from "lucide-react";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import type { EntryProject } from "@/components/projects/types";
import { IconButton } from "@/components/ui/IconButton";
import {
  startEntryAction,
  stopEntryAction,
  type ActionState,
} from "@/lib/time-entries/actions";
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
  /** タスク名の入力候補 */
  suggestions: string[];
  /** プロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
};

/** 記録の開始・終了。入力欄と開始ボタンは記録中でも表示し、別のタスクに切り替えられるようにする */
export function StartStopForm({ running, suggestions, projects = [] }: Props) {
  const id = useId();
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [state, startAction, starting] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await startEntryAction(prev, formData);
      if (result.ok) {
        setTaskName("");
        setProjectId(null);
      }
      return result;
    },
    {},
  );
  const [, stopAction, stopping] = useActionState(async () => {
    await stopEntryAction();
  }, undefined);
  const taskNameError = state.errors?.taskName;
  const projectError = state.errors?.projectId;

  return (
    <div className="space-y-4">
      {running && (
        <section
          aria-labelledby={`${id}-running`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
        >
          <div className="min-w-0">
            {/* 開始時刻は見出しの右に並べる */}
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 id={`${id}-running`} className="text-xs text-muted">
                {t.runningHeading}
              </h2>
              <p className="text-xs text-muted tabular-nums">
                {t.startedAt} {formatTime(running.startedAt)}
              </p>
            </div>
            {/* 一覧と同じくプロジェクト → タスク名の順。プロジェクトは名前も文字で出し、アイコンは読み上げの対象から外す */}
            {running.project && (
              <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                <ProjectIcon
                  name={running.project.name}
                  color={running.project.color}
                  decorative
                />
                <span className="min-w-0 break-words">
                  {running.project.name}
                </span>
              </p>
            )}
            <p className="font-medium break-words text-foreground">
              {running.taskName || t.untitled}
            </p>
          </div>
          <form action={stopAction}>
            <IconButton
              type="submit"
              icon={Square}
              label={t.actions.stop}
              disabled={stopping}
            />
          </form>
        </section>
      )}

      {/* <form action> は送信後にフォームをリセットし、選んだプロジェクトが戻ってしまう。
          入力エラーのときに値を残すため、送信は onSubmit で受けて action を呼ぶ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => startAction(formData));
        }}
        className="space-y-1"
      >
        <label htmlFor={`${id}-task-name`} className="sr-only">
          {t.taskName}
        </label>
        {/* 狭い画面ではプロジェクトの選択を 2 段目に置く */}
        <div className="flex flex-wrap gap-2">
          <input
            id={`${id}-task-name`}
            name="taskName"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder={t.taskNamePlaceholder}
            list={`${id}-suggestions`}
            autoComplete="off"
            aria-invalid={taskNameError ? true : undefined}
            aria-describedby={taskNameError ? `${id}-error` : undefined}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-foreground"
          />
          {/* 一覧と同じ色のアイコン付きのプルダウン。選んだ id は hidden の欄で送る */}
          <div className="order-last w-full sm:order-none sm:w-72">
            <ProjectPicker
              variant="field"
              value={projects.find((p) => p.id === projectId) ?? null}
              projects={projects}
              onChange={setProjectId}
              aria-invalid={projectError ? true : undefined}
              aria-describedby={
                projectError ? `${id}-project-error` : undefined
              }
            />
            <input
              type="hidden"
              name="projectId"
              value={projectId === null ? "" : String(projectId)}
            />
          </div>
          <IconButton
            type="submit"
            variant="primary"
            icon={Play}
            label={t.actions.start}
            disabled={starting}
          />
        </div>
        <datalist id={`${id}-suggestions`}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {taskNameError && (
          <p id={`${id}-error`} role="alert" className="text-sm text-danger">
            {taskNameError}
          </p>
        )}
        {projectError && (
          <p
            id={`${id}-project-error`}
            role="alert"
            className="text-sm text-danger"
          >
            {projectError}
          </p>
        )}
      </form>
    </div>
  );
}
