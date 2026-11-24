// @vitest-environment node
import { describe, expect, test } from "vitest";
import { layoutTimeline, minuteOfDay, rangeFromClick } from "./timeline";

const dayStart = new Date("2026-11-18T00:00:00+09:00");
const at = (time: string) => new Date(`2026-11-18T${time}+09:00`);
/** 時分から dayStart からの分を作る */
const min = (h: number, m: number) => h * 60 + m;
const entry = (start: string, end: string | null) => ({
  startedAt: at(start),
  endedAt: end ? at(end) : null,
});

describe("minuteOfDay", () => {
  test("0 時からの分にする", () => {
    expect(minuteOfDay(at("09:15:00"), dayStart)).toBe(min(9, 15));
    expect(minuteOfDay(at("09:15:30"), dayStart)).toBe(min(9, 15) + 0.5);
  });

  test("翌日の時刻は 24 時で切る", () => {
    expect(minuteOfDay(new Date("2026-11-19T00:30:00+09:00"), dayStart)).toBe(
      1440,
    );
  });
});

describe("layoutTimeline", () => {
  test("帯の分を開始の早い順に返す", () => {
    const blocks = layoutTimeline(
      [entry("13:00:00", "14:00:00"), entry("09:15:00", "10:30:00")],
      dayStart,
    );

    expect(blocks).toMatchObject([
      {
        startMinute: min(9, 15),
        endMinute: min(10, 30),
        column: 0,
        columns: 1,
      },
      { startMinute: min(13, 0), endMinute: min(14, 0), column: 0, columns: 1 },
    ]);
  });

  test("記録中の記録は開始から 30 分ぶんの帯にする", () => {
    const [block] = layoutTimeline([entry("13:00:00", null)], dayStart);

    expect(block).toMatchObject({
      startMinute: min(13, 0),
      endMinute: min(13, 30),
    });
  });

  test("翌日に終わる記録は 24 時で切る", () => {
    const [block] = layoutTimeline(
      [
        {
          startedAt: at("23:30:00"),
          endedAt: new Date("2026-11-19T00:30:00+09:00"),
        },
      ],
      dayStart,
    );

    expect(block.endMinute).toBe(1440);
  });

  test("重なる記録は別の段に置き、段の数をそろえる", () => {
    const blocks = layoutTimeline(
      [
        entry("09:00:00", "10:00:00"),
        entry("09:30:00", "11:00:00"),
        entry("10:00:00", "10:30:00"),
        entry("12:00:00", "13:00:00"),
      ],
      dayStart,
    );

    expect(blocks.map(({ column, columns }) => [column, columns])).toEqual([
      [0, 2],
      [1, 2],
      // 9:00〜10:00 の段が空いたので左の段に置く
      [0, 2],
      // 重ならない記録は 1 段
      [0, 1],
    ]);
  });

  test("短い記録が続くときは、描く高さで重なるので別の段に置く", () => {
    const blocks = layoutTimeline(
      [entry("09:00:00", "09:05:00"), entry("09:05:00", "09:10:00")],
      dayStart,
    );

    expect(blocks.map(({ column, columns }) => [column, columns])).toEqual([
      [0, 2],
      [1, 2],
    ]);
    // 帯の分は実際の時刻のまま
    expect(blocks[0].endMinute).toBe(min(9, 5));
  });

  test("短い記録でも、描く高さより離れていれば同じ段", () => {
    const blocks = layoutTimeline(
      [entry("09:00:00", "09:05:00"), entry("09:25:00", "09:30:00")],
      dayStart,
    );

    expect(blocks.map((b) => b.columns)).toEqual([1, 1]);
  });

  test("続けて並ぶ記録（終了と開始が同じ）は重ならない", () => {
    const blocks = layoutTimeline(
      [entry("09:00:00", "10:00:00"), entry("10:00:00", "11:00:00")],
      dayStart,
    );

    expect(blocks.map((b) => b.columns)).toEqual([1, 1]);
  });
});

describe("rangeFromClick", () => {
  const now = at("15:00:00");

  test("15 分単位に切り捨てた時刻から 30 分", () => {
    expect(rangeFromClick(min(10, 40), [], now, dayStart)).toEqual({
      startedAt: at("10:30:00"),
      endedAt: at("11:00:00"),
    });
  });

  test("次の記録の手前までにする", () => {
    expect(
      rangeFromClick(
        min(10, 55),
        [entry("11:00:00", "12:00:00")],
        now,
        dayStart,
      ),
    ).toEqual({ startedAt: at("10:45:00"), endedAt: at("11:00:00") });
  });

  test("前の記録の終わりから始める", () => {
    expect(
      rangeFromClick(
        min(10, 55),
        [entry("10:00:00", "10:50:00")],
        now,
        dayStart,
      ),
    ).toEqual({ startedAt: at("10:50:00"), endedAt: at("11:20:00") });
  });

  test("今の時刻の手前までにする（分に切り捨て）", () => {
    expect(rangeFromClick(min(15, 5), [], at("15:10:40"), dayStart)).toEqual({
      startedAt: at("15:00:00"),
      endedAt: at("15:10:00"),
    });
  });

  test("今より後の場所では null", () => {
    expect(rangeFromClick(min(16, 0), [], now, dayStart)).toBeNull();
  });

  test("記録中の記録は前で終わる記録に数えず、その開始で区切る", () => {
    expect(
      rangeFromClick(min(12, 50), [entry("13:00:00", null)], now, dayStart),
    ).toEqual({ startedAt: at("12:45:00"), endedAt: at("13:00:00") });
  });

  test("入れられる長さがないときは null", () => {
    expect(rangeFromClick(min(15, 0), [], at("15:00:20"), dayStart)).toBeNull();
  });
});
