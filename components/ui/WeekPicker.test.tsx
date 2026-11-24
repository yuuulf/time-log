import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { WeekPicker } from "./WeekPicker";

const jst = (value: string) => new Date(`${value}+09:00`);
const labels = {
  label: "表示する週",
  prevMonth: "前の月",
  nextMonth: "次の月",
  weekdays: ["月", "火", "水", "木", "金", "土", "日"],
};
// 今週は 2026年11月23日〜29日
const maxWeek = jst("2026-11-23T00:00:00");

function setup(value = maxWeek) {
  const { container } = render(
    <form>
      <WeekPicker name="week" value={value} maxWeek={maxWeek} labels={labels} />
    </form>,
  );
  const trigger = screen.getByRole("button", { name: /^表示する週：/ });
  const hidden = container.querySelector(
    'input[name="week"]',
  ) as HTMLInputElement;
  return { trigger, hidden };
}

const grid = () => screen.getByRole("grid");
const day = (name: string) => screen.getByRole("button", { name });
const rowOf = (name: string) => day(name).closest('[role="row"]')!;

describe("週の指定", () => {
  test("入力欄に表示中の週の期間を出し、値は月曜日", () => {
    const { trigger, hidden } = setup();

    expect(trigger.textContent).toBe("2026年11月23日〜2026年11月29日");
    expect(hidden.value).toBe("2026-11-23");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  test("開くと月曜日始まりの月のカレンダーを出し、選んでいる週の行を強調する", () => {
    const { trigger } = setup();

    fireEvent.click(trigger);

    expect(grid().getAttribute("aria-label")).toBe("2026年11月");
    const headers = within(grid()).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(labels.weekdays);
    const selectedRow = rowOf("2026年11月25日（水）");
    expect(selectedRow.getAttribute("aria-selected")).toBe("true");
    expect(selectedRow.className).toContain("bg-primary/15");
    // ほかの週の行はポインタを合わせると強調する
    expect(rowOf("2026年11月11日（水）").className).toContain(
      "hover:bg-border/40",
    );
  });

  test("日を選ぶと、その日を含む週を入れて閉じる", () => {
    const { trigger, hidden } = setup();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole("button", { name: "前の月" }));
    fireEvent.click(day("2026年10月14日（水）"));

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-10-12");
    expect(trigger.textContent).toBe("2026年10月12日〜2026年10月18日");
  });

  test("今週より先の週の日は選べず、次の月にも進めない", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);

    expect(day("2026年11月30日（月）").hasAttribute("disabled")).toBe(true);
    expect(day("2026年11月29日（日）").hasAttribute("disabled")).toBe(false);
    expect(
      screen.getByRole("button", { name: "次の月" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("キーボードで、上の矢印キーで 1 週前に移り Enter で選ぶ", () => {
    const { trigger, hidden } = setup();
    trigger.focus();
    fireEvent.click(trigger);

    expect(document.activeElement).toBe(day("2026年11月23日（月）"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(document.activeElement).toBe(day("2026年11月16日（月）"));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(day("2026年11月17日（火）"));
    fireEvent.click(document.activeElement!);

    expect(hidden.value).toBe("2026-11-16");
    expect(document.activeElement).toBe(trigger);
  });

  test("月の外へ移ると月を切り替え、今週より先へは移らない", () => {
    const { trigger } = setup(jst("2026-11-02T00:00:00"));
    fireEvent.click(trigger);

    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(grid().getAttribute("aria-label")).toBe("2026年10月");
    expect(document.activeElement).toBe(day("2026年10月26日（月）"));
  });

  test("開いたカレンダーは週のカレンダーの列の見出し（z-30）より手前に出す", () => {
    const { trigger } = setup();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog").className).toContain("z-40");
  });

  test("Escape キーで選ばずに閉じ、入力欄にフォーカスを戻す", () => {
    const { trigger, hidden } = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-11-23");
    expect(document.activeElement).toBe(trigger);
  });
});
