"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { favicons } from "./favicons";

/** 通常用と記録中用の URL の組（ライトはライト、ダークはダークに対応させる） */
const pairs = [
  [favicons.normal.light, favicons.recording.light],
  [favicons.normal.dark, favicons.recording.dark],
] as const;

/**
 * `<head>` のファビコンの `href` を、記録中なら記録中用に、そうでなければ通常用に書き換える。
 * `media` などほかの属性は変えないので、ライト・ダークの出し分けはブラウザに任せる
 */
export function applyFavicons(recording: boolean) {
  const links =
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
  for (const link of links) {
    const href = link.getAttribute("href");
    for (const [normal, rec] of pairs) {
      const from = recording ? normal : rec;
      const to = recording ? rec : normal;
      if (href === from) link.setAttribute("href", to);
    }
  }
}

/**
 * 記録中かどうかに合わせてファビコンを切り替える。何も描かない。
 * ページを移動したときに Next.js が `<head>` の要素を作り直しても記録中用のままになるよう、移動のたびに書き換え直す
 */
export function RecordingFavicon({ recording }: { recording: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    applyFavicons(recording);
    // 記録中の表示が消えるとき（アンマウント）は通常用に戻す
    return () => applyFavicons(false);
  }, [recording, pathname]);
  return null;
}
