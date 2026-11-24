"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { Check, Trash2, X } from "lucide-react";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import type { EntryProject } from "@/components/projects/types";
import { IconButton } from "@/components/ui/IconButton";
import { fieldFocusClassName } from "@/components/ui/fieldStyles";
import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
  type ActionState,
} from "@/lib/time-entries/actions";
import { messages } from "@/lib/messages";
import { toDateTimeLocalValue } from "@/lib/time";

const t = messages.timeEntries;

/** 入力欄に最初に入れておく値 */
export type EditorInitial = {
  taskName: string;
  startedAt: Date;
  /** 記録中の記録の修正なら null（終了時刻の欄を出さない） */
  endedAt: Date | null;
  project: EntryProject | null;
};

type Props = {
  initial: EditorInitial;
  /** 修正する記録の id。なければ追加 */
  entryId?: number;
  /** プロジェクトの選択肢（登録順） */
  projects: EntryProject[];
  /** タスク名の入力候補 */
  suggestions: string[];
  /** 入力欄の上端の位置（px。タイムラインの上からの位置） */
  top: number;
  /**
   * 入力欄を閉じるときに呼ぶ。returnFocus が true なら開く前の場所にフォーカスを戻す
   * （Escape・「閉じる」のとき。保存や外側を選んだときは戻さない）
   */
  onClose: (returnFocus: boolean) => void;
};

const fieldClassName = `w-full min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground aria-[invalid=true]:border-danger ${fieldFocusClassName}`;

/**
 * タイムラインの記録の入力欄。タスク名・プロジェクト・開始時刻・終了時刻を入れて、
 * 追加なら「追加」で終了済みの記録を足し、修正なら「保存」で保存する。修正では「削除」で確認してから削除する。
 * 「閉じる」・Escape・外側を選んだときは保存せずに閉じる。開いたらタスク名にフォーカスする
 */
export function TimelineEntryEditor({
  initial,
  entryId,
  projects,
  suggestions,
  top,
  onClose,
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const taskNameRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState<number | null>(
    initial.project?.id ?? null,
  );
  // 開いている間は追加か修正かが変わらないので、最初に決めた Server Action を使い続ける
  const [submitAction] = useState(() =>
    entryId === undefined
      ? createEntryAction
      : updateEntryAction.bind(null, entryId),
  );
  const [state, action, saving] = useActionState<ActionState, FormData>(
    submitAction,
    {},
  );
  const [, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const errors = state.errors ?? {};
  const fields =
    initial.endedAt === null
      ? (["startedAt"] as const)
      : (["startedAt", "endedAt"] as const);

  const handleDelete = () => {
    if (entryId === undefined || !window.confirm(t.confirmDelete)) return;
    startDelete(async () => {
      const result = await deleteEntryAction(entryId);
      if (result.ok) onClose(false);
      else setDeleteError(result.errors?.form);
    });
  };

  // 開いたらタスク名にフォーカスし、入力欄が見える位置までスクロールする
  useEffect(() => {
    taskNameRef.current?.focus();
    rootRef.current?.scrollIntoView?.({ block: "nearest" });
  }, []);

  // 保存できたら閉じる
  useEffect(() => {
    if (state.ok) onClose(false);
  }, [state, onClose]);

  // 入力欄の外側を押したら、保存せずに閉じる
  useEffect(() => {
    const onPointerDown = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const errorId = (field: string) => `${id}-${field}-error`;
  const fieldError = (field: keyof typeof errors) =>
    errors[field] && (
      <p id={errorId(field)} role="alert" className="text-xs text-danger">
        {errors[field]}
      </p>
    );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={t.timeline.editorLabel}
      className="absolute right-0 z-20 w-72 max-w-full rounded-md border border-border bg-background p-3 shadow-lg"
      style={{ top }}
      onKeyDown={(event) => {
        // プルダウンを開いているときの Escape はプルダウンが受け取って止める
        if (event.key === "Escape") {
          event.preventDefault();
          onClose(true);
        }
      }}
    >
      {/* <form action> は送信後にフォームを空にするため、誤りのときに値を残せるよう onSubmit で受ける */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => action(formData));
        }}
        className="space-y-2"
      >
        <div className="space-y-1">
          <label htmlFor={`${id}-taskName`} className="text-xs text-muted">
            {t.taskName}
          </label>
          <input
            ref={taskNameRef}
            id={`${id}-taskName`}
            name="taskName"
            type="text"
            defaultValue={initial.taskName}
            placeholder={t.taskNamePlaceholder}
            list={`${id}-suggestions`}
            autoComplete="off"
            aria-invalid={errors.taskName ? true : undefined}
            aria-describedby={errors.taskName ? errorId("taskName") : undefined}
            className={fieldClassName}
          />
          <datalist id={`${id}-suggestions`}>
            {suggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {fieldError("taskName")}
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted">{t.project}</span>
          <ProjectPicker
            variant="field"
            value={
              projects.find((p) => p.id === projectId) ??
              (initial.project?.id === projectId ? initial.project : null)
            }
            projects={projects}
            onChange={setProjectId}
            aria-invalid={errors.projectId ? true : undefined}
            aria-describedby={
              errors.projectId ? errorId("projectId") : undefined
            }
          />
          <input
            type="hidden"
            name="projectId"
            value={projectId === null ? "" : String(projectId)}
          />
          {fieldError("projectId")}
        </div>
        {fields.map((field) => (
          <div key={field} className="space-y-1">
            <label htmlFor={`${id}-${field}`} className="text-xs text-muted">
              {t[field]}
            </label>
            <input
              id={`${id}-${field}`}
              name={field}
              type="datetime-local"
              step={1}
              defaultValue={toDateTimeLocalValue(initial[field]!)}
              aria-invalid={errors[field] ? true : undefined}
              aria-describedby={errors[field] ? errorId(field) : undefined}
              className={fieldClassName}
            />
            {fieldError(field)}
          </div>
        ))}
        {(errors.form ?? deleteError) && (
          <p role="alert" className="text-xs text-danger">
            {errors.form ?? deleteError}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          {entryId !== undefined && (
            <IconButton
              icon={Trash2}
              label={t.actions.delete}
              variant="danger"
              className="mr-auto"
              disabled={deleting}
              onClick={handleDelete}
            />
          )}
          <IconButton
            icon={X}
            label={t.timeline.close}
            onClick={() => onClose(true)}
          />
          <IconButton
            type="submit"
            variant="primary"
            icon={Check}
            label={entryId === undefined ? t.timeline.create : t.timeline.save}
            disabled={saving}
          />
        </div>
      </form>
    </div>
  );
}
