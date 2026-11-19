import { fireEvent, render, screen } from "@testing-library/react";
import { Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { expect, test, vi } from "vitest";
import { DropdownMenu } from "./DropdownMenu";

function setup() {
  const onDelete = vi.fn();
  const onCopy = vi.fn();
  render(
    <div>
      <DropdownMenu
        icon={MoreVertical}
        label="その他の操作"
        items={[
          { label: "複製", icon: Copy, onSelect: onCopy },
          { label: "名前の変更", icon: Pencil, onSelect: vi.fn() },
          {
            label: "削除",
            icon: Trash2,
            onSelect: onDelete,
            variant: "danger",
          },
        ]}
      />
      <button type="button">外のボタン</button>
    </div>,
  );
  const trigger = screen.getByRole("button", { name: "その他の操作" });
  return { trigger, onDelete, onCopy };
}

test("ボタンに名前と説明があり、閉じた状態で始まる", () => {
  const { trigger } = setup();
  expect(trigger.getAttribute("title")).toBe("その他の操作");
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("menu")).toBeNull();
});

test("開くと項目がアイコンと文字で並び、最初の項目にフォーカスする", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);

  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const items = screen.getAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual([
    "複製",
    "名前の変更",
    "削除",
  ]);
  expect(items.every((i) => i.querySelector("svg"))).toBe(true);
  expect(document.activeElement).toBe(items[0]);
});

test("矢印キー・Home・End で項目を移る", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);
  const items = screen.getAllByRole("menuitem");

  fireEvent.keyDown(items[0], { key: "ArrowDown" });
  expect(document.activeElement).toBe(items[1]);
  fireEvent.keyDown(items[1], { key: "End" });
  expect(document.activeElement).toBe(items[2]);
  fireEvent.keyDown(items[2], { key: "ArrowDown" });
  expect(document.activeElement).toBe(items[0]);
  fireEvent.keyDown(items[0], { key: "ArrowUp" });
  expect(document.activeElement).toBe(items[2]);
  fireEvent.keyDown(items[2], { key: "Home" });
  expect(document.activeElement).toBe(items[0]);
});

test("ボタンで下矢印キーを押しても開く", () => {
  const { trigger } = setup();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  expect(screen.getByRole("menu")).toBeDefined();
});

test("項目を選ぶと onSelect が呼ばれて閉じ、ボタンにフォーカスが戻る", () => {
  const { trigger, onDelete, onCopy } = setup();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("menuitem", { name: "削除" }));

  expect(onDelete).toHaveBeenCalledOnce();
  expect(onCopy).not.toHaveBeenCalled();
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("Escape で選ばずに閉じ、ボタンにフォーカスが戻る", () => {
  const { trigger, onDelete } = setup();
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getAllByRole("menuitem")[0], { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(onDelete).not.toHaveBeenCalled();
});

test("外側を押すと閉じる", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);
  fireEvent.pointerDown(screen.getByRole("button", { name: "外のボタン" }));

  expect(screen.queryByRole("menu")).toBeNull();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

test("フォーカスがメニューの外へ出ると閉じる", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);
  fireEvent.blur(screen.getAllByRole("menuitem")[0], {
    relatedTarget: screen.getByRole("button", { name: "外のボタン" }),
  });

  expect(screen.queryByRole("menu")).toBeNull();
});

test("危険な項目は危険の色で表示する", () => {
  const { trigger } = setup();
  fireEvent.click(trigger);
  expect(screen.getByRole("menuitem", { name: "削除" }).className).toContain(
    "text-danger",
  );
  expect(screen.getByRole("menuitem", { name: "複製" }).className).toContain(
    "text-foreground",
  );
});
