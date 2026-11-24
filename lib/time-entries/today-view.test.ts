// @vitest-environment node
import { describe, expect, test } from "vitest";
import { parseTodayView, todayViewCookie } from "./today-view";

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
