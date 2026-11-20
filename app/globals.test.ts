import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

test("キーボードで移ったときのフォーカスの枠を、base レイヤーでテーマ色にする", () => {
  const base = css.match(/@layer base \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const rule = base.match(/:focus-visible \{([^}]*)\}/)?.[1] ?? "";

  expect(rule).toContain("outline: 2px solid var(--primary);");
  expect(rule).toContain("outline-offset: 2px;");
});
