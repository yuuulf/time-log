"use client";

import type { ReactNode } from "react";
import { messages } from "@/lib/messages";
import {
  PROJECT_COLORS,
  projectColorClass,
  projectColorName,
  type ProjectColor,
} from "@/lib/projects/colors";

type Props = {
  /** ラジオボタンの name。フォームで送るときの名前にもなる */
  name: string;
  value: string;
  onChange: (color: ProjectColor) => void;
  "aria-describedby"?: string;
  /** 選択肢の下に出すもの（エラーの文言など） */
  children?: ReactNode;
};

/** プロジェクトの色の選択。10 色のラジオボタンを色の丸で表示し、選んだ色は外側の輪で示す */
export function ProjectColorPicker({
  name,
  value,
  onChange,
  children,
  ...aria
}: Props) {
  return (
    <fieldset className="space-y-1" {...aria}>
      <legend className="text-sm text-muted">{messages.projects.color}</legend>
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((color) => (
          <label key={color} title={projectColorName(color)}>
            <input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
              className="peer sr-only"
            />
            <span className="sr-only">{projectColorName(color)}</span>
            <span
              aria-hidden="true"
              className={`block size-8 cursor-pointer rounded-full border-2 border-background ring-1 ring-border peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground ${projectColorClass(color)}`}
            />
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}
