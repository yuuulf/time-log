"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import {
  deleteEntryAction,
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
};

/** 記録 1 件の表示。修正ボタンでその場に修正フォームを開き、削除ボタンは確認してから削除する */
export function EntryItem({ entry }: { entry: EntryItemData }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();

  if (editing) {
    return <EditForm entry={entry} onClose={() => setEditing(false)} />;
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 break-words text-foreground">
          {entry.taskName || t.untitled}
        </p>
        <p className="text-sm text-muted tabular-nums">
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
      {deleteError && (
        <p role="alert" className="text-sm text-danger">
          {deleteError}
        </p>
      )}
    </div>
  );
}

function EditForm({
  entry,
  onClose,
}: {
  entry: EntryItemData;
  onClose: () => void;
}) {
  const id = useId();
  const isRunning = entry.endedAt === null;
  // 入力エラーのときに入力した値を残すため、値は state で持つ
  const [values, setValues] = useState({
    taskName: entry.taskName,
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
    name: keyof typeof values,
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
    <form action={action} className="space-y-3 py-3">
      {field("taskName", t.taskName, "text")}
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
