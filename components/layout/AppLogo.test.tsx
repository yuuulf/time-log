import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { AppLogo } from "./AppLogo";

test("ライト用とダーク用のロゴを、飾りとして CSS で出し分ける", () => {
  const { container } = render(<AppLogo />);
  const images = Array.from(container.querySelectorAll("img"));

  expect(images).toHaveLength(2);
  const [light, dark] = images;
  expect(light.getAttribute("src")).toContain("icon-light.png");
  expect(light.className).toContain("dark:hidden");
  expect(dark.getAttribute("src")).toContain("icon-dark.png");
  expect(dark.className).toContain("hidden");
  expect(dark.className).toContain("dark:block");
  for (const image of images) {
    expect(image.getAttribute("alt")).toBe("");
  }
});
