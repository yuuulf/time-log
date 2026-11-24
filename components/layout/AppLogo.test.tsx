import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { AppLogo } from "./AppLogo";

test("ライト用とダーク用のロゴを、縮小せずに飾りとして CSS で出し分ける", () => {
  const { container } = render(<AppLogo />);
  const images = Array.from(container.querySelectorAll("img"));

  expect(images).toHaveLength(2);
  const [light, dark] = images;
  expect(light.getAttribute("src")).toBe("/icon-light.png");
  expect(light.className).toContain("dark:hidden");
  expect(dark.getAttribute("src")).toBe("/icon-dark.png");
  expect(dark.className).toContain("hidden");
  expect(dark.className).toContain("dark:block");
  for (const image of images) {
    expect(image.getAttribute("alt")).toBe("");
  }
});
