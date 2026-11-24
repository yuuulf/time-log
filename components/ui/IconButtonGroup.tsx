"use client";

import type { LucideIcon } from "lucide-react";

export type IconButtonGroupOption<T extends string> = {
  value: T;
  /** 表示するアイコン（lucide-react） */
  icon: LucideIcon;
  /** ボタンの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
};

type Props<T extends string> = {
  /** まとまりの読み上げ名 */
  label: string;
  options: IconButtonGroupOption<T>[];
  /** 選んでいる値 */
  value: T;
  onChange: (value: T) => void;
};

/**
 * つながった 1 組のアイコンボタン（ボタングループ）。表示の切り替えのように、どれか 1 つを選ぶのに使う。
 * 選んでいるボタンは押された状態（aria-pressed）にし、テーマ色で示す
 */
export function IconButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex">
      {options.map((option, index) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex size-10 items-center justify-center border border-border transition-colors focus-visible:z-10 ${
              index === 0 ? "rounded-l-md" : "-ml-px"
            } ${index === options.length - 1 ? "rounded-r-md" : ""} ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-border/40"
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
