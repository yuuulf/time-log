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

test("「ホーム」はトップページ、「過去の記録」は /history、「集計」は /summary、「プロジェクト」は /projects へのリンク", () => {
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
      .getByRole("link", { name: messages.summary.title })
      .getAttribute("href"),
  ).toBe("/summary");
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
    messages.summary.title,
    messages.projects.title,
  ]);
  expect(links.some((a) => a.getAttribute("aria-current"))).toBe(false);
});

test("集計のページでは「集計」だけが今いるページになる", () => {
  navigation.pathname = "/summary";
  render(<SidebarNav />);

  const current = within(nav())
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page")
    .map((a) => a.textContent);
  expect(current).toEqual([messages.summary.title]);
});

test("プロジェクトの詳細画面では「プロジェクト」が今いるページになる", () => {
  navigation.pathname = "/projects/1";
  render(<SidebarNav />);

  const current = within(nav())
    .getAllByRole("link")
    .filter((a) => a.getAttribute("aria-current") === "page")
    .map((a) => a.textContent);
  expect(current).toEqual([messages.projects.title]);
});

test("名前が前方で一致するだけの別のページは選ばれている表示にしない", () => {
  navigation.pathname = "/projectsx";
  render(<SidebarNav />);

  expect(
    within(nav())
      .getAllByRole("link")
      .some((a) => a.getAttribute("aria-current")),
  ).toBe(false);
});
