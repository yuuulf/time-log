import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { summarize, type SummaryEntry } from "@/lib/summary/summarize";
import { resolveHistoryQuery } from "@/lib/time-entries/history";
import { SummaryContent } from "./SummaryContent";

const t = messages.summary;
// 日本時間 2026-11-20 12:00
const now = new Date("2026-11-20T12:00:00+09:00");
const dev = { id: 1, name: "開発", color: "blue" };

const entry = (
  start: string,
  minutes: number,
  project: SummaryEntry["project"] = null,
): SummaryEntry => {
  const startedAt = new Date(`${start}+09:00`);
  return {
    startedAt,
    endedAt: new Date(startedAt.getTime() + minutes * 60_000),
    project,
  };
};

const renderSummary = (
  params: Record<string, string>,
  entries: SummaryEntry[] = [],
) => {
  const view = resolveHistoryQuery(params, now);
  const summary =
    view.mode === "rangeError" ? null : summarize(entries, view.range);
  return render(<SummaryContent view={view} summary={summary} />);
};

/** 見出しの名前の表の、行ごとのセルの文字 */
const rows = (heading: string) => {
  const section = screen.getByRole("region", { name: heading });
  return within(section)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      Array.from(row.querySelectorAll("th, td"), (cell) => cell.textContent),
    );
};

test("期間の見出し、合計時間と稼働日数を表示する", () => {
  renderSummary({}, [
    entry("2026-11-04T09:00", 90, dev),
    entry("2026-11-05T09:00", 45),
  ]);

  expect(
    screen.getByRole("heading", { level: 2, name: "2026年11月" }),
  ).toBeDefined();
  expect(
    screen.getByText(t.total, { selector: "dt" }).nextSibling?.textContent,
  ).toBe("2時間15分");
  expect(
    screen.getByText(t.workDays, { selector: "dt" }).nextSibling?.textContent,
  ).toBe("2日");
});

test("合計時間と稼働日数の下に、秒を記録ごとに切り捨てて集計している旨を添える", () => {
  renderSummary({});

  const note = screen.getByText(t.roundingNote);
  expect(note.textContent).toBe(
    "作業時間は記録ごとに秒を切り捨てて集計しています。",
  );
  expect(note.previousElementSibling?.tagName).toBe("DL");
});

test("「週ごとの集計」に、週ごとの合計時間と稼働日数を週の範囲と一緒に古い順に表示する", () => {
  renderSummary({}, [
    entry("2026-11-02T09:00", 60),
    entry("2026-11-08T09:00", 30),
  ]);

  expect(rows(t.weekly)).toEqual([
    ["11月1日〜11月1日", "0分", "0日"],
    ["11月2日〜11月8日", "1時間30分", "2日"],
    ["11月9日〜11月15日", "0分", "0日"],
    ["11月16日〜11月22日", "0分", "0日"],
    ["11月23日〜11月29日", "0分", "0日"],
    ["11月30日〜11月30日", "0分", "0日"],
  ]);
});

test("「プロジェクトごとの集計」に、プロジェクトごとの合計時間と稼働日数をアイコンと名前で長い順に表示する", () => {
  renderSummary({}, [
    entry("2026-11-04T09:00", 60),
    entry("2026-11-04T10:00", 120, dev),
  ]);

  expect(rows(t.byProject)).toEqual([
    ["開発", "2時間0分", "1日"],
    [messages.timeEntries.noProject, "1時間0分", "1日"],
  ]);
  const section = screen.getByRole("region", { name: t.byProject });
  expect(within(section).getByTitle("開発")).toBeDefined();
});

test("記録がなければ 0 を表示し、プロジェクトの欄に記録がないことを伝える", () => {
  renderSummary({ month: "2026-10" });

  expect(
    screen.getByText(t.total, { selector: "dt" }).nextSibling?.textContent,
  ).toBe("0分");
  expect(
    screen.getByText(t.workDays, { selector: "dt" }).nextSibling?.textContent,
  ).toBe("0日");
  expect(screen.getByText(t.noEntries)).toBeDefined();
});

test("期間を指定すると、期間の見出しで集計し、「月ごとの表示」で /summary に戻る", () => {
  renderSummary({ from: "2026-10-20", to: "2026-11-10" });

  expect(
    screen.getByRole("heading", {
      level: 2,
      name: "2026年10月20日〜2026年11月10日",
    }),
  ).toBeDefined();
  expect(
    screen
      .getByRole("link", { name: messages.history.monthView })
      .getAttribute("href"),
  ).toBe("/summary");
  expect(rows(t.weekly).map(([week]) => week)).toEqual([
    "10月20日〜10月25日",
    "10月26日〜11月1日",
    "11月2日〜11月8日",
    "11月9日〜11月10日",
  ]);
});

test("週ごととプロジェクトごとの欄の見出しは「週ごとの集計」「プロジェクトごとの集計」", () => {
  renderSummary({}, [entry("2026-11-04T09:00", 60)]);

  expect(
    screen.getByRole("heading", { level: 3, name: "週ごとの集計" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 3, name: "プロジェクトごとの集計" }),
  ).toBeDefined();
});

test("入力に誤りがあれば、集計を表示せず理由を表示する", () => {
  renderSummary({ from: "2026-10-15", to: "2026-10-01" });

  expect(screen.getByRole("alert").textContent).toBe(
    messages.history.errors.endBeforeStart,
  );
  expect(screen.queryByText(t.workDays)).toBeNull();
  expect(screen.queryByRole("region", { name: t.weekly })).toBeNull();
});
