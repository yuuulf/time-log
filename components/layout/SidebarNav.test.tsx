import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { SidebarNav, SidebarNavLinks } from "./SidebarNav";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = "/";
});

const nav = () => screen.getByRole("navigation", { name: messages.nav.label });

test("「ホーム」はトップページ、「過去の記録」は /history、「プロジェクト」は /projects へのリンク", () => {
  render(<SidebarNav />);

  const links = within(nav());
  expect(
    links.getByRole("link", { name: messages.nav.home }).getAttribute("href"),
  ).toBe("/");
  expect(
    links
      .getByRole("link", { name: messages.history.title })
      .getAttribute("href"),
  ).toBe("/history");
  expect(
    links
      .getByRole("link", { name: messages.projects.title })
      .getAttribute("href"),
  ).toBe("/projects");
  expect(links.queryByRole("link", { name: messages.app.name })).toBeNull();
});

test("トップページでは「ホーム」だけが今いるページになる", () => {
  render(<SidebarNav />);

  expect(
    screen
      .getByRole("link", { name: messages.nav.home })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen
      .getByRole("link", { name: messages.history.title })
      .hasAttribute("aria-current"),
  ).toBe(false);
});

test("過去の記録のページでは「過去の記録」だけが今いるページになる", () => {
  navigation.pathname = "/history";
  render(<SidebarNav />);

  expect(
    screen
      .getByRole("link", { name: messages.history.title })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen
      .getByRole("link", { name: messages.nav.home })
      .hasAttribute("aria-current"),
  ).toBe(false);
});

test("プロジェクトのページでは「プロジェクト」だけが今いるページになる", () => {
  navigation.pathname = "/projects";
  render(<SidebarNav />);

  expect(
    screen
      .getByRole("link", { name: messages.projects.title })
      .getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen
      .getByRole("link", { name: messages.history.title })
      .hasAttribute("aria-current"),
  ).toBe(false);
});

test("フォールバック（pathname が null）では、同じリンクを選ばれている表示なしで出す", () => {
  render(<SidebarNavLinks pathname={null} />);

  const links = within(nav()).getAllByRole("link");
  expect(links.map((a) => a.textContent)).toEqual([
    messages.nav.home,
    messages.history.title,
    messages.projects.title,
  ]);
  expect(links.some((a) => a.getAttribute("aria-current"))).toBe(false);
});
