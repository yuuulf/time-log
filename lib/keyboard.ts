/**
 * 日本語入力などの変換中のキー操作かどうか。変換の確定の Enter を、入力の確定として扱わないために使う。
 * isComposing のないブラウザでは、変換中のキーの keyCode が 229 になる
 */
export function isComposing(event: {
  nativeEvent: { isComposing?: boolean };
  keyCode?: number;
}): boolean {
  return event.nativeEvent.isComposing === true || event.keyCode === 229;
}
