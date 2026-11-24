// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  HISTORY_VIEW_COOKIE,
  parseTodayView,
  todayViewCookie,
  viewCookie,
} from "./today-view";

describe("parseTodayView", () => {
  test("timeline ならタイムライン", () => {
    expect(parseTodayView("timeline")).toBe("timeline");
  });

  test.each([[undefined], ["list"], ["calendar"], [""]])(
    "%j は一覧",
    (value) => {
      expect(parseTodayView(value)).toBe("list");
    },
  );
});

test("Cookie はサイト全体で 1 年残す", () => {
  expect(todayViewCookie("timeline")).toBe(
    "timelog-today-view=timeline; path=/; max-age=31536000; samesite=lax",
  );
});

test("過去の記録は今日の記録と別の名前の Cookie に覚える", () => {
  expect(viewCookie(HISTORY_VIEW_COOKIE, "timeline")).toBe(
    "timelog-history-view=timeline; path=/; max-age=31536000; samesite=lax",
  );
});
