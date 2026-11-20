import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { projectColorName } from "@/lib/projects/colors";
import { BackLink, ProjectFields } from "./ProjectFields";

const t = messages.projects;
const values = {
  name: "社内ツール",
  color: "violet",
  clientName: "自社",
  description: "説明",
};
const input = (label: string) =>
  screen.getByLabelText<HTMLInputElement | HTMLTextAreaElement>(label);

test("名前・色・クライアント名・説明の欄に値を入れて並べる", () => {
  render(
    <ProjectFields
      idPrefix="p"
      values={values}
      errors={{}}
      onChange={vi.fn()}
      onColorChange={vi.fn()}
    />,
  );

  expect(input(t.name).value).toBe("社内ツール");
  expect(input(t.clientName).value).toBe("自社");
  expect(input(t.description).value).toBe("説明");
  expect(input(t.description).getAttribute("rows")).toBe("8");
  expect(
    screen.getByRole<HTMLInputElement>("radio", {
      name: projectColorName("violet"),
    }).checked,
  ).toBe(true);
  // name を付けないとき（詳細画面）は、フォームで送らない
  expect(input(t.name).getAttribute("name")).toBeNull();
});

test("named なら欄に name を付ける（登録画面のフォームで送る）", () => {
  render(
    <ProjectFields
      idPrefix="p"
      values={values}
      errors={{}}
      onChange={vi.fn()}
      onColorChange={vi.fn()}
      named
    />,
  );

  expect(input(t.name).getAttribute("name")).toBe("name");
  expect(input(t.clientName).getAttribute("name")).toBe("clientName");
  expect(input(t.description).getAttribute("name")).toBe("description");
  expect(screen.getAllByRole("radio")[0].getAttribute("name")).toBe("color");
});

test("入力・色の選択を知らせ、欄ごとのエラーを表示する", () => {
  const onChange = vi.fn();
  const onColorChange = vi.fn();
  render(
    <ProjectFields
      idPrefix="p"
      values={values}
      errors={{ name: t.errors.nameTaken }}
      onChange={onChange}
      onColorChange={onColorChange}
    />,
  );

  fireEvent.change(input(t.clientName), { target: { value: "情報部" } });
  fireEvent.click(
    screen.getByRole("radio", { name: projectColorName("teal") }),
  );

  expect(onChange).toHaveBeenCalledWith("clientName", "情報部");
  expect(onColorChange).toHaveBeenCalledWith("teal");
  expect(input(t.name).getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByRole("alert").textContent).toBe(t.errors.nameTaken);
});

test("入力欄は、フォーカスしたとき枠をテーマ色にし、エラーの欄はエラーの印を残す", () => {
  render(
    <ProjectFields
      idPrefix="p"
      values={values}
      errors={{ name: t.errors.nameTaken }}
      onChange={vi.fn()}
      onColorChange={vi.fn()}
    />,
  );

  for (const label of [t.name, t.clientName, t.description]) {
    expect(input(label).className).toContain("focus:border-primary");
  }
  expect(input(t.name).getAttribute("aria-invalid")).toBe("true");
  expect(input(t.name).className).toContain(
    "aria-[invalid=true]:border-danger",
  );
});

test("一覧へ戻るリンク", () => {
  render(<BackLink />);

  expect(
    screen
      .getByRole("link", { name: t.detail.backToList })
      .getAttribute("href"),
  ).toBe("/projects");
});
