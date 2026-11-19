import { Folder } from "lucide-react";
import { projectColorTextClass } from "@/lib/projects/colors";

type Props = {
  name: string;
  color: string;
  /** 近くにプロジェクト名を文字で出すとき true。読み上げの対象から外し、名前を二重に読まない */
  decorative?: boolean;
};

/** プロジェクトの色で塗りつぶしたフォルダのアイコン。ポインタを合わせるとプロジェクト名を表示し、読み上げでは名前を読む */
export function ProjectIcon({ name, color, decorative = false }: Props) {
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative ? true : undefined}
      title={name}
      className={`inline-flex shrink-0 ${projectColorTextClass(color)}`}
    >
      <Folder aria-hidden="true" className="size-4" fill="currentColor" />
    </span>
  );
}
