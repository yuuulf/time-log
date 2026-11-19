import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { ProjectPicker } from "./ProjectPicker";

const t = messages.timeEntries;
const projects = [
  { id: 1, name: "社内ツール", color: "teal" },
  { id: 2, name: "A 社サイト改修", color: "blue" },
];

function setup(value: (typeof projects)[number] | null = projects[0]) {
  const onChange = vi.fn();
  render(
    <div>
      <ProjectPicker value={value} projects={projects} onChange={onChange} />
      <button type="button">外のボタン</button>
    </div>,
  );
  const trigger = screen.getByRole("button", {
    name: t.projectButton(value?.name ?? t.noProject),
  });
  return { trigger, onChange };
}

test("ボタンに今のプロジェクトの色のアイコンと名前を出す", () => {
  const { trigger } = setup();
  expect(trigger.textContent).toBe("社内ツール");
  expect(trigger.getAttribute("aria-label")).toBe("プロジェクト：社内ツール");
  expect(trigger.getAttribute("title")).toBe("社内ツール");
  expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
  expect(trigger.querySelector(".text-project-teal")).not.toBeNull();
});

test("プロジェクトがなければ「プロジェクトなし」と出し、アイコンは出さない", () => {
  const { trigger } = setup(null);
  expect(trigger.textContent).toBe(t.noProject);
  expect(trigger.querySelector('[class*="text-project-"]')).toBeNull();
});

test("開くと選択肢が登録順に色のアイコン付きで並び、今の項目が選ばれてフォーカスされる", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);

  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const options = screen.getAllByRole("option");
  expect(options.map((o) => o.textContent)).toEqual([
    t.noProject,
    "社内ツール",
    "A 社サイト改修",
  ]);
  expect(options[0].querySelector('[class*="text-project-"]')).toBeNull();
  expect(options[1].querySelector(".text-project-teal")).not.toBeNull();
  expect(options[2].querySelector(".text-project-blue")).not.toBeNull();
  expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual([
    "false",
    "true",
    "false",
  ]);
  expect(document.activeElement).toBe(options[1]);
});

test("矢印キーで移り、Enter で選ぶと onChange が呼ばれて閉じる", () => {
  const { trigger, onChange } = setup();
  fireEvent.click(trigger);
  const options = screen.getAllByRole("option");

  fireEvent.keyDown(options[1], { key: "ArrowDown" });
  expect(document.activeElement).toBe(options[2]);
  fireEvent.keyDown(options[2], { key: "Enter" });

  expect(onChange).toHaveBeenCalledWith(2);
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("「プロジェクトなし」を選ぶと null を渡す", () => {
  const { trigger, onChange } = setup();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("option", { name: t.noProject }));
  expect(onChange).toHaveBeenCalledWith(null);
});

test("今と同じ項目を選んでも onChange は呼ばない", () => {
  const { trigger, onChange } = setup();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("option", { name: "社内ツール" }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("ボタンで下矢印キーを押しても開く", () => {
  const { trigger } = setup();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByRole("listbox")).toBeDefined();
});

test("Escape と外側を押したときは選ばずに閉じる", () => {
  const { trigger, onChange } = setup();
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getAllByRole("option")[0], { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(trigger);

  fireEvent.click(trigger);
  fireEvent.pointerDown(screen.getByRole("button", { name: "外のボタン" }));
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

test("一覧用はふだん枠線を出さず、フォーム用は常に枠線を出す", () => {
  const { rerender } = render(
    <ProjectPicker value={null} projects={projects} onChange={vi.fn()} />,
  );
  const button = () =>
    screen.getByRole("button", { name: t.projectButton(t.noProject) });
  expect(button().className).toContain("border-transparent");

  rerender(
    <ProjectPicker
      value={null}
      projects={projects}
      onChange={vi.fn()}
      variant="field"
    />,
  );
  expect(button().className).toContain("border-border");
  expect(button().className).not.toContain("border-transparent");
});

test("今の値が選択肢にない（アーカイブした）ときは、ボタンに今の値を出し、どの選択肢も選ばれている表示にしない", () => {
  const archived = { id: 9, name: "旧案件", color: "brown" };
  const onChange = vi.fn();
  render(
    <ProjectPicker value={archived} projects={projects} onChange={onChange} />,
  );

  const trigger = screen.getByRole("button", {
    name: t.projectButton("旧案件"),
  });
  expect(trigger.textContent).toBe("旧案件");
  expect(trigger.querySelector(".text-project-brown")).not.toBeNull();

  fireEvent.click(trigger);
  const options = screen.getAllByRole("option");
  expect(options.map((o) => o.textContent)).toEqual([
    t.noProject,
    "社内ツール",
    "A 社サイト改修",
  ]);
  expect(options.some((o) => o.getAttribute("aria-selected") === "true")).toBe(
    false,
  );
  expect(document.activeElement).toBe(options[0]);

  // 「プロジェクトなし」を選ぶと外せる
  fireEvent.click(options[0]);
  expect(onChange).toHaveBeenCalledWith(null);
});
