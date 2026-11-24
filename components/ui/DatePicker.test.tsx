import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { DatePicker } from "./DatePicker";

const CALENDAR = "開始日のカレンダー";
const labels = {
  prevMonth: "前の月",
  nextMonth: "次の月",
  weekdays: ["月", "火", "水", "木", "金", "土", "日"],
  calendar: CALENDAR,
};

function setup(defaultValue: string, invalid = false) {
  const onSubmit = vi.fn((event: Event) => {
    event.preventDefault();
    return new FormData(event.target as HTMLFormElement).get("from");
  });
  const { container } = render(
    <form onSubmit={(e) => onSubmit(e.nativeEvent)}>
      <DatePicker
        name="from"
        defaultValue={defaultValue}
        label="開始日"
        aria-invalid={invalid ? true : undefined}
        labels={labels}
      />
    </form>,
  );
  const input = screen.getByRole("textbox", {
    name: "開始日",
  }) as HTMLInputElement;
  const button = screen.getByRole("button", { name: "開始日のカレンダー" });
  const hidden = container.querySelector(
    'input[name="from"]',
  ) as HTMLInputElement;
  return { input, button, hidden, onSubmit };
}

describe("期間の日付の入力欄", () => {
  test("未入力なら入力欄に「開始日」を控えめに出し、値は空", () => {
    const { input, hidden } = setup("");

    expect(input.value).toBe("");
    expect(input.placeholder).toBe("開始日");
    expect(input.className).toContain("placeholder:text-muted");
    expect(hidden.value).toBe("");
  });

  test("値があれば「2026年10月1日」の形で出す", () => {
    const { input, hidden } = setup("2026-10-01");

    expect(input.value).toBe("2026年10月1日");
    expect(hidden.value).toBe("2026-10-01");
  });

  test("カレンダーのボタンで週の指定と同じ月のカレンダーを開き、選んでいる日を強調する", () => {
    const { button } = setup("2026-10-01");

    fireEvent.click(button);

    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-label")).toBe("2026年10月");
    expect(
      within(grid)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(labels.weekdays);
    const day = screen.getByRole("button", { name: "2026年10月1日（木）" });
    expect(day.className).toContain("bg-primary");
    expect(
      day.closest('[role="gridcell"]')?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(document.activeElement).toBe(day);
    expect(screen.getByRole("dialog").className).toContain("z-40");
  });

  test("カレンダーで日を選ぶと入力欄に入れて閉じる", () => {
    const { input, button, hidden } = setup("2026-10-01");
    fireEvent.click(button);

    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    fireEvent.click(document.activeElement!);

    expect(screen.queryByRole("grid")).toBeNull();
    expect(hidden.value).toBe("2026-10-08");
    expect(input.value).toBe("2026年10月8日");
  });

  test("誤りのときは誤りとして示す", () => {
    const { input } = setup("2026-10-15", true);

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toContain("aria-[invalid=true]:border-danger");
  });
});

describe("日付の直接入力", () => {
  test("フォーカスすると「2026/10/01」の形になり、フォーカスを外すと戻る", () => {
    const { input } = setup("2026-10-01");

    fireEvent.focus(input);
    expect(input.value).toBe("2026/10/01");
    fireEvent.blur(input);
    expect(input.value).toBe("2026年10月1日");
  });

  test.each([
    ["2026/10/15"],
    ["2026-10-15"],
    ["2026.10.15"],
    ["２０２６／１０／１５"],
  ])("%j と入力してフォーカスを外すと受け取る", (text) => {
    const { input, hidden } = setup("");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: text } });
    fireEvent.blur(input);

    expect(hidden.value).toBe("2026-10-15");
    expect(input.value).toBe("2026年10月15日");
  });

  test("読めない日付は受け取らず、前の値に戻す", () => {
    const { input, hidden } = setup("2026-10-01");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);

    expect(hidden.value).toBe("2026-10-01");
    expect(input.value).toBe("2026年10月1日");
  });

  test("空にすると未入力にする", () => {
    const { input, hidden } = setup("2026-10-01");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(hidden.value).toBe("");
  });

  test("Enter キーで入力を受け取ってからフォームを送る", () => {
    const { input, onSubmit } = setup("");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2026/10/1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.submit(input.form!);

    expect(onSubmit).toHaveReturnedWith("2026-10-01");
  });

  test("Escape キーで入力を取り消す", () => {
    const { input, hidden } = setup("2026-10-01");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "2026/12/24" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(input.value).toBe("2026/10/01");
    fireEvent.blur(input);
    expect(hidden.value).toBe("2026-10-01");
  });
});
