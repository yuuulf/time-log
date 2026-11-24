import { render, screen } from "@testing-library/react";
import { Trash2 } from "lucide-react";
import { expect, test } from "vitest";
import { IconButton } from "./IconButton";

test("名前で読み上げられ、ポインタを合わせたときの説明にも名前が出る", () => {
  render(<IconButton icon={Trash2} label="削除" />);

  const button = screen.getByRole("button", { name: "削除" });
  expect(button.getAttribute("title")).toBe("削除");
  expect(button.textContent).toBe("");
  expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});

test("type の既定は button で、submit を指定できる", () => {
  render(
    <>
      <IconButton icon={Trash2} label="削除" />
      <IconButton icon={Trash2} label="保存" type="submit" />
    </>,
  );

  expect(
    screen.getByRole("button", { name: "削除" }).getAttribute("type"),
  ).toBe("button");
  expect(
    screen.getByRole("button", { name: "保存" }).getAttribute("type"),
  ).toBe("submit");
});

test("ghost は枠を出さず、ポインタを合わせたときに背景を付ける", () => {
  render(<IconButton icon={Trash2} label="閉じる" variant="ghost" />);

  const button = screen.getByRole("button", { name: "閉じる" });
  expect(button.classList.contains("border")).toBe(false);
  expect(button.className).toContain("hover:bg-border/40");
});
