import { describe, expect, test } from "vitest";
import { messages } from "@/lib/messages";
import { parseProjectId, validateProjectInput } from "./validation";

const errors = messages.projects.errors;
const valid = {
  name: "社内ツール",
  color: "teal",
  clientName: "",
  description: "",
};

describe("validateProjectInput", () => {
  test("正しい入力を受け付け、前後の空白を除く", () => {
    expect(
      validateProjectInput({
        name: "  A 社サイト改修 ",
        color: "blue",
        clientName: " A 社 ",
        description: " 2026 年度 ",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "A 社サイト改修",
        color: "blue",
        clientName: "A 社",
        description: "2026 年度",
      },
    });
  });

  test("クライアント名と説明は省略できる", () => {
    expect(
      validateProjectInput({ ...valid, clientName: null, description: null }),
    ).toEqual({
      ok: true,
      value: {
        name: "社内ツール",
        color: "teal",
        clientName: "",
        description: "",
      },
    });
  });

  test.each([[""], ["   "], [null]])("名前が空（%j）ならエラー", (name) => {
    expect(validateProjectInput({ ...valid, name })).toEqual({
      ok: false,
      errors: { name: errors.nameRequired },
    });
  });

  test("名前は 100 文字まで（コードポイントで数える）", () => {
    expect(validateProjectInput({ ...valid, name: "あ".repeat(100) }).ok).toBe(
      true,
    );
    expect(validateProjectInput({ ...valid, name: "😀".repeat(100) }).ok).toBe(
      true,
    );
    expect(validateProjectInput({ ...valid, name: "あ".repeat(101) })).toEqual({
      ok: false,
      errors: { name: errors.nameTooLong },
    });
  });

  test.each([["gray"], [""], [null]])("色のキー以外（%j）はエラー", (color) => {
    expect(validateProjectInput({ ...valid, color })).toEqual({
      ok: false,
      errors: { color: errors.colorRequired },
    });
  });

  test("クライアント名は 100 文字、説明は 1000 文字まで", () => {
    expect(
      validateProjectInput({
        ...valid,
        clientName: "a".repeat(100),
        description: "a".repeat(1000),
      }).ok,
    ).toBe(true);
    expect(
      validateProjectInput({
        ...valid,
        clientName: "a".repeat(101),
        description: "a".repeat(1001),
      }),
    ).toEqual({
      ok: false,
      errors: {
        clientName: errors.clientNameTooLong,
        description: errors.descriptionTooLong,
      },
    });
  });
});

describe("parseProjectId", () => {
  test.each([[""], [" "], [null], [undefined]])(
    "空（%j）ならプロジェクトなし",
    (value) => {
      expect(parseProjectId(value)).toEqual({ ok: true, projectId: null });
    },
  );

  test("正の整数なら id", () => {
    expect(parseProjectId("12")).toEqual({ ok: true, projectId: 12 });
  });

  test.each([
    ["0"],
    ["-1"],
    ["1.5"],
    ["abc"],
    ["01"],
    ["99999999999999999999"],
  ])("不正な値（%j）", (value) => {
    expect(parseProjectId(value)).toEqual({ ok: false });
  });
});
