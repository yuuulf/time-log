import { messages } from "@/lib/messages";

/** プロジェクトの色のキー。並びは選択肢の順で、先頭が最初に選ばれる色 */
export const PROJECT_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
  "brown",
  "sky",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

/** 登録欄で最初に選ばれている色 */
export const DEFAULT_PROJECT_COLOR: ProjectColor = PROJECT_COLORS[0];

/**
 * 色ごとの背景のクラス。色の値は app/globals.css のトークン（ライト・ダーク）にある。
 * Tailwind がクラスを見つけられるよう、クラス名は組み立てずにそのまま書く
 */
const backgroundClasses: Record<ProjectColor, string> = {
  red: "bg-project-red",
  orange: "bg-project-orange",
  amber: "bg-project-amber",
  green: "bg-project-green",
  teal: "bg-project-teal",
  blue: "bg-project-blue",
  violet: "bg-project-violet",
  pink: "bg-project-pink",
  brown: "bg-project-brown",
  sky: "bg-project-sky",
};

/** 値がプロジェクトの色のキーかどうか */
export function isProjectColor(value: unknown): value is ProjectColor {
  return (
    typeof value === "string" &&
    (PROJECT_COLORS as readonly string[]).includes(value)
  );
}

/** 色の背景のクラス。DB に未知の値があれば文字色の控えめな色で代用する */
export function projectColorClass(color: string): string {
  return isProjectColor(color) ? backgroundClasses[color] : "bg-muted";
}

/** 色の名前（「赤」など）。読み上げとポインタを合わせたときの説明に使う */
export function projectColorName(color: ProjectColor): string {
  return messages.projects.colors[color];
}
