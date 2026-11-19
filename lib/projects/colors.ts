import { messages } from "@/lib/messages";

/** プロジェクトの色のキー。並びは選択肢の順（色相の順で、茶は最後）で、先頭が最初に選ばれる色 */
export const PROJECT_COLORS = [
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "sky",
  "blue",
  "violet",
  "pink",
  "brown",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

/** 登録欄で最初に選ばれている色 */
export const DEFAULT_PROJECT_COLOR: ProjectColor = PROJECT_COLORS[0];

/**
 * 色ごとのクラス。色の値は app/globals.css のトークン（ライト・ダーク）にある。
 * Tailwind がクラスを見つけられるよう、クラス名は組み立てずにそのまま書く
 */
const colorClasses: Record<ProjectColor, { background: string; text: string }> =
  {
    red: { background: "bg-project-red", text: "text-project-red" },
    orange: { background: "bg-project-orange", text: "text-project-orange" },
    amber: { background: "bg-project-amber", text: "text-project-amber" },
    green: { background: "bg-project-green", text: "text-project-green" },
    teal: { background: "bg-project-teal", text: "text-project-teal" },
    sky: { background: "bg-project-sky", text: "text-project-sky" },
    blue: { background: "bg-project-blue", text: "text-project-blue" },
    violet: { background: "bg-project-violet", text: "text-project-violet" },
    pink: { background: "bg-project-pink", text: "text-project-pink" },
    brown: { background: "bg-project-brown", text: "text-project-brown" },
  };

/** 値がプロジェクトの色のキーかどうか */
export function isProjectColor(value: unknown): value is ProjectColor {
  return (
    typeof value === "string" &&
    (PROJECT_COLORS as readonly string[]).includes(value)
  );
}

/** 色の背景のクラス（色の選択肢に使う）。DB に未知の値があれば控えめな色で代用する */
export function projectColorClass(color: string): string {
  return isProjectColor(color) ? colorClasses[color].background : "bg-muted";
}

/** 色の文字色のクラス（アイコンに使う）。DB に未知の値があれば控えめな色で代用する */
export function projectColorTextClass(color: string): string {
  return isProjectColor(color) ? colorClasses[color].text : "text-muted";
}

/** 色の名前（「赤」など）。読み上げとポインタを合わせたときの説明に使う */
export function projectColorName(color: ProjectColor): string {
  return messages.projects.colors[color];
}
