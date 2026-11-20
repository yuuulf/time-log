/**
 * 入力欄（input・textarea）にフォーカスしたときの見た目。枠をテーマ色にし、ブラウザ既定の枠（outline）は出さない。
 * 入力エラーの枠（`aria-[invalid=true]:border-danger`）はこれより優先される。新しく作る入力欄にも付ける
 */
export const fieldFocusClassName = "focus:border-primary focus:outline-none";

/**
 * 入力欄と同じ見た目のボタン（プルダウンなど）にフォーカスしたときの見た目。
 * クリックでもフォーカスするので、キーボードで移ったときだけ枠をテーマ色にする
 */
export const fieldFocusVisibleClassName =
  "focus-visible:border-primary focus-visible:outline-none";
