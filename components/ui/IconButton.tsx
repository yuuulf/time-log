import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

/** ボタン・リンクの色の種類。アイコンだけのもの（IconButton・IconLink）と文字のもの（TextButton・TextLink）で共通 */
export const controlVariants = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-border bg-background text-foreground hover:bg-border/40 disabled:opacity-50",
  danger:
    "border border-border bg-background text-danger hover:bg-danger/10 disabled:opacity-50",
  /** 枠を出さず、ポインタを合わせたときだけ背景でボタンの形を示す（入力欄の右上の「閉じる」など） */
  ghost: "text-foreground hover:bg-border/40 disabled:opacity-50",
} as const;

export type IconVariant = keyof typeof controlVariants;

/** アイコンのボタン・リンクに共通の見た目 */
export function iconControlClassName(variant: IconVariant, className = "") {
  return `inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-colors ${controlVariants[variant]} ${className}`;
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** 表示するアイコン（lucide-react） */
  icon: LucideIcon;
  /** ボタンの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
  variant?: IconVariant;
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
      className={iconControlClassName(variant, className)}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
