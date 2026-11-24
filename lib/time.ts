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

/** 日本時間の曜日。月曜日を 0、日曜日を 6 とする（週を月曜日で区切るため） */
export function jstWeekdayFromMonday(date: Date): number {
  const { year, month, day } = jstParts(date);
  const sundayFirst = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  ).getUTCDay();
  return (sundayFirst + 6) % 7;
}

/** 日付を「11月16日」の形で表示する */
export function formatMonthDay(date: Date): string {
  const { month, day } = jstParts(date);
  return `${Number(month)}月${Number(day)}日`;
}

/** 日付を「11月16日（月）」の形で表示する（曜日は日付の見出しと同じ表記） */
export function formatMonthDayWithWeekday(date: Date): string {
  return `${formatMonthDay(date)}（${weekdayFormatter.format(date)}）`;
}

/** 作業時間を分単位に切り捨てて「1時間5分」「5分」「0分」の形で表示する */
export function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
}

const MINUTE_MS = 60 * 1000;

/**
 * 記録 1 件の作業時間（ミリ秒）。記録の一覧の表示と同じく分に切り捨てる。記録中（endedAt が null）なら 0。
 * 日の合計や集計は、これを足し合わせて記録の一覧に並ぶ作業時間の合計と一致させる
 */
export function entryDurationMs({
  startedAt,
  endedAt,
}: {
  startedAt: Date;
  endedAt: Date | null;
}): number {
  if (!endedAt) return 0;
  const ms = Math.max(0, endedAt.getTime() - startedAt.getTime());
  return Math.floor(ms / MINUTE_MS) * MINUTE_MS;
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

/** 年と月（月は 1〜12） */
export type YearMonth = { year: number; month: number };

const DATE_VALUE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_VALUE = /^(\d{4})-(\d{2})$/;

/**
 * `<input type="date">` の値（「2026-10-01」）を、その日の日本時間 0 時として解釈する。
 * 形式が正しくない、または存在しない日付なら null を返す。
 */
export function parseDateValue(value: string): Date | null {
  if (!DATE_VALUE.test(value)) return null;
  return parseDateTimeLocalValue(`${value}T00:00`);
}

// 日本時間には夏時間がないため、1 日はいつも 24 時間
export const DAY_MS = 24 * 60 * 60 * 1000;

/** その日の範囲。日本時間のその日の 0 時（from）から翌日 0 時（to、含まない）まで */
export function dayRange(date: Date): { from: Date; to: Date } {
  const from = parseDateValue(toDateKey(date))!;
  return { from, to: new Date(from.getTime() + DAY_MS) };
}

/** その日を含む週の月曜日（日本時間の 0 時）。週は月曜日で区切る */
export function weekStart(date: Date): Date {
  const { from } = dayRange(date);
  return new Date(from.getTime() - jstWeekdayFromMonday(date) * DAY_MS);
}

/** 日付を「11/16（月）」の形で表示する（週のカレンダーの列の見出し） */
export function formatShortDayHeading(date: Date): string {
  const { month, day } = jstParts(date);
  return `${Number(month)}/${Number(day)}（${weekdayFormatter.format(date)}）`;
}

/** 開始時刻と終了時刻の区間 */
export type TimeSpan = { startedAt: Date; endedAt: Date };

/**
 * 区間を日本時間の日ごとに分ける。前の日の区間は 23:59:59 で終わり、次の日の区間は 0:00:00 から始まる。
 * 日をまたがない区間（終了がちょうど翌日 0 時のときも含む）は、そのまま 1 つで返す。
 * 長さが 0 以下になる区間（開始が 23:59:59 以降の前の日の区間）は作らない。
 */
export function splitByJstDay(startedAt: Date, endedAt: Date): TimeSpan[] {
  const spans: TimeSpan[] = [];
  let start = startedAt;
  let nextDay = dayRange(startedAt).to;
  while (endedAt.getTime() > nextDay.getTime()) {
    const dayEnd = new Date(nextDay.getTime() - 1000);
    if (dayEnd.getTime() > start.getTime()) {
      spans.push({ startedAt: start, endedAt: dayEnd });
    }
    start = nextDay;
    nextDay = new Date(nextDay.getTime() + DAY_MS);
  }
  spans.push({ startedAt: start, endedAt });
  return spans;
}

/** 月の値（「2026-10」）を解釈する。形式が正しくない、または 1〜12 月でなければ null を返す */
export function parseMonthValue(value: string): YearMonth | null {
  const match = MONTH_VALUE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** 月を「2026-10」の形にする。URL に使う */
export function toMonthValue({ year, month }: YearMonth): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

/** 日本時間での今月 */
export function currentMonth(now: Date): YearMonth {
  const { year, month } = jstParts(now);
  return { year: Number(year), month: Number(month) };
}

/** 月を n か月ずらす（負の値で前の月） */
export function addMonths({ year, month }: YearMonth, n: number): YearMonth {
  const index = year * 12 + (month - 1) + n;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** 月を比べる。a が前なら負、同じなら 0、後なら正 */
export function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

/** 月の範囲。日本時間の 1 日 0 時（from）から翌月 1 日 0 時（to、含まない）まで */
export function monthRange(ym: YearMonth): { from: Date; to: Date } {
  const start = (m: YearMonth) => parseDateValue(`${toMonthValue(m)}-01`)!;
  return { from: start(ym), to: start(addMonths(ym, 1)) };
}

/** 月を「2026年10月」の形で表示する */
export function formatMonthHeading({ year, month }: YearMonth): string {
  return `${year}年${month}月`;
}

/** 期間を「2026年10月1日〜2026年10月15日」の形で表示する。first と last はその日の中の時刻 */
export function formatRangeHeading(first: Date, last: Date): string {
  const day = (date: Date) => {
    const { year, month, day } = jstParts(date);
    return `${year}年${Number(month)}月${Number(day)}日`;
  };
  return `${day(first)}〜${day(last)}`;
}

/** 月のカレンダーの行（週）。月曜日始まりで、その月の日を含む週ごとに 7 日ずつの 0 時（日本時間） */
export function calendarWeeks(ym: YearMonth): Date[][] {
  const { from, to } = monthRange(ym);
  const weeks: Date[][] = [];
  for (
    let first = weekStart(from);
    first < to;
    first = new Date(first.getTime() + 7 * DAY_MS)
  ) {
    weeks.push(
      Array.from(
        { length: 7 },
        (_, i) => new Date(first.getTime() + i * DAY_MS),
      ),
    );
  }
  return weeks;
}

/** 日付の日（1〜31） */
export function dayOfMonth(date: Date): number {
  return Number(jstParts(date).day);
}

/** 日付を「2026/10/01」の形にする（日付の入力欄で編集するときの文字） */
export function formatDateInput(date: Date): string {
  return toDateKey(date).replaceAll("-", "/");
}

const DATE_INPUT = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/;
const DATE_INPUT_JA = /^(\d{4})年(\d{1,2})月(\d{1,2})日$/;

/**
 * 日付の入力欄に入力した文字を、その日の日本時間 0 時として読む。
 * 「2026/10/1」「2026-10-01」「2026.10.1」「2026年10月1日」の形を受け取り、全角の数字・記号も読む。
 * 読めない、または存在しない日付なら null
 */
export function parseDateInput(text: string): Date | null {
  const normalized = text
    .trim()
    .replace(/[０-９／－．]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0),
    );
  const match = DATE_INPUT.exec(normalized) ?? DATE_INPUT_JA.exec(normalized);
  if (!match) return null;
  const [, year, month, day] = match;
  return parseDateValue(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
  );
}
