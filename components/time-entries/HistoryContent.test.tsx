import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { resolveHistoryQuery } from "@/lib/time-entries/history";
import { HistoryContent } from "./HistoryContent";

vi.mock("@/lib/time-entries/actions", () => ({
  updateEntryAction: vi.fn(),
  deleteEntryAction: vi.fn(),
  startEntryAction: vi.fn(),
}));

const t = messages.history;
// 日本時間 2026-11-18 12:00
const now = new Date("2026-11-18T12:00:00+09:00");
const entry = {
  id: 1,
  taskName: "資料作成",
  startedAt: new Date("2026-10-15T09:00:00+09:00"),
  endedAt: new Date("2026-10-15T10:00:00+09:00"),
};

const renderView = (
  params: Record<string, string>,
  entries: (typeof entry)[] = [],
) =>
  render(
    <HistoryContent
      view={resolveHistoryQuery(params, now)}
      entries={entries}
    />,
  );

describe("月の表示", () => {
  test("見出しに月を表示し、前後の月へのリンクを置く", () => {
    renderView({ month: "2026-10" }, [entry]);

    expect(
      screen.getByRole("heading", { level: 2, name: "2026年10月" }),
    ).toBeDefined();
    expect(
      screen.getByRole("textbox", { name: messages.timeEntries.taskName }),
    ).toHaveProperty("value", "資料作成");
    expect(
      screen.getByRole("link", { name: t.prevMonth }).getAttribute("href"),
    ).toBe("/history?month=2026-09");
    expect(
      screen.getByRole("link", { name: t.nextMonth }).getAttribute("href"),
    ).toBe("/history?month=2026-11");
    expect(screen.queryByRole("link", { name: t.monthView })).toBeNull();
  });

  test("今月は次の月を選べない", () => {
    renderView({});

    expect(screen.queryByRole("link", { name: t.nextMonth })).toBeNull();
    expect(
      screen
        .getByRole<HTMLButtonElement>("button", { name: t.nextMonth })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  test("記録がなければ、この期間の記録がないことを伝える", () => {
    renderView({});

    expect(screen.getByText(t.empty)).toBeDefined();
  });

  test("期間の入力欄は空", () => {
    renderView({});

    expect(screen.getByLabelText<HTMLInputElement>(t.from).value).toBe("");
    expect(screen.getByLabelText<HTMLInputElement>(t.to).value).toBe("");
  });
});

describe("期間の表示", () => {
  test("見出しに期間を表示し、月の切り替えの代わりに「月ごとの表示」を置く", () => {
    renderView({ from: "2026-10-01", to: "2026-10-15" }, [entry]);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "2026年10月1日〜2026年10月15日",
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("textbox", { name: messages.timeEntries.taskName }),
    ).toHaveProperty("value", "資料作成");
    expect(
      screen.getByRole("link", { name: t.monthView }).getAttribute("href"),
    ).toBe("/history");
    expect(screen.queryByRole("link", { name: t.prevMonth })).toBeNull();
    expect(screen.queryByRole("button", { name: t.nextMonth })).toBeNull();
  });

  test("入力欄に指定した期間が入っている", () => {
    renderView({ from: "2026-10-01", to: "2026-10-15" });

    expect(screen.getByLabelText<HTMLInputElement>(t.from).value).toBe(
      "2026-10-01",
    );
    expect(screen.getByLabelText<HTMLInputElement>(t.to).value).toBe(
      "2026-10-15",
    );
  });

  test("入力エラーなら理由を表示し、一覧は表示せず、入力した値を残す", () => {
    renderView({ from: "2026-10-15", to: "2026-10-01" });

    expect(screen.getByRole("alert").textContent).toBe(t.errors.endBeforeStart);
    expect(screen.queryByRole("heading", { level: 2, name: /〜/ })).toBeNull();
    expect(screen.queryByText(t.empty)).toBeNull();
    const from = screen.getByLabelText<HTMLInputElement>(t.from);
    expect(from.value).toBe("2026-10-15");
    expect(from.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("link", { name: t.monthView })).toBeDefined();
  });

  test("期間の入力欄は「表示」ボタンで /history に送る", () => {
    renderView({});

    const button = screen.getByRole("button", { name: t.show });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.closest("form")?.getAttribute("action")).toBe("/history");
  });
});

describe("CSV 出力", () => {
  const csvLink = () => screen.getByRole("link", { name: t.csv.export });

  test("月の表示では、見出しの横にその月の CSV のリンクを置く", () => {
    renderView({ month: "2026-10" }, [entry]);

    expect(csvLink().getAttribute("href")).toBe(
      "/history/export?month=2026-10",
    );
    expect(csvLink().hasAttribute("download")).toBe(true);
    // 見出しと同じ行に並ぶ
    expect(
      screen.getByRole("heading", { level: 2, name: "2026年10月" })
        .parentElement,
    ).toContain(csvLink());
  });

  test("今月を表示しているときも月を明示する", () => {
    renderView({});

    expect(csvLink().getAttribute("href")).toBe(
      "/history/export?month=2026-11",
    );
  });

  test("期間の表示では、その期間の CSV のリンクを置く", () => {
    renderView({ from: "2026-10-01", to: "2026-10-15" });

    expect(csvLink().getAttribute("href")).toBe(
      "/history/export?from=2026-10-01&to=2026-10-15",
    );
  });

  test("期間の入力に誤りがあるときは出さない", () => {
    renderView({ from: "2026-10-15", to: "2026-10-01" });

    expect(screen.queryByRole("link", { name: t.csv.export })).toBeNull();
  });
});
