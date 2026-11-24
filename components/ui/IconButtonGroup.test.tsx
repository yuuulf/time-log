import { fireEvent, render, screen } from "@testing-library/react";
import { List, CalendarDays } from "lucide-react";
import { expect, test, vi } from "vitest";
import { IconButtonGroup } from "./IconButtonGroup";

const options = [
  { value: "list", icon: List, label: "一覧" },
  { value: "timeline", icon: CalendarDays, label: "カレンダー" },
] as const;

test("名前の付いたまとまりに、アイコンのボタンを並べ、選んでいるボタンを押された状態にする", () => {
  render(
    <IconButtonGroup
      label="表示"
      options={[...options]}
      value="timeline"
      onChange={() => {}}
    />,
  );

  const group = screen.getByRole("group", { name: "表示" });
  const buttons = screen.getAllByRole("button");
  expect(buttons.every((b) => group.contains(b))).toBe(true);
  expect(buttons.map((b) => [b.getAttribute("aria-label"), b.title])).toEqual([
    ["一覧", "一覧"],
    ["カレンダー", "カレンダー"],
  ]);
  expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual([
    "false",
    "true",
  ]);
  expect(buttons.map((b) => b.textContent)).toEqual(["", ""]);
});

test("つながった見た目にする（角は両端だけ丸め、枠線を重ねる）", () => {
  render(
    <IconButtonGroup
      label="表示"
      options={[...options]}
      value="list"
      onChange={() => {}}
    />,
  );

  const [first, last] = screen.getAllByRole("button");
  expect(first.className).toContain("rounded-l-md");
  expect(first.className).not.toContain("rounded-r-md");
  expect(last.className).toContain("rounded-r-md");
  expect(last.className).toContain("-ml-px");
});

test("ボタンを選ぶと、その値で onChange を呼ぶ", () => {
  const onChange = vi.fn();
  render(
    <IconButtonGroup
      label="表示"
      options={[...options]}
      value="list"
      onChange={onChange}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "カレンダー" }));

  expect(onChange).toHaveBeenCalledWith("timeline");
});
