// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import { messages } from "@/lib/messages";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "./actions";
import { createProject, getProject, listProjects } from "./repository";

const mocks = vi.hoisted(() => ({ db: undefined as Db | undefined }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: () => mocks.db }));

const { refresh } = await import("next/cache");
const errors = messages.projects.errors;
const now = new Date("2026-11-19T09:00:00+09:00");

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const fields = {
  name: "社内ツール",
  color: "teal",
  clientName: "",
  description: "",
};

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
  mocks.db = db;
  vi.mocked(refresh).mockClear();
});

const addProject = (name: string) =>
  createProject(db, { ...fields, color: "teal", name }, now);

describe("createProjectAction", () => {
  test("登録して画面を更新する", async () => {
    const result = await createProjectAction(
      {},
      form({ ...fields, clientName: "A 社" }),
    );

    expect(result).toEqual({ ok: true });
    expect(listProjects(db, { archived: false })).toMatchObject([
      { name: "社内ツール", color: "teal", clientName: "A 社" },
    ]);
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("入力エラーなら登録しない", async () => {
    const result = await createProjectAction({}, form({ ...fields, name: "" }));

    expect(result).toEqual({ errors: { name: errors.nameRequired } });
    expect(listProjects(db, { archived: false })).toEqual([]);
    expect(refresh).not.toHaveBeenCalled();
  });

  test("同じ名前のプロジェクトがあれば登録しない", async () => {
    addProject("社内ツール");

    const result = await createProjectAction(
      {},
      form({ ...fields, name: " 社内ツール " }),
    );

    expect(result).toEqual({ errors: { name: errors.nameTaken } });
    expect(listProjects(db, { archived: false })).toHaveLength(1);
  });
});

describe("updateProjectAction", () => {
  test("編集して画面を更新する", async () => {
    const project = addProject("社内ツール");

    const result = await updateProjectAction(
      project.id,
      {},
      form({ ...fields, name: "社内ツール開発", color: "blue" }),
    );

    expect(result).toEqual({ ok: true });
    expect(getProject(db, project.id)).toMatchObject({
      name: "社内ツール開発",
      color: "blue",
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("名前を変えずに保存できる", async () => {
    const project = addProject("社内ツール");

    const result = await updateProjectAction(
      project.id,
      {},
      form({ ...fields, description: "説明" }),
    );

    expect(result).toEqual({ ok: true });
    expect(getProject(db, project.id)?.description).toBe("説明");
  });

  test("ほかのプロジェクトと同じ名前にはできない", async () => {
    addProject("社内ツール");
    const other = addProject("A 社サイト改修");

    const result = await updateProjectAction(
      other.id,
      {},
      form({ ...fields, name: "社内ツール" }),
    );

    expect(result).toEqual({ errors: { name: errors.nameTaken } });
    expect(getProject(db, other.id)?.name).toBe("A 社サイト改修");
    expect(refresh).not.toHaveBeenCalled();
  });

  test("入力エラーなら保存しない", async () => {
    const project = addProject("社内ツール");

    const result = await updateProjectAction(
      project.id,
      {},
      form({ ...fields, color: "gray" }),
    );

    expect(result).toEqual({ errors: { color: errors.colorRequired } });
    expect(getProject(db, project.id)?.color).toBe("teal");
  });

  test.each([[999], [0], [1.5]])("見つからない id（%j）", async (id) => {
    const result = await updateProjectAction(id, {}, form(fields));

    expect(result).toEqual({ errors: { form: errors.notFound } });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("deleteProjectAction", () => {
  test("記録が紐づいていなければ削除して画面を更新する", async () => {
    const project = addProject("社内ツール");

    expect(await deleteProjectAction(project.id)).toEqual({ ok: true });
    expect(getProject(db, project.id)).toBeUndefined();
    expect(refresh).toHaveBeenCalledOnce();
  });

  test("記録が紐づいていれば削除せず理由を返す", async () => {
    const project = addProject("社内ツール");
    db.insert(timeEntries)
      .values({
        taskName: "資料作成",
        projectId: project.id,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    expect(await deleteProjectAction(project.id)).toEqual({
      errors: { form: errors.inUse },
    });
    expect(getProject(db, project.id)).toBeDefined();
    expect(refresh).not.toHaveBeenCalled();
  });

  test.each([[999], [-1]])("見つからない id（%j）", async (id) => {
    expect(await deleteProjectAction(id)).toEqual({
      errors: { form: errors.notFound },
    });
  });
});
