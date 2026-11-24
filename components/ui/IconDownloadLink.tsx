import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { iconControlClassName, type IconVariant } from "./IconButton";

type IconDownloadLinkProps = Omit<
  ComponentProps<"a">,
  "children" | "download"
> & {
  /** ファイルの URL */
  href: string;
  /** 表示するアイコン（lucide-react） */
  icon: LucideIcon;
  /** リンクの名前。読み上げ用（aria-label）とポインタを合わせたときの説明（title）に使う */
  label: string;
  variant?: IconVariant;
};

/**
 * IconButton と同じ見た目の、ファイルをダウンロードするリンク。
 * ページの移動ではないので next/link（プリフェッチ・クライアント側の遷移）を使わず、素の <a download> にする。
 * ファイル名はサーバーの Content-Disposition に任せる
 */
export function IconDownloadLink({
  icon: Icon,
  label,
  variant = "secondary",
  className = "",
  ...props
}: IconDownloadLinkProps) {
  return (
    <a
      download
      aria-label={label}
      title={label}
      className={iconControlClassName(variant, className)}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4" />
    </a>
  );
}
