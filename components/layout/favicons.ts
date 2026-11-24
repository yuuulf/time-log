/** ファビコンの画像の URL。ライト用とダーク用を、通常（記録中でない）と記録中で分けて持つ */
export const favicons = {
  normal: { light: "/icon-light.png", dark: "/icon-dark.png" },
  recording: {
    light: "/icon-recording-light.png",
    dark: "/icon-recording-dark.png",
  },
} as const;

/** ダークモードのときだけ使うファビコンの media */
export const darkFaviconMedia = "(prefers-color-scheme: dark)";
