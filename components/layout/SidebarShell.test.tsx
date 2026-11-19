import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { SidebarShell } from "./SidebarShell";

const t = messages.nav;

const renderShell = () =>
  render(
    <SidebarShell>
      <a href="#history">過去の記録</a>
    </SidebarShell>,
  );

const menuButton = () => screen.getByRole("button", { name: t.menu });

const openSidebar = () => {
  renderShell();
  fireEvent.click(menuButton());
};

const expectClosed = () => {
  expect(menuButton().getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(menuButton());
  expect(document.querySelector("[data-sidebar-backdrop]")).toBeNull();
};

test("最初は閉じていて、メニューボタンがサイドバーを指す", () => {
  renderShell();

  expect(menuButton().getAttribute("aria-expanded")).toBe("false");
  expect(menuButton().getAttribute("aria-controls")).toBe(
    document.querySelector("aside")?.id,
  );
  expect(document.querySelector("[data-sidebar-backdrop]")).toBeNull();
});

test("メニューボタンで開き、閉じるボタンにフォーカスが移る", () => {
  openSidebar();

  expect(menuButton().getAttribute("aria-expanded")).toBe("true");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: t.close }),
  );
});

test("閉じるボタンで閉じ、メニューボタンにフォーカスが戻る", () => {
  openSidebar();
  fireEvent.click(screen.getByRole("button", { name: t.close }));

  expectClosed();
});

test("サイドバーの外側（背景）を選ぶと閉じる", () => {
  openSidebar();
  fireEvent.click(document.querySelector("[data-sidebar-backdrop]")!);

  expectClosed();
});

test("Escape キーで閉じる", () => {
  openSidebar();
  fireEvent.keyDown(document, { key: "Escape" });

  expectClosed();
});

test("サイドバーの中のリンクを選ぶと閉じる", () => {
  openSidebar();
  fireEvent.click(screen.getByRole("link", { name: "過去の記録" }));

  expect(menuButton().getAttribute("aria-expanded")).toBe("false");
});

test("アプリ名はトップページへのリンク", () => {
  renderShell();

  expect(
    screen.getByRole("link", { name: messages.app.name }).getAttribute("href"),
  ).toBe("/");
});
