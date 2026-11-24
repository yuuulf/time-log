import Image from "next/image";

const SIZE = 24;

/**
 * アプリ名の横に置く TimeLog のロゴ。画面のライト・ダークに合わせて CSS で出し分ける。
 * 飾りなので alt を空にし、読み上げはアプリ名の文字に任せる
 */
export function AppLogo() {
  return (
    <>
      <Image
        src="/icon-light.png"
        alt=""
        width={SIZE}
        height={SIZE}
        unoptimized
        className="size-6 shrink-0 dark:hidden"
      />
      <Image
        src="/icon-dark.png"
        alt=""
        width={SIZE}
        height={SIZE}
        unoptimized
        className="hidden size-6 shrink-0 dark:block"
      />
    </>
  );
}
