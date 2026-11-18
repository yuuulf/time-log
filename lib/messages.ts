/**
 * 画面に表示する文言。コンポーネントに直接書かず、ここから参照する。
 * 文言のルールは AGENTS.md の「UI と文言の統一」を参照。
 */
export const messages = {
  app: {
    name: "TimeLog",
    description:
      "作業にかかった時間を記録して、あとから振り返るためのアプリです。",
  },
  nav: {
    label: "メインメニュー",
  },
} as const;
