import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-border bg-background text-foreground hover:bg-border/40 disabled:opacity-50",
  danger:
    "border border-danger text-danger hover:bg-danger/10 disabled:opacity-50",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variants;
};

/** アプリ共通のボタン。type は既定で "button"（フォーム送信には type="submit" を指定する） */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
