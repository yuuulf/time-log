import { expect, test } from "vitest";
import { isComposing } from "./keyboard";

test("isComposing が true、または keyCode が 229 なら変換中", () => {
  expect(isComposing({ nativeEvent: { isComposing: true }, keyCode: 13 })).toBe(
    true,
  );
  expect(isComposing({ nativeEvent: {}, keyCode: 229 })).toBe(true);
});

test("それ以外は変換中ではない", () => {
  expect(
    isComposing({ nativeEvent: { isComposing: false }, keyCode: 13 }),
  ).toBe(false);
  expect(isComposing({ nativeEvent: {} })).toBe(false);
});
