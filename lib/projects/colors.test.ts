import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_COLORS,
  isProjectColor,
  projectColorClass,
  projectColorName,
} from "./colors";

test("10 色あり、最初に選ばれる色は先頭の色", () => {
  expect(PROJECT_COLORS).toHaveLength(10);
  expect(new Set(PROJECT_COLORS).size).toBe(10);
  expect(DEFAULT_PROJECT_COLOR).toBe(PROJECT_COLORS[0]);
});

test("どの色にも名前とクラスがあり、トークンがライト・ダークの両方に定義されている", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const names = PROJECT_COLORS.map(projectColorName);
  expect(new Set(names).size).toBe(10);
  for (const color of PROJECT_COLORS) {
    expect(projectColorName(color)).not.toBe("");
    expect(projectColorClass(color)).toBe(`bg-project-${color}`);
    // :root（ライト）とダークモードの 2 か所
    expect(css.match(new RegExp(`--project-${color}:`, "g"))).toHaveLength(2);
    expect(css).toContain(`--color-project-${color}: var(--project-${color});`);
  }
});

test("色のキーかどうかを判定する", () => {
  expect(isProjectColor("teal")).toBe(true);
  expect(isProjectColor("gray")).toBe(false);
  expect(isProjectColor("")).toBe(false);
  expect(isProjectColor(1)).toBe(false);
  expect(isProjectColor(null)).toBe(false);
});

test("未知の色は控えめな色で代用する", () => {
  expect(projectColorClass("gray")).toBe("bg-muted");
});
