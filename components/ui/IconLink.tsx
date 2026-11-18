import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { iconControlClassName, type IconVariant } from "./IconButton";

type IconLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  /** 表示するアイコン（lucide-react） */
  icon: LucideIcon;
  /** リンクの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
  variant?: IconVariant;
};

/** IconButton と同じ見た目のアイコンのリンク。ページの移動に使う */
export function IconLink({
  icon: Icon,
  label,
  variant = "secondary",
  className = "",
  ...props
}: IconLinkProps) {
  return (
    <Link
      aria-label={label}
      title={label}
      className={iconControlClassName(variant, className)}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" />
    </Link>
  );
}
