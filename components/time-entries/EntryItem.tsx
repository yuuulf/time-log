"use client";

import {
  startTransition,
  useActionState,
  useId,
  useState,
  useTransition,
} from "react";
import { Check, Pencil, Play, Trash2, X } from "lucide-react";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { ProjectSelect } from "@/components/projects/ProjectSelect";
import type { EntryProject } from "@/components/projects/types";
import { IconButton } from "@/components/ui/IconButton";
import {
  deleteEntryAction,
  startEntryAction,
  updateEntryAction,
  type ActionState,
} from "@/lib/time-entries/actions";
import { messages } from "@/lib/messages";
import { formatDuration, formatTime, toDateTimeLocalValue } from "@/lib/time";

const t = messages.timeEntries;

export type EntryItemData = {
  id: number;
  taskName: string;
  startedAt: Date;
  /** null なら記録中 */
  endedAt: Date | null;
  /** 紐づいたプロジェクト。なければ null */
  project?: EntryProject | null;
};

/**
 * 記録 1 件の表示。修正ボタンでその場に修正フォームを開き、削除ボタンは確認してから削除する。
 * 終了した記録には再開ボタンを置き、同じタスク名・プロジェクトで記録を始める
 */
export function EntryItem({
  entry,
  projects = [],
}: {
  entry: EntryItemData;
  /** 修正フォームのプロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
}) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();
  const [resumeState, resumeAction, resuming] = useActionState(
    startEntryAction,
    {},
  );
  const resumeError = resumeState.errors?.taskName ?? resumeState.errors?.form;
  const isRunning = entry.endedAt === null;

  if (editing) {
    return (
      <EditForm
        entry={entry}
        projects={projects}
        onClose={() => setEditing(false)}
      />
    );
  }

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    startDeleting(async () => {
      const result = await deleteEntryAction(entry.id);
      setDeleteError(result.errors?.form);
    });
  };

  return (
    <div className="space-y-1 py-3">
      {/* 狭い画面ではタスク名を 1 段目、時刻・作業時間・ボタンを 2 段目に置く */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="min-w-0 break-words text-foreground sm:flex-1">
          {entry.taskName || t.untitled}
          {/* プロジェクトはタスク名の右側に色のアイコンで示す（名前はポインタを合わせると出る） */}
          {entry.project && (
            <span className="ml-2 inline-flex align-middle">
              <ProjectIcon
                name={entry.project.name}
                color={entry.project.color}
              />
            </span>
          )}
        </p>
        <div className="flex items-center gap-4">
          {/* 時刻の幅は記録中かどうかで変わるため、作業時間とボタンは右端に寄せて列を揃える */}
          <p className="mr-auto text-sm text-muted tabular-nums sm:w-28">
            {formatTime(entry.startedAt)} –{" "}
            {entry.endedAt ? formatTime(entry.endedAt) : ""}
          </p>
          <p className="w-24 text-right text-sm font-medium text-foreground tabular-nums">
            {entry.endedAt
              ? formatDuration(
                  entry.endedAt.getTime() - entry.startedAt.getTime(),
                )
              : t.running}
          </p>
          <div className="flex gap-2">
            {isRunning ? (
              // 再開ボタンの代わりに同じ大きさの空きを置き、他の行と列を揃える
              <span aria-hidden="true" className="size-10 shrink-0" />
            ) : (
              <form action={resumeAction}>
                <input type="hidden" name="taskName" value={entry.taskName} />
                <input
                  type="hidden"
                  name="projectId"
                  value={entry.project ? String(entry.project.id) : ""}
                />
                <IconButton
                  type="submit"
                  icon={Play}
                  label={t.actions.resume}
                  disabled={resuming}
                />
              </form>
            )}
            <IconButton
              icon={Pencil}
              label={t.actions.edit}
              onClick={() => setEditing(true)}
            />
            <IconButton
              variant="danger"
              icon={Trash2}
              label={t.actions.delete}
              onClick={handleDelete}
              disabled={deleting}
            />
          </div>
        </div>
      </div>
      {(deleteError ?? resumeError) && (
        <p role="alert" className="text-sm text-danger">
          {deleteError ?? resumeError}
        </p>
      )}
    </div>
  );
}

function EditForm({
  entry,
  projects,
  onClose,
}: {
  entry: EntryItemData;
  projects: EntryProject[];
  onClose: () => void;
}) {
  const id = useId();
  const isRunning = entry.endedAt === null;
  // 入力エラーのときに入力した値を残すため、値は state で持つ
  const [values, setValues] = useState({
    taskName: entry.taskName,
    projectId: entry.project ? String(entry.project.id) : "",
    startedAt: toDateTimeLocalValue(entry.startedAt),
    endedAt: entry.endedAt ? toDateTimeLocalValue(entry.endedAt) : "",
  });
  const [state, action, saving] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateEntryAction(entry.id, prev, formData);
      if (result.ok) onClose();
      return result;
    },
    {},
  );
  const errors = state.errors ?? {};

  const field = (
    name: "taskName" | "startedAt" | "endedAt",
    label: string,
    type: "text" | "datetime-local",
  ) => (
    <div className="space-y-1">
      <label htmlFor={`${id}-${name}`} className="block text-sm text-muted">
        {label}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type={type}
        step={type === "datetime-local" ? 1 : undefined}
        value={values[name]}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
      />
      {errors[name] && (
        <p id={`${id}-${name}-error`} className="text-sm text-danger">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    // <form action> は送信後にフォームをリセットし、選んだプロジェクトが戻ってしまう。
    // 入力エラーのときに値を残すため、送信は onSubmit で受けて action を呼ぶ
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-3 py-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {field("taskName", t.taskName, "text")}
        <div className="space-y-1">
          <label
            htmlFor={`${id}-projectId`}
            className="block text-sm text-muted"
          >
            {t.project}
          </label>
          <ProjectSelect
            id={`${id}-projectId`}
            projects={projects}
            value={values.projectId}
            onChange={(e) =>
              setValues({ ...values, projectId: e.target.value })
            }
            aria-invalid={errors.projectId ? true : undefined}
            aria-describedby={
              errors.projectId ? `${id}-projectId-error` : undefined
            }
            className="w-full"
          />
          {errors.projectId && (
            <p id={`${id}-projectId-error`} className="text-sm text-danger">
              {errors.projectId}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("startedAt", t.startedAt, "datetime-local")}
        {!isRunning && field("endedAt", t.endedAt, "datetime-local")}
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}
      <div className="flex gap-2">
        <IconButton
          type="submit"
          variant="primary"
          icon={Check}
          label={t.actions.save}
          disabled={saving}
        />
        <IconButton icon={X} label={t.actions.cancel} onClick={onClose} />
      </div>
    </form>
  );
}
