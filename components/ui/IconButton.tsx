import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-border bg-background text-foreground hover:bg-border/40 disabled:opacity-50",
  danger:
    "border border-border bg-background text-danger hover:bg-danger/10 disabled:opacity-50",
} as const;

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** 表示するアイコン（lucide-react） */
  icon: LucideIcon;
  /** ボタンの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
  variant?: keyof typeof variants;
};

/** アプリ共通のアイコンボタン。type は既定で "button"（フォーム送信には type="submit" を指定する） */
export function IconButton({
  icon: Icon,
  label,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
