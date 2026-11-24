"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { MoreVertical, Trash2, X } from "lucide-react";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import type { EntryProject } from "@/components/projects/types";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import { TextButton } from "@/components/ui/TextButton";
import { fieldFocusClassName } from "@/components/ui/fieldStyles";
import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
  type ActionState,
} from "@/lib/time-entries/actions";
import { isComposing } from "@/lib/keyboard";
import { messages } from "@/lib/messages";
import { toDateTimeLocalValue } from "@/lib/time";
import type { TimeRange } from "@/lib/time-entries/timeline";
import type { EntryItemData } from "./EntryItem";
import {
  FIELDS,
  sameValue,
  toValues,
  type Field,
  type Values,
} from "./entryValues";

const t = messages.timeEntries;

type Errors = NonNullable<ActionState["errors"]>;

type Common = {
  /** プロジェクトの選択肢（登録順） */
  projects: EntryProject[];
  /** タスク名の入力候補 */
  suggestions: string[];
  /** 入力欄の上端の位置（px。タイムラインの上からの位置） */
  top: number;
  /** 入力欄の左端の位置（CSS の値）。省略時は右寄せ */
  left?: string;
  /** 入力欄を閉じるときに呼ぶ。returnFocus が true なら開く前の場所にフォーカスを戻す */
  onClose: (returnFocus: boolean) => void;
};

type Props = Common &
  (
    | { mode: "create"; range: TimeRange }
    | { mode: "edit"; entry: EntryItemData }
  );

const fieldClassName = `w-full min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground aria-[invalid=true]:border-danger ${fieldFocusClassName}`;

/**
 * タイムラインの記録の入力欄。右上に「閉じる」（修正では「その他の操作」も）を置く。
 * 追加では「追加」で終了済みの記録を足す。修正では一覧の行と同じく、フォーカスが外れたとき・Enter・プロジェクトの選択で保存する
 */
export function TimelineEntryEditor(props: Props) {
  return props.mode === "create" ? (
    <CreateEditor {...props} />
  ) : (
    <EditEditor {...props} />
  );
}

/**
 * 入力欄の枠。右上の「閉じる」と、外側を押したとき・Escape で閉じる処理を持つ。開いたらタスク名にフォーカスする。
 * requestClose は「閉じる」と外側を押したときに、onEscape は Escape で呼ぶ
 */
