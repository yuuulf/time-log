/** 「今日の記録」の表示。list は一覧、timeline はタイムライン（ボタンの名前は「カレンダー」） */
export type TodayView = "list" | "timeline";

/** 最後に選んだ表示を覚えておく Cookie の名前 */
export const TODAY_VIEW_COOKIE = "timelog-today-view";

/** Cookie を残す期間（秒）。1 年 */
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Cookie の値から表示を決める。ないときや知らない値は一覧 */
export function parseTodayView(value: string | undefined): TodayView {
  return value === "timeline" ? "timeline" : "list";
}

/** 表示を覚えておく Cookie の文字列（document.cookie に書く） */
export function todayViewCookie(view: TodayView): string {
  return `${TODAY_VIEW_COOKIE}=${view}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}
