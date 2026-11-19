import { render, screen } from "@testing-library/react";
import { ChevronLeft } from "lucide-react";
import { expect, test } from "vitest";
import { IconLink } from "./IconLink";

test("名前で読み上げられ、ポインタを合わせたときの説明にも名前が出る", () => {
  render(
    <IconLink
      href="/history?month=2026-10"
      icon={ChevronLeft}
      label="前の月"
    />,
  );

  const link = screen.getByRole("link", { name: "前の月" });
  expect(link.getAttribute("href")).toBe("/history?month=2026-10");
  expect(link.getAttribute("title")).toBe("前の月");
  expect(link.textContent).toBe("");
  expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});
