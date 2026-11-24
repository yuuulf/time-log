// @vitest-environment node
import { describe, expect, test } from "vitest";
import { messages } from "@/lib/messages";
import {
  validateCreateInput,
  validateStartInput,
  validateUpdateInput,
} from "./validation";

const errors = messages.timeEntries.errors;
const now = new Date("2026-11-18T12:00:00+09:00");

describe("開始の入力チェック", () => {
  test("前後の空白を取り除く", () => {
    expect(validateStartInput({ taskName: "  資料作成 " })).toEqual({
      ok: true,
      value: { taskName: "資料作成" },
    });
  });

  test("未入力なら空のタスク名で開始できる", () => {
    expect(validateStartInput({ taskName: null })).toEqual({
      ok: true,
      value: { taskName: "" },
    });
  });

  test("200 文字までは受け付ける", () => {
    expect(validateStartInput({ taskName: "あ".repeat(200) }).ok).toBe(true);
  });

  test("201 文字は受け付けない", () => {
    expect(validateStartInput({ taskName: "あ".repeat(201) })).toEqual({
      ok: false,
      errors: { taskName: errors.taskNameTooLong },
    });
  });

  test("絵文字は 1 文字と数える", () => {
    expect(validateStartInput({ taskName: "😀".repeat(200) }).ok).toBe(true);
  });
});

describe("修正の入力チェック（終了した記録）", () => {
  const options = { isRunning: false, now };
  const valid = {
    taskName: " 資料作成 ",
    startedAt: "2026-11-18T09:00:00",
    endedAt: "2026-11-18T10:30:00",
  };

  test("正しい入力", () => {
    expect(validateUpdateInput(valid, options)).toEqual({
      ok: true,
      value: {
        taskName: "資料作成",
        startedAt: new Date("2026-11-18T09:00:00+09:00"),
        endedAt: new Date("2026-11-18T10:30:00+09:00"),
      },
    });
  });

  test("終了時刻が開始時刻より前", () => {
    const result = validateUpdateInput(
      { ...valid, endedAt: "2026-11-18T08:30:00" },
      options,
    );
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.endBeforeStart },
    });
  });

  test("終了時刻が開始時刻と同じ", () => {
    const result = validateUpdateInput(
      { ...valid, endedAt: valid.startedAt },
      options,
    );
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.endBeforeStart },
    });
  });

  test("未来の開始時刻", () => {
    const result = validateUpdateInput(
      {
        ...valid,
        startedAt: "2026-11-18T12:00:01",
        endedAt: "2026-11-18T12:00:00",
      },
      options,
    );
    expect(result).toEqual({
      ok: false,
      errors: { startedAt: errors.timeInFuture },
    });
  });

  test("未来の終了時刻", () => {
    const result = validateUpdateInput(
      { ...valid, endedAt: "2026-11-18T13:00:00" },
      options,
    );
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.timeInFuture },
    });
  });

  test("終了時刻が未入力・形式が不正", () => {
    expect(validateUpdateInput({ ...valid, endedAt: "" }, options)).toEqual({
      ok: false,
      errors: { endedAt: errors.timeRequired },
    });
    expect(
      validateUpdateInput({ ...valid, startedAt: "2026-02-30T09:00" }, options),
    ).toEqual({ ok: false, errors: { startedAt: errors.timeInvalid } });
  });

  test("複数の誤りをまとめて返す", () => {
    const result = validateUpdateInput(
      { taskName: "あ".repeat(201), startedAt: "", endedAt: "x" },
      options,
    );
    expect(result).toEqual({
      ok: false,
      errors: {
        taskName: errors.taskNameTooLong,
        startedAt: errors.timeRequired,
        endedAt: errors.timeInvalid,
      },
    });
  });
});

describe("修正の入力チェック（記録中の記録）", () => {
  const options = { isRunning: true, now };

  test("タスク名と開始時刻だけを受け付ける", () => {
    expect(
      validateUpdateInput(
        {
          taskName: "資料作成",
          startedAt: "2026-11-18T09:00:00",
          endedAt: null,
        },
        options,
      ),
    ).toEqual({
      ok: true,
      value: {
        taskName: "資料作成",
        startedAt: new Date("2026-11-18T09:00:00+09:00"),
        endedAt: undefined,
      },
    });
  });

  test("終了時刻を指定するとエラー", () => {
    expect(
      validateUpdateInput(
        {
          taskName: "資料作成",
          startedAt: "2026-11-18T09:00:00",
          endedAt: "2026-11-18T10:00:00",
        },
        options,
      ),
    ).toEqual({ ok: false, errors: { endedAt: errors.endWhileRunning } });
  });
});

describe("追加の入力チェック", () => {
  const valid = {
    taskName: " 打ち合わせ ",
    startedAt: "2026-11-18T10:30:00",
    endedAt: "2026-11-18T11:00:00",
  };

  test("正しい入力", () => {
    expect(validateCreateInput(valid, now)).toEqual({
      ok: true,
      value: {
        taskName: "打ち合わせ",
        startedAt: new Date("2026-11-18T10:30:00+09:00"),
        endedAt: new Date("2026-11-18T11:00:00+09:00"),
      },
    });
  });

  test("タスク名が長すぎる", () => {
    const result = validateCreateInput(
      { ...valid, taskName: "あ".repeat(201) },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: { taskName: errors.taskNameTooLong },
    });
  });

  test("終了時刻が開始時刻より前", () => {
    const result = validateCreateInput(
      { ...valid, endedAt: "2026-11-18T10:00:00" },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.endBeforeStart },
    });
  });

  test("未来の時刻", () => {
    const result = validateCreateInput(
      { ...valid, endedAt: "2026-11-18T12:30:00" },
      now,
    );
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.timeInFuture },
    });
  });

  test("終了時刻が空", () => {
    const result = validateCreateInput({ ...valid, endedAt: "" }, now);
    expect(result).toEqual({
      ok: false,
      errors: { endedAt: errors.timeRequired },
    });
  });
});
