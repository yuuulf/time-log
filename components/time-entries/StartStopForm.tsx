"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { Play, Square } from "lucide-react";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { ProjectSelect } from "@/components/projects/ProjectSelect";
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
  const [projectId, setProjectId] = useState("");
  const [state, startAction, starting] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await startEntryAction(prev, formData);
      if (result.ok) {
        setTaskName("");
        setProjectId("");
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
            <h2 id={`${id}-running`} className="text-xs text-muted">
              {t.runningHeading}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 font-medium break-words text-foreground">
              <span className="min-w-0">{running.taskName || t.untitled}</span>
              {/* 記録中の枠だけはプロジェクト名も文字で出す。アイコンは読み上げの対象から外す */}
              {running.project && (
                <span className="inline-flex items-center gap-1.5 text-sm font-normal text-muted">
                  <ProjectIcon
                    name={running.project.name}
                    color={running.project.color}
                    decorative
                  />
                  {running.project.name}
                </span>
              )}
            </p>
            <p className="text-sm text-muted">
              {t.startedAt} {formatTime(running.startedAt)}
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
          <label htmlFor={`${id}-project`} className="sr-only">
            {t.project}
          </label>
          <ProjectSelect
            id={`${id}-project`}
            projects={projects}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-invalid={projectError ? true : undefined}
            aria-describedby={projectError ? `${id}-project-error` : undefined}
            className="order-last w-full sm:order-none sm:w-48"
          />
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
