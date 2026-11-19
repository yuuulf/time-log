// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { messages } from "@/lib/messages";
import {
  deleteEntryAction,
  startEntryAction,
  stopEntryAction,
  updateEntryAction,
} from "./actions";
import { createProject } from "@/lib/projects/repository";
import { getEntry, getRunningEntry, listRecentEntries } from "./repository";

const mocks = vi.hoisted(() => ({ db: undefined as Db | undefined }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => mocks.db }));

const { refresh } = await import("next/cache");
const errors = messages.timeEntries.errors;
const now = new Date("2026-11-18T12:00:00+09:00");

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
  mocks.db = db;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.mocked(refresh).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("開始", () => {
  test("記録を始めて refresh する", async () => {
    const state = await startEntryAction({}, form({ taskName: " 資料作成 " }));

    expect(state).toEqual({ ok: true });
    expect(getRunningEntry(db)).toMatchObject({
      taskName: "資料作成",
      startedAt: now,
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("入力エラーなら保存せずエラーを返す", async () => {
    const state = await startEntryAction(
      {},
      form({ taskName: "あ".repeat(201) }),
    );

    expect(state).toEqual({ errors: { taskName: errors.taskNameTooLong } });
    expect(listRecentEntries(db, now)).toEqual([]);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("終了", () => {
  test("記録中の記録を終了して refresh する", async () => {
    await startEntryAction({}, form({ taskName: "資料作成" }));
    vi.setSystemTime(new Date("2026-11-18T12:30:00+09:00"));

    await stopEntryAction();

    expect(getRunningEntry(db)).toBeUndefined();
    expect(listRecentEntries(db, now)[0].endedAt).toEqual(
      new Date("2026-11-18T12:30:00+09:00"),
    );
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

describe("修正", () => {
  async function createFinishedEntry() {
    vi.setSystemTime(new Date("2026-11-18T09:00:00+09:00"));
    await startEntryAction({}, form({ taskName: "資料作成" }));
    vi.setSystemTime(new Date("2026-11-18T10:00:00+09:00"));
    await stopEntryAction();
    vi.setSystemTime(now);
    vi.mocked(refresh).mockClear();
    return listRecentEntries(db, now)[0];
  }

  test("保存して refresh する", async () => {
    const entry = await createFinishedEntry();

    const state = await updateEntryAction(
      entry.id,
      {},
      form({
        taskName: "資料レビュー",
        startedAt: "2026-11-18T09:00:00",
        endedAt: "2026-11-18T10:30:00",
      }),
    );

    expect(state).toEqual({ ok: true });
    expect(getEntry(db, entry.id)).toMatchObject({
      taskName: "資料レビュー",
      endedAt: new Date("2026-11-18T10:30:00+09:00"),
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("入力エラーなら保存せずエラーを返す", async () => {
    const entry = await createFinishedEntry();

    const state = await updateEntryAction(
      entry.id,
      {},
      form({
        taskName: "資料作成",
        startedAt: "2026-11-18T09:00:00",
        endedAt: "2026-11-18T08:30:00",
      }),
    );

    expect(state).toEqual({ errors: { endedAt: errors.endBeforeStart } });
    expect(getEntry(db, entry.id)?.endedAt).toEqual(
      new Date("2026-11-18T10:00:00+09:00"),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  test("存在しない記録・不正な id はエラーを返す", async () => {
    const values = form({ taskName: "x", startedAt: "2026-11-18T09:00:00" });
    const expected = { errors: { form: errors.notFound } };

    expect(await updateEntryAction(999, {}, values)).toEqual(expected);
    expect(await updateEntryAction(1.5, {}, values)).toEqual(expected);
  });
});

describe("削除", () => {
  test("削除して refresh する", async () => {
    await startEntryAction({}, form({ taskName: "資料作成" }));
    const entry = listRecentEntries(db, now)[0];
    vi.mocked(refresh).mockClear();

    expect(await deleteEntryAction(entry.id)).toEqual({ ok: true });
    expect(getEntry(db, entry.id)).toBeUndefined();
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("存在しない記録はエラーを返す", async () => {
    expect(await deleteEntryAction(999)).toEqual({
      errors: { form: errors.notFound },
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("プロジェクト", () => {
  const notFoundState = {
    errors: { projectId: messages.projects.errors.notFound },
  };
  const addProject = (name: string) =>
    createProject(
      db,
      { name, color: "teal", clientName: "", description: "" },
      now,
    );

  test("プロジェクトを選んで開始する", async () => {
    const project = addProject("社内ツール");

    const state = await startEntryAction(
      {},
      form({ taskName: "資料作成", projectId: String(project.id) }),
    );

    expect(state).toEqual({ ok: true });
    expect(getRunningEntry(db)?.project?.name).toBe("社内ツール");
  });

  test("「プロジェクトなし」（空）で開始する", async () => {
    await startEntryAction({}, form({ taskName: "資料作成", projectId: "" }));

    expect(getRunningEntry(db)?.project).toBeNull();
  });

  test.each([["999"], ["abc"], ["-1"]])(
    "存在しない・不正なプロジェクト（%j）では開始しない",
    async (projectId) => {
      const state = await startEntryAction(
        {},
        form({ taskName: "資料作成", projectId }),
      );

      expect(state).toEqual(notFoundState);
      expect(getRunningEntry(db)).toBeUndefined();
      expect(refresh).not.toHaveBeenCalled();
    },
  );

  test("修正でプロジェクトを変える・外す", async () => {
    const a = addProject("社内ツール");
    const b = addProject("A 社サイト改修");
    await startEntryAction(
      {},
      form({ taskName: "資料作成", projectId: String(a.id) }),
    );
    const entry = getRunningEntry(db)!;
    const fields = { taskName: "資料作成", startedAt: "2026-11-18T12:00" };

    expect(
      await updateEntryAction(
        entry.id,
        {},
        form({ ...fields, projectId: String(b.id) }),
      ),
    ).toEqual({ ok: true });
    expect(getRunningEntry(db)?.project?.name).toBe("A 社サイト改修");

    await updateEntryAction(entry.id, {}, form({ ...fields, projectId: "" }));
    expect(getRunningEntry(db)?.project).toBeNull();
  });

  test("修正で存在しないプロジェクトを選ぶと保存しない", async () => {
    const project = addProject("社内ツール");
    await startEntryAction(
      {},
      form({ taskName: "資料作成", projectId: String(project.id) }),
    );
    const entry = getRunningEntry(db)!;
    vi.mocked(refresh).mockClear();

    const state = await updateEntryAction(
      entry.id,
      {},
      form({
        taskName: "資料レビュー",
        startedAt: "2026-11-18T12:00",
        projectId: "999",
      }),
    );

    expect(state).toEqual(notFoundState);
    expect(getRunningEntry(db)).toMatchObject({
      taskName: "資料作成",
      project: { name: "社内ツール" },
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
