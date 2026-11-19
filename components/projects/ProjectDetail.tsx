"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import {
  updateProjectAction,
  type ProjectActionState,
} from "@/lib/projects/actions";
import { isComposing } from "@/lib/keyboard";
import { messages } from "@/lib/messages";
import {
  BackLink,
  ProjectFields,
  type ProjectFieldValues,
  type ProjectTextField,
} from "./ProjectFields";
import type { ProjectData } from "./types";

const t = messages.projects;

/** プロジェクトが見つからないときの表示 */
export function ProjectNotFound() {
  return (
    <div className="space-y-4">
      <BackLink />
      <p className="text-foreground">{t.detail.notFound}</p>
    </div>
  );
}

type Values = ProjectFieldValues;
type TextField = ProjectTextField;
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

  const fieldProps = (field: TextField) => ({
    onBlur: () => handleBlur(field),
    onKeyDown: (e: KeyboardEvent<TextElement>) => handleKeyDown(field, e),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-3xl font-bold break-words text-foreground">
          {project.name}
        </h1>
      </div>
      <div className="space-y-4">
        <ProjectFields
          idPrefix={id}
          values={values}
          errors={errors}
          onChange={(field, value) => setValues({ ...values, [field]: value })}
          onColorChange={handleColorChange}
          fieldProps={fieldProps}
        />
        {errors.form && (
          <p role="alert" className="text-sm text-danger">
            {errors.form}
          </p>
        )}
      </div>
    </div>
  );
}
