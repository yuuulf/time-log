"use client";

import {
  useActionState,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { MoreVertical, Play, Trash2 } from "lucide-react";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import type { EntryProject } from "@/components/projects/types";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import {
  deleteEntryAction,
  startEntryAction,
  updateEntryAction,
  type ActionState,
} from "@/lib/time-entries/actions";
import { messages } from "@/lib/messages";
import {
  formatDuration,
  formatTime,
  parseDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/time";

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

/** 行で直接編集する欄 */
type Field = "taskName" | "startedAt" | "endedAt";
type Values = Record<Field, string>;
type Errors = NonNullable<ActionState["errors"]>;

const FIELDS: Field[] = ["taskName", "startedAt", "endedAt"];

/** 保存済みの記録から、入力欄の値を作る */
function toValues(entry: EntryItemData): Values {
  return {
    taskName: entry.taskName,
    startedAt: toDateTimeLocalValue(entry.startedAt),
    endedAt: entry.endedAt ? toDateTimeLocalValue(entry.endedAt) : "",
  };
}

/**
 * 2 つの入力値が同じかどうか。時刻はブラウザが秒の 0 を省くことがあるので、日時として比べる
 */
function sameValue(field: Field, a: string, b: string): boolean {
  if (field === "taskName" || a === b) return a === b;
  const left = parseDateTimeLocalValue(a);
  const right = parseDateTimeLocalValue(b);
  return left !== null && right !== null && left.getTime() === right.getTime();
}

/**
 * 記録 1 件の行。タスク名・開始時刻・終了時刻をその場で編集し、値を変えてフォーカスが外れたとき
 * （または Enter）に保存する。Escape でその欄を保存済みの値に戻す。
 * 「その他の操作」のメニューの「削除」は確認してから削除する。終了した記録には再開ボタンを置き、同じタスク名・プロジェクトで記録を始める
 */
export function EntryItem({
  entry,
  projects = [],
}: {
  entry: EntryItemData;
  /** プロジェクトの選択肢（登録順） */
  projects?: EntryProject[];
}) {
  const id = useId();
  const isRunning = entry.endedAt === null;
  const saved = toValues(entry);

  // 入力エラーのときに入力した値を残すため、値は state で持つ
  const [values, setValues] = useState(saved);
  // 保存の後に props が新しくなったら、編集中でない欄（前の保存済みの値のままの欄）だけを合わせる。
  // 行を作り直すと、Tab で次の欄に移った直後のフォーカスや入力中の値が失われるため
  const [prevSaved, setPrevSaved] = useState(saved);
  if (FIELDS.some((f) => saved[f] !== prevSaved[f])) {
    setPrevSaved(saved);
    setValues((current) => {
      const next = { ...current };
      for (const f of FIELDS) {
        if (sameValue(f, current[f], prevSaved[f])) next[f] = saved[f];
      }
      return next;
    });
  }
  // プロジェクトも同じく、エラーのときに選んだ値を残し、props が変わったら合わせる
  const savedProjectId = entry.project?.id ?? null;
  const [projectId, setProjectId] = useState(savedProjectId);
  const [prevProjectId, setPrevProjectId] = useState(savedProjectId);
  if (savedProjectId !== prevProjectId) {
    setPrevProjectId(savedProjectId);
    if (projectId === prevProjectId) setProjectId(savedProjectId);
  }
  const project =
    projects.find((p) => p.id === projectId) ??
    (entry.project?.id === projectId ? entry.project : null);

  const [errors, setErrors] = useState<Errors>({});
  // 入力欄で編集している時刻の欄。ふだんは時分だけを表示する
  const [editingTime, setEditingTime] = useState<"startedAt" | "endedAt">();
  const [, startSaving] = useTransition();
  // Escape で戻したときは、続く blur で保存しない
  const skipBlurSave = useRef(false);

  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();
  const [resumeState, resumeAction, resuming] = useActionState(
    startEntryAction,
    {},
  );
  const resumeError = resumeState.errors?.taskName ?? resumeState.errors?.form;

  /** 今の入力値をすべて送って保存する（サーバーはまとめて入力チェックする） */
  const save = (next: Values, nextProjectId: number | null = projectId) => {
    const formData = new FormData();
    formData.set("taskName", next.taskName);
    formData.set(
      "projectId",
      nextProjectId === null ? "" : String(nextProjectId),
    );
    formData.set("startedAt", next.startedAt);
    if (!isRunning) formData.set("endedAt", next.endedAt);
    startSaving(async () => {
      const result = await updateEntryAction(entry.id, {}, formData);
      setErrors(result.ok ? {} : (result.errors ?? {}));
    });
  };

  const handleBlur = (field: Field) => {
    if (skipBlurSave.current) {
      skipBlurSave.current = false;
      return;
    }
    if (!sameValue(field, values[field], saved[field])) save(values);
  };

  const handleKeyDown = (field: Field, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipBlurSave.current = true;
      setValues({ ...values, [field]: saved[field] });
      e.currentTarget.blur();
    }
  };

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    startDeleting(async () => {
      const result = await deleteEntryAction(entry.id);
      setDeleteError(result.errors?.form);
    });
  };

  const handleProjectChange = (nextProjectId: number | null) => {
    setProjectId(nextProjectId);
    save(values, nextProjectId);
  };

  const fieldErrors = (["projectId", ...FIELDS] as const).flatMap((f) =>
    errors[f] ? [{ field: f, message: errors[f] }] : [],
  );
  const rowError = errors.form ?? deleteError ?? resumeError;

  const input = (field: Field, label: string, className: string) => (
    <>
      <label htmlFor={`${id}-${field}`} className="sr-only">
        {label}
      </label>
      <input
        id={`${id}-${field}`}
        type={field === "taskName" ? "text" : "datetime-local"}
        step={field === "taskName" ? undefined : 1}
        placeholder={field === "taskName" ? t.untitled : undefined}
        value={values[field]}
        onChange={(e) => setValues({ ...values, [field]: e.target.value })}
        autoFocus={field !== "taskName" && editingTime === field}
        onBlur={() => {
          handleBlur(field);
          if (field !== "taskName") setEditingTime(undefined);
        }}
        onKeyDown={(e) => handleKeyDown(field, e)}
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={errors[field] ? `${id}-${field}-error` : undefined}
        className={`min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-foreground tabular-nums placeholder:text-muted hover:border-border focus:border-primary focus:outline-none aria-[invalid=true]:border-danger [&::-webkit-calendar-picker-indicator]:hidden ${className}`}
      />
    </>
  );

  /**
   * 時刻の欄。ふだんは時分を出すボタンで、押すかフォーカスすると同じ位置に日付と時分秒の入力欄を重ねて出す。
   * 入力エラーのある欄は、保存済みに見えないよう、直すまで入力欄のまま（行の流れの中に）出す
   */
  const timeField = (field: "startedAt" | "endedAt", label: string) => {
    const hasError = Boolean(errors[field]);
    const showInput = editingTime === field || hasError;
    const date = parseDateTimeLocalValue(values[field]);
    return (
      <div className={`relative shrink-0 ${hasError ? "" : "w-14"}`}>
        {!hasError && (
          <button
            type="button"
            aria-label={t.timeButton(label, values[field].slice(11))}
            onClick={() => setEditingTime(field)}
            onFocus={() => setEditingTime(field)}
            tabIndex={showInput ? -1 : 0}
            className={`w-full rounded-md border border-transparent px-2 py-1.5 text-left text-foreground tabular-nums hover:border-border ${showInput ? "invisible" : ""}`}
          >
            {date ? formatTime(date) : "--:--"}
          </button>
        )}
        {showInput &&
          input(
            field,
            label,
            hasError
              ? "w-56"
              : "absolute top-1/2 left-0 z-10 w-56 -translate-y-1/2 border-primary bg-background shadow-lg",
          )}
      </div>
    );
  };

  return (
    <div className="space-y-1 py-2">
      {/* 本文が広いとき（lg）は 1 行に、狭いときはプロジェクトとタスク名の段と、時刻・作業時間・ボタンの段に分ける */}
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex min-w-0 items-center gap-2 lg:flex-1">
          {/* プロジェクトはタスク名の左側に、色のアイコンと名前で示す。選ぶと保存する */}
          <div className="w-40 shrink-0">
            <ProjectPicker
              value={project}
              projects={projects}
              onChange={handleProjectChange}
              aria-invalid={errors.projectId ? true : undefined}
              aria-describedby={
                errors.projectId ? `${id}-projectId-error` : undefined
              }
            />
          </div>
          {input("taskName", t.taskName, "flex-1")}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-1">
            {timeField("startedAt", t.startedAt)}
            <span aria-hidden="true" className="text-muted">
              –
            </span>
            {isRunning ? (
              // 終了時刻の欄の代わりに空きを置き、他の行と列を揃える
              <span aria-hidden="true" className="w-14 shrink-0" />
            ) : (
              timeField("endedAt", t.endedAt)
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <p className="w-20 text-right text-sm font-medium text-foreground tabular-nums">
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
              {/* 記録の操作は「その他の操作」のメニューにまとめる。項目は今後増やせる */}
              <DropdownMenu
                icon={MoreVertical}
                label={t.actions.more}
                disabled={deleting}
                items={[
                  {
                    label: t.actions.delete,
                    icon: Trash2,
                    onSelect: handleDelete,
                    variant: "danger",
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
      {fieldErrors.map(({ field, message }) => (
        <p
          key={field}
          id={`${id}-${field}-error`}
          role="alert"
          className="text-sm text-danger"
        >
          {message}
        </p>
      ))}
      {rowError && (
        <p role="alert" className="text-sm text-danger">
          {rowError}
        </p>
      )}
    </div>
  );
}
