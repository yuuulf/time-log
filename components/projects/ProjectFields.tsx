"use client";

import type { FocusEventHandler, KeyboardEventHandler } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fieldFocusClassName } from "@/components/ui/fieldStyles";
import { messages } from "@/lib/messages";
import type { ProjectColor } from "@/lib/projects/colors";
import { ProjectColorPicker } from "./ProjectColorPicker";

const t = messages.projects;

/** プロジェクトの項目の値 */
export type ProjectFieldValues = {
  name: string;
  color: string;
  clientName: string;
  description: string;
};

/** 文字で入力する項目 */
export type ProjectTextField = "name" | "clientName" | "description";

type TextElement = HTMLInputElement | HTMLTextAreaElement;

/** 文字の欄ごとに足す props（詳細画面のその場の編集で使う） */
export type ProjectFieldExtraProps = {
  onBlur?: FocusEventHandler<TextElement>;
  onKeyDown?: KeyboardEventHandler<TextElement>;
};

type Props = {
  /** 欄の id の頭に付ける文字列（useId の値） */
  idPrefix: string;
  values: ProjectFieldValues;
  /** 欄ごとのエラー */
  errors: Partial<Record<keyof ProjectFieldValues, string>>;
  onChange: (field: ProjectTextField, value: string) => void;
  onColorChange: (color: ProjectColor) => void;
  fieldProps?: (field: ProjectTextField) => ProjectFieldExtraProps;
  /** true なら欄に name を付ける（フォームで送るとき） */
  named?: boolean;
};

/** プロジェクトの詳細画面・登録画面の上の、一覧へ戻るリンク */
export function BackLink() {
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

/** プロジェクトの項目（名前・色・クライアント名・説明）の並び。詳細画面と登録画面で共通 */
export function ProjectFields({
  idPrefix,
  values,
  errors,
  onChange,
  onColorChange,
  fieldProps,
  named = false,
}: Props) {
  const describedBy = (field: keyof ProjectFieldValues) =>
    errors[field] ? `${idPrefix}-${field}-error` : undefined;
  const errorText = (field: keyof ProjectFieldValues) =>
    errors[field] && (
      <p
        id={`${idPrefix}-${field}-error`}
        role="alert"
        className="text-sm text-danger"
      >
        {errors[field]}
      </p>
    );
  const props = (field: ProjectTextField) => ({
    id: `${idPrefix}-${field}`,
    name: named ? field : undefined,
    value: values[field],
    onChange: (e: { target: { value: string } }) =>
      onChange(field, e.target.value),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field),
    className: `w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted aria-[invalid=true]:border-danger ${fieldFocusClassName}`,
    ...fieldProps?.(field),
  });
  const label = (field: ProjectTextField, text: string) => (
    <label
      htmlFor={`${idPrefix}-${field}`}
      className="block text-sm text-muted"
    >
      {text}
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {label("name", t.name)}
        <input type="text" {...props("name")} />
        {errorText("name")}
      </div>
      <ProjectColorPicker
        name={named ? "color" : `${idPrefix}-color`}
        value={values.color}
        onChange={onColorChange}
        aria-describedby={describedBy("color")}
      >
        {errorText("color")}
      </ProjectColorPicker>
      <div className="space-y-1">
        {label("clientName", t.clientName)}
        <input
          type="text"
          placeholder={t.clientNamePlaceholder}
          {...props("clientName")}
        />
        {errorText("clientName")}
      </div>
      <div className="space-y-1">
        {label("description", t.description)}
        <textarea
          rows={8}
          placeholder={t.descriptionPlaceholder}
          {...props("description")}
        />
        {errorText("description")}
      </div>
    </div>
  );
}
