"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  updateProjectAction,
  type ProjectActionState,
} from "@/lib/projects/actions";
import { isComposing } from "@/lib/keyboard";
import { messages } from "@/lib/messages";
import { ProjectColorPicker } from "./ProjectColorPicker";
import type { ProjectData } from "./types";

const t = messages.projects;

/** 一覧へ戻るリンク */
function BackLink() {
  return (
    <Link
      href="/projects"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {t.detail.backToList}
    </Link>
  );
}

/** プロジェクトが見つからないときの表示 */
export function ProjectNotFound() {
  return (
    <div className="space-y-4">
      <BackLink />
      <p className="text-foreground">{t.detail.notFound}</p>
    </div>
  );
}

type Values = Pick<
  ProjectData,
  "name" | "color" | "clientName" | "description"
>;
type TextField = "name" | "clientName" | "description";
type Errors = NonNullable<ProjectActionState["errors"]>;
type TextElement = HTMLInputElement | HTMLTextAreaElement;

const FIELDS: (keyof Values)[] = ["name", "color", "clientName", "description"];

function toValues(project: ProjectData): Values {
  const { name, color, clientName, description } = project;
  return { name, color, clientName, description };
}

/**
 * プロジェクトの詳細。名前・色・クライアント名・説明をすべて表示し、その場で編集する。
 * 文字の項目は値を変えてフォーカスが外れたとき（名前・クライアント名は Enter でも）に保存し、Escape で元に戻す。
 * 色は選んだときに保存する。入力エラーのときは保存せず、入力した値を残す
 */
export function ProjectDetail({ project }: { project: ProjectData }) {
  const id = useId();
  const saved = toValues(project);

  // 入力エラーのときに入力した値を残すため、値は state で持つ
  const [values, setValues] = useState(saved);
  // 保存の後に props が新しくなったら、編集中でない欄（前の保存済みの値のままの欄）だけを合わせる
  const [prevSaved, setPrevSaved] = useState(saved);
  if (FIELDS.some((f) => saved[f] !== prevSaved[f])) {
    setPrevSaved(saved);
    setValues((current) => {
      const next = { ...current };
      for (const f of FIELDS) {
        if (current[f] === prevSaved[f]) next[f] = saved[f];
      }
      return next;
    });
  }

  const [errors, setErrors] = useState<Errors>({});
  const [, startSaving] = useTransition();
  // Escape で戻したときは、続く blur で保存しない
  const skipBlurSave = useRef(false);

  /** 今の値をすべて送って保存する（サーバーはまとめて入力チェックする） */
  const save = (next: Values) => {
    const formData = new FormData();
    for (const f of FIELDS) formData.set(f, next[f]);
    startSaving(async () => {
      const result = await updateProjectAction(project.id, {}, formData);
      setErrors(result.ok ? {} : (result.errors ?? {}));
    });
  };

  /** その欄のエラーを消す。保存済みの値に戻したときは、保存しないのでここで消す */
  const clearError = (field: keyof Values) => {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleBlur = (field: TextField) => {
    if (skipBlurSave.current) {
      skipBlurSave.current = false;
      clearError(field);
      return;
    }
    if (values[field] === saved[field]) clearError(field);
    else save(values);
  };

  const handleKeyDown = (field: TextField, e: KeyboardEvent<TextElement>) => {
    // 変換の確定の Enter などは入力の操作として扱わない（blur すると確定中の文字が二重に入る）
    if (isComposing(e)) return;
    // 説明（複数行）の Enter は改行にする
    if (e.key === "Enter" && field !== "description") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipBlurSave.current = true;
      setValues({ ...values, [field]: saved[field] });
      e.currentTarget.blur();
    }
  };

  const handleColorChange = (color: string) => {
    const next = { ...values, color };
    setValues(next);
    save(next);
  };

  const describedBy = (field: keyof Values) =>
    errors[field] ? `${id}-${field}-error` : undefined;
  const errorText = (field: keyof Values) =>
    errors[field] && (
      <p
        id={`${id}-${field}-error`}
        role="alert"
        className="text-sm text-danger"
      >
        {errors[field]}
      </p>
    );
  const fieldProps = (field: TextField) => ({
    id: `${id}-${field}`,
    value: values[field],
    onChange: (e: ChangeEvent<TextElement>) =>
      setValues({ ...values, [field]: e.target.value }),
    onBlur: () => handleBlur(field),
    onKeyDown: (e: KeyboardEvent<TextElement>) => handleKeyDown(field, e),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field),
    className:
      "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted aria-[invalid=true]:border-danger",
  });
  const label = (field: TextField, text: string) => (
    <label htmlFor={`${id}-${field}`} className="block text-sm text-muted">
      {text}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-3xl font-bold break-words text-foreground">
          {project.name}
        </h1>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          {label("name", t.name)}
          <input type="text" {...fieldProps("name")} />
          {errorText("name")}
        </div>
        <ProjectColorPicker
          name={`${id}-color`}
          value={values.color}
          onChange={handleColorChange}
          aria-describedby={describedBy("color")}
        >
          {errorText("color")}
        </ProjectColorPicker>
        <div className="space-y-1">
          {label("clientName", t.clientName)}
          <input
            type="text"
            placeholder={t.clientNamePlaceholder}
            {...fieldProps("clientName")}
          />
          {errorText("clientName")}
        </div>
        <div className="space-y-1">
          {label("description", t.description)}
          <textarea
            rows={8}
            placeholder={t.descriptionPlaceholder}
            {...fieldProps("description")}
          />
          {errorText("description")}
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-danger">
            {errors.form}
          </p>
        )}
      </div>
    </div>
  );
}
