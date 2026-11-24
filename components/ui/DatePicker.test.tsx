import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DatePicker } from "./DatePicker";

const labels = {
  prevMonth: "前の月",
  nextMonth: "次の月",
  weekdays: ["月", "火", "水", "木", "金", "土", "日"],
};

function setup(defaultValue: string, invalid = false) {
  const { container } = render(
    <form>
      <DatePicker
        name="from"
        defaultValue={defaultValue}
        label="開始日"
        aria-invalid={invalid ? true : undefined}
        labels={labels}
      />
    </form>,
  );
  const trigger = screen.getByRole("combobox", { name: /^開始日/ });
  const hidden = container.querySelector(
    'input[name="from"]',
  ) as HTMLInputElement;
  return { trigger, hidden };
}

describe("期間の日付の入力欄", () => {
  test("未入力なら「開始日」を控えめに出し、値は空", () => {
    const { trigger, hidden } = setup("");

    expect(trigger.textContent).toBe("開始日");
    expect(trigger.querySelector("span")?.className).toContain("text-muted");
    expect(hidden.value).toBe("");
  });

  test("値があれば「2026年10月1日」の形で出す", () => {
    const { trigger, hidden } = setup("2026-10-01");

    expect(trigger.textContent).toBe("2026年10月1日");
    expect(trigger.getAttribute("aria-label")).toBe("開始日：2026年10月1日");
    expect(hidden.value).toBe("2026-10-01");
  });

  test("週の指定と同じ月のカレンダーを開き、選んでいる日を強調する", () => {
    const { trigger } = setup("2026-10-01");

    fireEvent.click(trigger);

    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-label")).toBe("2026年10月");
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(labels.weekdays);
    expect(screen.getByRole("button", { name: "前の月" })).toBeDefined();
    const day = screen.getByRole("button", { name: "2026年10月1日（木）" });
    expect(day.className).toContain("bg-primary");
    expect(
      day.closest('[role="gridcell"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(document.activeElement).toBe(day);
    expect(screen.getByRole("dialog").className).toContain("z-40");
  });

  test("日を選ぶと入力欄に入れて閉じ、フォーカスを入力欄に戻す", () => {
    const { trigger, hidden } = setup("2026-10-01");
    fireEvent.click(trigger);

    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    fireEvent.click(document.activeElement!);

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-10-08");
    expect(trigger.textContent).toBe("2026年10月8日");
    expect(document.activeElement).toBe(trigger);
  });

  test("Escape キーで選ばずに閉じる", () => {
    const { trigger, hidden } = setup("2026-10-01");
    fireEvent.click(trigger);

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-10-01");
  });

  test("誤りのときは誤りとして示す", () => {
    const { trigger } = setup("2026-10-15", true);

    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.className).toContain("aria-[invalid=true]:border-danger");
  });
});
