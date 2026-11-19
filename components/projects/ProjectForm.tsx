"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { Plus } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { messages } from "@/lib/messages";
import {
  createProjectAction,
  type ProjectActionState,
} from "@/lib/projects/actions";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_COLORS,
  projectColorClass,
  projectColorName,
} from "@/lib/projects/colors";

const t = messages.projects;

type Values = {
  name: string;
  color: string;
  clientName: string;
  description: string;
};

const emptyValues: Values = {
  name: "",
  color: DEFAULT_PROJECT_COLOR,
  clientName: "",
  description: "",
};

/** プロジェクトの登録のフォーム。入力エラーのときは入力した値を残す（編集は詳細画面で行う） */
export function ProjectForm() {
  const id = useId();
  const [values, setValues] = useState<Values>(emptyValues);
  const [state, action, saving] = useActionState(
    async (prev: ProjectActionState, formData: FormData) => {
      const result = await createProjectAction(prev, formData);
      if (result.ok) setValues(emptyValues);
      return result;
    },
    {},
  );
  const errors = state.errors ?? {};

  const describedBy = (name: keyof Values) =>
    errors[name] ? `${id}-${name}-error` : undefined;
  const errorText = (name: keyof Values) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className="text-sm text-danger">
        {errors[name]}
      </p>
    );
  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground";

  const textField = (
    name: "name" | "clientName",
    label: string,
    placeholder?: string,
  ) => (
    <div className="space-y-1">
      <label htmlFor={`${id}-${name}`} className="block text-sm text-muted">
        {label}
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        type="text"
        value={values[name]}
        placeholder={placeholder}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={describedBy(name)}
        className={inputClass}
      />
      {errorText(name)}
    </div>
  );

  return (
    // <form action> は送信後にフォームをリセットし、選んだ色（ラジオボタン）が先頭に戻ってしまう。
    // 入力エラーのときに値を残すため、送信は onSubmit で受けて action を呼ぶ
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {textField("name", t.name)}
        {textField("clientName", t.clientName, t.clientNamePlaceholder)}
      </div>
      <div className="space-y-1">
        <label
          htmlFor={`${id}-description`}
          className="block text-sm text-muted"
        >
          {t.description}
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          rows={2}
          value={values.description}
          placeholder={t.descriptionPlaceholder}
          onChange={(e) =>
            setValues({ ...values, description: e.target.value })
          }
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={describedBy("description")}
          className={inputClass}
        />
        {errorText("description")}
      </div>
      <fieldset className="space-y-1" aria-describedby={describedBy("color")}>
        <legend className="text-sm text-muted">{t.color}</legend>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <label key={color} title={projectColorName(color)}>
              <input
                type="radio"
                name="color"
                value={color}
                checked={values.color === color}
                onChange={() => setValues({ ...values, color })}
                className="peer sr-only"
              />
              <span className="sr-only">{projectColorName(color)}</span>
              {/* 選んだ色は外側の輪で示す */}
              <span
                aria-hidden="true"
                className={`block size-8 cursor-pointer rounded-full border-2 border-background ring-1 ring-border peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground ${projectColorClass(color)}`}
              />
            </label>
          ))}
        </div>
        {errorText("color")}
      </fieldset>
      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}
      <div className="flex gap-2">
        <IconButton
          type="submit"
          variant="primary"
          icon={Plus}
          label={t.actions.create}
          disabled={saving}
        />
      </div>
    </form>
  );
}
