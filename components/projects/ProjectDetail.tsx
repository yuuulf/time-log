"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

/** プロジェクトの詳細。名前・色・クライアント名・説明をすべて表示する */
export function ProjectDetail({ project }: { project: ProjectData }) {
  const id = useId();
  const [values, setValues] = useState<Values>({
    name: project.name,
    color: project.color,
    clientName: project.clientName,
    description: project.description,
  });

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted";

  const textField = (
    field: "name" | "clientName",
    label: string,
    placeholder?: string,
  ) => (
    <div className="space-y-1">
      <label htmlFor={`${id}-${field}`} className="block text-sm text-muted">
        {label}
      </label>
      <input
        id={`${id}-${field}`}
        type="text"
        value={values[field]}
        placeholder={placeholder}
        onChange={(e) => setValues({ ...values, [field]: e.target.value })}
        className={inputClass}
      />
    </div>
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
        {textField("name", t.name)}
        <ProjectColorPicker
          name={`${id}-color`}
          value={values.color}
          onChange={(color) => setValues({ ...values, color })}
        />
        {textField("clientName", t.clientName, t.clientNamePlaceholder)}
        <div className="space-y-1">
          <label
            htmlFor={`${id}-description`}
            className="block text-sm text-muted"
          >
            {t.description}
          </label>
          <textarea
            id={`${id}-description`}
            rows={4}
            value={values.description}
            placeholder={t.descriptionPlaceholder}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
