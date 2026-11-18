"use client";

import { useActionState, useId, useState } from "react";
import { Play, Square } from "lucide-react";
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
  running: { taskName: string; startedAt: Date } | null;
  /** タスク名の入力候補 */
  suggestions: string[];
};

/** 記録の開始・終了。入力欄と開始ボタンは記録中でも表示し、別のタスクに切り替えられるようにする */
export function StartStopForm({ running, suggestions }: Props) {
  const id = useId();
  const [taskName, setTaskName] = useState("");
  const [state, startAction, starting] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await startEntryAction(prev, formData);
      if (result.ok) setTaskName("");
      return result;
    },
    {},
  );
  const [, stopAction, stopping] = useActionState(async () => {
    await stopEntryAction();
  }, undefined);
  const taskNameError = state.errors?.taskName;

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
            <p className="font-medium break-words text-foreground">
              {running.taskName || t.untitled}
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

      <form action={startAction} className="space-y-1">
        <label htmlFor={`${id}-task-name`} className="sr-only">
          {t.taskName}
        </label>
        <div className="flex gap-2">
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
      </form>
    </div>
  );
}
