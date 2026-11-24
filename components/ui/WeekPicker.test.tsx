import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { WeekPicker } from "./WeekPicker";

const jst = (value: string) => new Date(`${value}+09:00`);
const labels = {
  label: "表示する週",
  prevMonth: "前の月",
  nextMonth: "次の月",
  weekdays: ["月", "火", "水", "木", "金", "土", "日"],
  calendar: (label: string) => `${label}のカレンダー`,
};
// 今週は 2026年11月23日〜29日
const maxWeek = jst("2026-11-23T00:00:00");

function setup(value = maxWeek) {
  const { container } = render(
    <form>
      <WeekPicker name="week" value={value} maxWeek={maxWeek} labels={labels} />
    </form>,
  );
  const input = screen.getByRole("textbox", { name: "表示する週" });
  const button = screen.getByRole("button", { name: "表示する週のカレンダー" });
  const hidden = container.querySelector(
    'input[name="week"]',
  ) as HTMLInputElement;
  return { input: input as HTMLInputElement, button, hidden };
}

const grid = () => screen.getByRole("grid");
const day = (name: string) => screen.getByRole("button", { name });
const rowOf = (name: string) => day(name).closest('[role="row"]')!;

describe("週の指定", () => {
  test("入力欄に表示中の週の期間を出し、値は月曜日", () => {
    const { input, hidden } = setup();

    expect(input.value).toBe("2026年11月23日〜2026年11月29日");
    expect(hidden.value).toBe("2026-11-23");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  test("カレンダーのボタンで月曜日始まりの月のカレンダーを開き、選んでいる週の行を強調する", () => {
    const { button } = setup();

    fireEvent.click(button);

    expect(grid().getAttribute("aria-label")).toBe("2026年11月");
    const headers = within(grid()).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(labels.weekdays);
    const selectedRow = rowOf("2026年11月25日（水）");
    expect(selectedRow.getAttribute("aria-selected")).toBe("true");
    expect(selectedRow.className).toContain("bg-primary/15");
    expect(rowOf("2026年11月11日（水）").className).toContain(
      "hover:bg-border/40",
    );
    expect(screen.getByRole("dialog").className).toContain("z-40");
  });

  test("カレンダーで日を選ぶと、その日を含む週を入れて閉じる", () => {
    const { input, button, hidden } = setup();
    fireEvent.click(button);

    fireEvent.click(screen.getByRole("button", { name: "前の月" }));
    fireEvent.click(day("2026年10月14日（水）"));

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-10-12");
    expect(input.value).toBe("2026年10月12日〜2026年10月18日");
    expect(document.activeElement).toBe(button);
  });

  test("入力した日を含む週を選ぶ", () => {
    const { input, hidden } = setup();

    fireEvent.focus(input);
    expect(input.value).toBe("2026/11/23");
    fireEvent.change(input, { target: { value: "2026/10/14" } });
    fireEvent.blur(input);

    expect(hidden.value).toBe("2026-10-12");
    expect(input.value).toBe("2026年10月12日〜2026年10月18日");
  });

  test("今週より先の日付を入力しても受け取らない", () => {
    const { input, hidden } = setup();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2026/12/10" } });
    fireEvent.blur(input);

    expect(hidden.value).toBe("2026-11-23");
    expect(input.value).toBe("2026年11月23日〜2026年11月29日");
  });

  test("今週より先の週の日は選べず、次の月にも進めない", () => {
    const { button } = setup();
    fireEvent.click(button);

    expect(day("2026年11月30日（月）").hasAttribute("disabled")).toBe(true);
    expect(day("2026年11月29日（日）").hasAttribute("disabled")).toBe(false);
    expect(
      screen.getByRole("button", { name: "次の月" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("キーボードで、上の矢印キーで 1 週前に移り Enter で選ぶ", () => {
    const { button, hidden } = setup();
    button.focus();
    fireEvent.click(button);

    expect(document.activeElement).toBe(day("2026年11月23日（月）"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(document.activeElement).toBe(day("2026年11月16日（月）"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(day("2026年11月17日（火）"));
    fireEvent.click(document.activeElement!);

    expect(hidden.value).toBe("2026-11-16");
  });

  test("月の外へ移ると月を切り替える", () => {
    const { button } = setup(jst("2026-11-02T00:00:00"));
    fireEvent.click(button);

    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(grid().getAttribute("aria-label")).toBe("2026年10月");
    expect(document.activeElement).toBe(day("2026年10月26日（月）"));
  });

  test("Escape キーでカレンダーを選ばずに閉じ、ボタンにフォーカスを戻す", () => {
    const { button, hidden } = setup();
    fireEvent.click(button);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-11-23");
    expect(document.activeElement).toBe(button);
  });
});
