import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { messages } from "@/lib/messages";
import { SidebarNav } from "./SidebarNav";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = "/";
});

const nav = () => screen.getByRole("navigation", { name: messages.nav.label });

test("アプリ名と「ホーム」はトップページ、「過去の記録」は /history へのリンク", () => {
  render(<SidebarNav />);

  const links = within(nav());
  expect(
    links.getByRole("link", { name: messages.app.name }).getAttribute("href"),
  ).toBe("/");
  expect(
    links.getByRole("link", { name: messages.nav.home }).getAttribute("href"),
  ).toBe("/");
  expect(
    links
      .getByRole("link", { name: messages.history.title })
      .getAttribute("href"),
  ).toBe("/history");
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
  expect(
    screen
      .getByRole("link", { name: messages.app.name })
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