function EditorPanel({
  top,
  left,
  requestClose,
  onEscape,
  menu,
  taskNameRef,
  children,
}: {
  top: number;
  left?: string;
  requestClose: (returnFocus: boolean) => void;
  onEscape: () => void;
  menu?: ReactNode;
  taskNameRef: RefObject<HTMLInputElement | null>;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // 外側を押したときの処理は最新の requestClose を呼ぶ（入力中の値を保存するため）
  const requestCloseRef = useRef(requestClose);
  useEffect(() => {
    requestCloseRef.current = requestClose;
  });

  // 開いたらタスク名にフォーカスし、入力欄が見える位置までスクロールする
  useEffect(() => {
    taskNameRef.current?.focus();
    rootRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [taskNameRef]);

  useEffect(() => {
    const onPointerDown = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        requestCloseRef.current(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={t.timeline.editorLabel}
      // 背景の追加用のポインタ（cursor-copy）を入力欄の中では出さない
      className="absolute right-0 z-20 w-72 max-w-full cursor-auto rounded-md border border-border bg-background p-3 shadow-lg"
      style={{ top, left }}
      onKeyDown={(event) => {
        // プルダウン・メニューを開いているときの Escape は、それぞれが受け取って止める
        if (event.key === "Escape") {
          event.preventDefault();
          onEscape();
        }
      }}
    >
      <div className="-mt-1 -mr-1 mb-1 flex justify-end gap-1">
        {menu}
        <IconButton
          icon={X}
          label={t.timeline.close}
          variant="ghost"
          // 押したときに入力欄のフォーカスを外さない（blur の保存と閉じるときの保存を二重にしない）
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => requestClose(true)}
        />
      </div>
      {children}
    </div>
  );
}

/** 欄の見出しと誤りの表示 */
function FieldBlock({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs text-muted">
          {label}
        </label>
      ) : (
        <span className="text-xs text-muted">{label}</span>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** 追加の入力欄。「追加」で終了済みの記録を足し、閉じるときは保存しない */
function CreateEditor({
  range,
  projects,
  suggestions,
  top,
  left,
  onClose,
}: Common & { range: TimeRange }) {
  const id = useId();
  const taskNameRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [state, action, saving] = useActionState<ActionState, FormData>(
    createEntryAction,
    {},
  );
  const [, startTransition] = useTransition();
  const errors: Errors = state.errors ?? {};
  const errorId = (field: string) => `${id}-${field}-error`;

  // 保存できたら閉じる
  useEffect(() => {
    if (state.ok) onClose(false);
  }, [state, onClose]);

  return (
    <EditorPanel
      top={top}
      left={left}
      requestClose={onClose}
      onEscape={() => onClose(true)}
      taskNameRef={taskNameRef}
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
        <FieldBlock
          label={t.taskName}
          htmlFor={`${id}-taskName`}
          error={errors.taskName}
          errorId={errorId("taskName")}
        >
          <input
            ref={taskNameRef}
            id={`${id}-taskName`}
            name="taskName"
            type="text"
            placeholder={t.taskNamePlaceholder}
            list={`${id}-suggestions`}
            autoComplete="off"
            aria-invalid={errors.taskName ? true : undefined}
            aria-describedby={errors.taskName ? errorId("taskName") : undefined}
            className={fieldClassName}
          />
        </FieldBlock>
        <Suggestions id={`${id}-suggestions`} suggestions={suggestions} />
        <FieldBlock
          label={t.project}
          error={errors.projectId}
          errorId={errorId("projectId")}
        >
          <ProjectPicker
            variant="field"
            value={projects.find((p) => p.id === projectId) ?? null}
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
        </FieldBlock>
        {(["startedAt", "endedAt"] as const).map((field) => (
          <FieldBlock
            key={field}
            label={t[field]}
            htmlFor={`${id}-${field}`}
            error={errors[field]}
            errorId={errorId(field)}
          >
            <input
              id={`${id}-${field}`}
              name={field}
              type="datetime-local"
              step={1}
              defaultValue={toDateTimeLocalValue(range[field])}
              aria-invalid={errors[field] ? true : undefined}
              aria-describedby={errors[field] ? errorId(field) : undefined}
              className={fieldClassName}
            />
          </FieldBlock>
        ))}
        {errors.form && (
          <p role="alert" className="text-xs text-danger">
            {errors.form}
          </p>
        )}
        <div className="flex justify-end pt-1">
          <TextButton type="submit" variant="primary" disabled={saving}>
            {t.timeline.create}
          </TextButton>
        </div>
      </form>
    </EditorPanel>
  );
}

function Suggestions({
  id,
  suggestions,
}: {
  id: string;
  suggestions: string[];
}) {
  return (
    <datalist id={id}>
      {suggestions.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  );
}

/**
 * 修正の入力欄。保存のボタンは置かず、一覧の行と同じく、値を変えてフォーカスが外れたとき・Enter・プロジェクトの選択で保存する。
 * Escape は変えている値を保存せずに閉じ、「閉じる」・外側では保存していない値を保存してから閉じる（誤りなら閉じない）
 */
function EditEditor({
  entry,
  projects,
  suggestions,
  top,
  left,
  onClose,
}: Common & { entry: EntryItemData }) {
  const id = useId();
  const taskNameRef = useRef<HTMLInputElement>(null);
  const isRunning = entry.endedAt === null;
  const fields = FIELDS.filter((f) => !(isRunning && f === "endedAt"));
  const saved = toValues(entry);

  // 誤りのときに入力した値を残すため、値は state で持つ
  const [values, setValues] = useState<Values>(saved);
  const [projectId, setProjectId] = useState(entry.project?.id ?? null);
  const project =
    projects.find((p) => p.id === projectId) ??
    (entry.project?.id === projectId ? entry.project : null);
  const [errors, setErrors] = useState<Errors>({});
  const [, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  // 閉じるときなど、続く blur で保存しないときに立てる
  const skipBlurSave = useRef(false);

  /** 今の入力値をすべて送って保存する（サーバーはまとめて入力チェックする）。保存できたら true */
  const save = (next: Values, nextProjectId: number | null = projectId) => {
    const formData = new FormData();
    formData.set("taskName", next.taskName);
    formData.set(
      "projectId",
      nextProjectId === null ? "" : String(nextProjectId),
    );
    formData.set("startedAt", next.startedAt);
    if (!isRunning) formData.set("endedAt", next.endedAt);
    return new Promise<boolean>((resolve) => {
      startSaving(async () => {
        const result = await updateEntryAction(entry.id, {}, formData);
        setErrors(result.ok ? {} : (result.errors ?? {}));
        resolve(result.ok === true);
      });
    });
  };

  const isDirty = () => fields.some((f) => !sameValue(f, values[f], saved[f]));

  /** 「閉じる」・外側を押したとき。保存していない値があれば保存してから閉じ、誤りなら開いたままにする */
  const requestClose = async (returnFocus: boolean) => {
    skipBlurSave.current = true;
    if (isDirty() && !(await save(values))) {
      skipBlurSave.current = false;
      return;
    }
    onClose(returnFocus);
  };

  const handleBlur = (field: Field) => {
    if (skipBlurSave.current) {
      skipBlurSave.current = false;
      return;
    }
    if (sameValue(field, values[field], saved[field])) {
      if (errors[field]) {
        const next = { ...errors };
        delete next[field];
        setErrors(next);
      }
    } else {
      void save(values);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 変換の確定の Enter は入力の操作として扱わない
    if (isComposing(event)) return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    startDeleting(async () => {
      const result = await deleteEntryAction(entry.id);
      if (result.ok) onClose(false);
      else setErrors({ form: result.errors?.form });
    });
  };

  const errorId = (field: string) => `${id}-${field}-error`;

  return (
    <EditorPanel
      top={top}
      left={left}
      requestClose={requestClose}
      onEscape={() => {
        skipBlurSave.current = true;
        onClose(true);
      }}
      taskNameRef={taskNameRef}
      menu={
        <DropdownMenu
          icon={MoreVertical}
          label={t.actions.more}
          variant="ghost"
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
      }
    >
      <div className="space-y-2">
        <FieldBlock
          label={t.taskName}
          htmlFor={`${id}-taskName`}
          error={errors.taskName}
          errorId={errorId("taskName")}
        >
          <input
            ref={taskNameRef}
            id={`${id}-taskName`}
            type="text"
            value={values.taskName}
            placeholder={t.untitled}
            list={`${id}-suggestions`}
            autoComplete="off"
            onChange={(e) => setValues({ ...values, taskName: e.target.value })}
            onBlur={() => handleBlur("taskName")}
            onKeyDown={handleKeyDown}
            aria-invalid={errors.taskName ? true : undefined}
            aria-describedby={errors.taskName ? errorId("taskName") : undefined}
            className={fieldClassName}
          />
        </FieldBlock>
        <Suggestions id={`${id}-suggestions`} suggestions={suggestions} />
        <FieldBlock
          label={t.project}
          error={errors.projectId}
          errorId={errorId("projectId")}
        >
          <ProjectPicker
            variant="field"
            value={project}
            projects={projects}
            onChange={(next) => {
              setProjectId(next);
              void save(values, next);
            }}
            aria-invalid={errors.projectId ? true : undefined}
            aria-describedby={
              errors.projectId ? errorId("projectId") : undefined
            }
          />
        </FieldBlock>
        {fields
          .filter((f): f is "startedAt" | "endedAt" => f !== "taskName")
          .map((field) => (
            <FieldBlock
              key={field}
              label={t[field]}
              htmlFor={`${id}-${field}`}
              error={errors[field]}
              errorId={errorId(field)}
            >
              <input
                id={`${id}-${field}`}
                type="datetime-local"
                step={1}
                value={values[field]}
                onChange={(e) =>
                  setValues({ ...values, [field]: e.target.value })
                }
                onBlur={() => handleBlur(field)}
                onKeyDown={handleKeyDown}
                aria-invalid={errors[field] ? true : undefined}
                aria-describedby={errors[field] ? errorId(field) : undefined}
                className={fieldClassName}
              />
            </FieldBlock>
          ))}
        {errors.form && (
          <p role="alert" className="text-xs text-danger">
            {errors.form}
          </p>
        )}
      </div>
    </EditorPanel>
  );
}
