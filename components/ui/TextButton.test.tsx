import { render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { expect, test } from "vitest";
import { TextButton, TextLink } from "./TextButton";

test("ボタンは文字で名前が付き、アイコンは読み上げの対象から外す。type の既定は button", () => {
  render(<TextButton icon={Plus}>追加</TextButton>);

  const button = screen.getByRole("button", { name: "追加" });
  expect(button.getAttribute("type")).toBe("button");
  expect(button.getAttribute("aria-label")).toBeNull();
  expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});

test("送信ボタンにでき、アイコンは省略できる。variant の色が付く", () => {
  render(
    <TextButton type="submit" variant="primary">
      プロジェクトを作成
    </TextButton>,
  );

  const button = screen.getByRole("button", { name: "プロジェクトを作成" });
  expect(button.getAttribute("type")).toBe("submit");
  expect(button.querySelector("svg")).toBeNull();
  expect(button.className).toContain("bg-primary");
});

test("リンクは同じ見た目で、リンク先に移動する", () => {
  render(
    <TextLink href="/projects/new" icon={Plus}>
      追加
    </TextLink>,
  );

  const link = screen.getByRole("link", { name: "追加" });
  expect(link.getAttribute("href")).toBe("/projects/new");
  expect(link.className).toContain("border-border");
  expect(link.querySelector("svg")).not.toBeNull();
});
