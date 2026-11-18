/**
 * 時刻の表示と入力値の変換。保存は UTC、表示と入力は日本時間で行う。
 * サーバーやブラウザのタイムゾーンには依存しない。
 */

export const TIME_ZONE = "Asia/Tokyo";

/** 日本時間の UTC からのずれ。日本には夏時間がないため固定 */
const JST_OFFSET = "+09:00";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const weekdayFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

/** 日本時間での年月日時分秒（ゼロ埋め済みの文字列） */
function jstParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** 時刻を「09:05」の形で表示する */
export function formatTime(date: Date): string {
  const { hour, minute } = jstParts(date);
  return `${hour}:${minute}`;
}

/** 日付を「2026年11月18日（水）」の形で表示する */
export function formatDateHeading(date: Date): string {
  const { year, month, day } = jstParts(date);
  const weekday = weekdayFormatter.format(date);
  return `${year}年${Number(month)}月${Number(day)}日（${weekday}）`;
}

/** 日付ごとにまとめるためのキー（日本時間の「2026-11-18」） */
export function toDateKey(date: Date): string {
  const { year, month, day } = jstParts(date);
  return `${year}-${month}-${day}`;
}

/** 作業時間を分単位に切り捨てて「1時間5分」「5分」「0分」の形で表示する */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
}

/** `<input type="datetime-local" step="1">` に入れる値（日本時間の「2026-11-18T09:05:30」） */
export function toDateTimeLocalValue(date: Date): string {
  const { year, month, day, hour, minute, second } = jstParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

const DATE_TIME_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * `datetime-local` の値を日本時間として解釈する。秒は省略できる。
 * 形式が正しくない、または存在しない日時なら null を返す。
 */
export function parseDateTimeLocalValue(value: string): Date | null {
  const match = DATE_TIME_LOCAL.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "00"] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const date = new Date(`${iso}${JST_OFFSET}`);
  // 2026-02-30 のような存在しない日時は、変換し直すと値が変わるので弾く
  if (Number.isNaN(date.getTime()) || toDateTimeLocalValue(date) !== iso) {
    return null;
  }
  return date;
}
