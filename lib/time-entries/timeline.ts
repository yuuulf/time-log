/** 1 日の分の数 */
export const DAY_MINUTES = 24 * 60;

/** 記録中の記録の帯の長さ（分）。終了するまでは今の時刻に合わせて伸ばさない */
export const RUNNING_BLOCK_MINUTES = 30;

/** 空いている場所を選んだときの開始時刻の切り捨ての単位（分） */
const SNAP_MINUTES = 15;

/** 追加の入力欄に入れておく長さ（分） */
const DEFAULT_LENGTH_MINUTES = 30;

const MINUTE_MS = 60 * 1000;

/** タイムラインに置く記録 */
export type TimelineEntry = { startedAt: Date; endedAt: Date | null };

/** 帯の位置。分は dayStart（日本時間の 0 時）からの分。column は 0 から数えた段、columns はその重なりの段の数 */
export type TimelineBlock<T extends TimelineEntry> = T & {
  startMinute: number;
  endMinute: number;
  column: number;
  columns: number;
};

/** 日時を dayStart からの分にする。0〜1440 の外は丸める（翌日に終わる記録は 24 時で切る） */
export function minuteOfDay(date: Date, dayStart: Date): number {
  const minutes = (date.getTime() - dayStart.getTime()) / MINUTE_MS;
  return Math.min(DAY_MINUTES, Math.max(0, minutes));
}

/**
 * 記録の帯の位置と、重なる記録を横に並べる段を求める。返す順は開始の早い順。
 * 記録中の記録は開始から RUNNING_BLOCK_MINUTES 分の帯にする
 */
export function layoutTimeline<T extends TimelineEntry>(
  entries: T[],
  dayStart: Date,
): TimelineBlock<T>[] {
  const blocks = entries
    .map((entry) => {
      const startMinute = minuteOfDay(entry.startedAt, dayStart);
      const endMinute = entry.endedAt
        ? minuteOfDay(entry.endedAt, dayStart)
        : Math.min(DAY_MINUTES, startMinute + RUNNING_BLOCK_MINUTES);
      return { ...entry, startMinute, endMinute, column: 0, columns: 1 };
    })
    .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);

  // 時間が続けて重なる記録をひとまとまりにし、まとまりの中で空いている最も左の段に置く
  let group: TimelineBlock<T>[] = [];
  let groupEnd = -1;
  /** 段ごとの、最後に置いた帯の終わり */
  let columnEnds: number[] = [];
  const closeGroup = () => {
    for (const block of group) block.columns = columnEnds.length;
    group = [];
    columnEnds = [];
  };
  for (const block of blocks) {
    if (block.startMinute >= groupEnd) closeGroup();
    let column = columnEnds.findIndex((end) => end <= block.startMinute);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = block.endMinute;
    block.column = column;
    group.push(block);
    groupEnd = Math.max(groupEnd, block.endMinute);
  }
  closeGroup();
  return blocks;
}

/** 日時を分に切り捨てる */
function floorToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS);
}

export type TimeRange = { startedAt: Date; endedAt: Date };

/**
 * タイムラインの空いている場所（dayStart からの分）を選んだときの、入力欄の初期の開始・終了の時刻。
 * 開始は 15 分単位に切り捨て、選んだ位置より前で終わる記録の終了のほうが遅ければそこにする。
 * 終了は開始の 30 分後・選んだ位置より後で始まる記録の開始・今の時刻（分に切り捨て）のうち最も早いもの。
 * 記録中の記録は終了がないので「前で終わる記録」には数えない。
 * 今の時刻より後の場所、または入れられる長さがないときは null
 */
export function rangeFromClick(
  minute: number,
  entries: TimelineEntry[],
  now: Date,
  dayStart: Date,
): TimeRange | null {
  const clicked = new Date(dayStart.getTime() + minute * MINUTE_MS);
  if (clicked.getTime() > now.getTime()) return null;

  let start = new Date(
    dayStart.getTime() +
      Math.floor(minute / SNAP_MINUTES) * SNAP_MINUTES * MINUTE_MS,
  );
  for (const entry of entries) {
    const { endedAt } = entry;
    if (endedAt && endedAt <= clicked && endedAt > start) start = endedAt;
  }

  let end = new Date(start.getTime() + DEFAULT_LENGTH_MINUTES * MINUTE_MS);
  for (const entry of entries) {
    const { startedAt } = entry;
    if (startedAt >= clicked && startedAt < end) end = startedAt;
  }
  const nowMinute = floorToMinute(now);
  if (nowMinute < end) end = nowMinute;

  if (end <= start) return null;
  return { startedAt: start, endedAt: end };
}

/** 「記録の追加」ボタンで開く入力欄の初期の時刻。今の時刻（分に切り捨て）の 30 分前〜今の時刻 */
export function rangeBeforeNow(now: Date): TimeRange {
  const endedAt = floorToMinute(now);
  return {
    startedAt: new Date(endedAt.getTime() - DEFAULT_LENGTH_MINUTES * MINUTE_MS),
    endedAt,
  };
}
