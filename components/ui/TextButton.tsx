import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { controlVariants, type IconVariant } from "./IconButton";

/** 文字のあるボタン・リンクに共通の見た目。アイコンは文字の左に置く */
function textControlClassName(variant: IconVariant, className = "") {
  return `inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors ${controlVariants[variant]} ${className}`;
}

type Common = {
  /** 文字の左に出すアイコン（lucide-react）。なくてもよい */
  icon?: LucideIcon;
  /** ボタンの文字（名詞形） */
  children: ReactNode;
  variant?: IconVariant;
};

/** アイコンと文字のボタン。文字で名前が分かるので aria-label・title は付けない。type は既定で "button" */
export function TextButton({
  icon: Icon,
  children,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "children"> & Common) {
  return (
    <button
      type={type}
      className={textControlClassName(variant, className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="size-4" />}
      {children}
    </button>
  );
}

/** TextButton と同じ見た目のリンク。ページの移動に使う */
export function TextLink({
  icon: Icon,
  children,
  variant = "secondary",
  className = "",
  ...props
}: Omit<ComponentProps<typeof Link>, "children"> & Common) {
  return (
    <Link className={textControlClassName(variant, className)} {...props}>
      {Icon && <Icon aria-hidden="true" className="size-4" />}
      {children}
    </Link>
  );
}
