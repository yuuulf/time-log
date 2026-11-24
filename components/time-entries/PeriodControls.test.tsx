import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { resolveHistoryQuery } from "@/lib/time-entries/history";
import { PeriodControls } from "./PeriodControls";

const t = messages.history;
// 日本時間 2026-11-18 12:00
const now = new Date("2026-11-18T12:00:00+09:00");

const renderControls = (params: Record<string, string>) =>
  render(
    <PeriodControls
      view={resolveHistoryQuery(params, now)}
      basePath="/summary"
    />,
  );

test("月の切り替えのリンクとフォームの送り先は、渡したパスになる", () => {
  renderControls({ month: "2026-10" });

  expect(
    screen.getByRole("link", { name: t.prevMonth }).getAttribute("href"),
  ).toBe("/summary?month=2026-09");
  expect(
    screen.getByRole("link", { name: t.nextMonth }).getAttribute("href"),
  ).toBe("/summary?month=2026-11");
  expect(
    screen
      .getByRole("button", { name: t.show })
      .closest("form")
      ?.getAttribute("action"),
  ).toBe("/summary");
});

test("今月は次の月を選べない", () => {
  renderControls({});

  expect(screen.queryByRole("link", { name: t.nextMonth })).toBeNull();
  expect(
    screen
      .getByRole<HTMLButtonElement>("button", { name: t.nextMonth })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("期間の指定中は「月ごとの表示」で渡したパスに戻る", () => {
  renderControls({ from: "2026-10-01", to: "2026-10-15" });

  expect(
    screen.getByRole("link", { name: t.monthView }).getAttribute("href"),
  ).toBe("/summary");
  expect(screen.queryByRole("link", { name: t.prevMonth })).toBeNull();
  expect(
    screen.getByRole<HTMLInputElement>("textbox", { name: t.from }).value,
  ).toBe("2026年10月1日");
  expect(
    (document.querySelector('input[name="from"]') as HTMLInputElement).value,
  ).toBe("2026-10-01");
});

test("入力の誤りは理由を表示し、入力欄を誤りとして示す", () => {
  renderControls({ from: "2026-10-15", to: "2026-10-01" });

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toBe(t.errors.endBeforeStart);
  const from = screen.getByRole("textbox", { name: t.from });
  expect(from.getAttribute("aria-invalid")).toBe("true");
  expect(from.getAttribute("aria-describedby")).toBe(alert.id);
});

test("開始日・終了日は週の指定と同じ月のカレンダーで選び、フォーカスしたとき枠をテーマ色にする", () => {
  renderControls({});

  for (const label of [t.from, t.to]) {
    const field = screen.getByRole<HTMLInputElement>("textbox", {
      name: label,
    });
    expect(field.className).toContain("focus:border-primary");
    expect(field.placeholder).toBe(label);
    expect(
      screen.getByRole("button", { name: t.weekPicker.calendar(label) }),
    ).toBeDefined();
  }
  expect(document.querySelector('input[type="date"]')).toBeNull();
});
