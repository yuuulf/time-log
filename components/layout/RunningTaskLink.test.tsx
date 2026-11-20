import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { RunningTaskLinkView } from "./RunningTaskLink";

test("トップページでは選ばれている表示にする", () => {
  render(<RunningTaskLinkView pathname="/">中身</RunningTaskLinkView>);

  const link = screen.getByRole("link", { name: "中身" });
  expect(link.getAttribute("href")).toBe("/");
  expect(link.getAttribute("aria-current")).toBe("page");
});

test.each(["/history", "/projects/1", null])(
  "「%s」では選ばれている表示にしない",
  (pathname) => {
    render(<RunningTaskLinkView pathname={pathname}>中身</RunningTaskLinkView>);

    const link = screen.getByRole("link", { name: "中身" });
    expect(link.getAttribute("href")).toBe("/");
    expect(link.hasAttribute("aria-current")).toBe(false);
  },
);
