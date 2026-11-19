// @vitest-environment node
import { beforeEach, describe, expect, test } from "vitest";
import { createDb, type Db } from "@/lib/db/client";
import { timeEntries } from "@/lib/db/schema";
import {
  createProject,
  deleteProject,
  findProjectByName,
  getProject,
  listProjects,
  setProjectArchived,
  updateProject,
} from "./repository";

const at = (time: string) => new Date(`2026-11-19T${time}+09:00`);
const input = {
  name: "社内ツール",
  color: "teal" as const,
  clientName: "",
  description: "",
};

let db: Db;

beforeEach(() => {
  db = createDb(":memory:");
});

describe("プロジェクトの登録と一覧", () => {
  test("登録したプロジェクトを登録した順に返す", () => {
    createProject(db, { ...input, name: "社内ツール" }, at("09:00:00"));
    createProject(
      db,
      { ...input, name: "A 社サイト改修", clientName: "A 社" },
      at("10:00:00"),
    );

    expect(listProjects(db, { archived: false }).map((p) => p.name)).toEqual([
      "社内ツール",
      "A 社サイト改修",
    ]);
  });

  test("登録すると、入力した値と登録時刻を持つ", () => {
    const project = createProject(
      db,
      { ...input, clientName: "A 社", description: "説明" },
      at("09:00:00"),
    );

    expect(getProject(db, project.id)).toMatchObject({
      name: "社内ツール",
      color: "teal",
      clientName: "A 社",
      description: "説明",
      createdAt: at("09:00:00"),
      updatedAt: at("09:00:00"),
    });
  });

  test("名前で探せる。なければ undefined", () => {
    const project = createProject(db, input, at("09:00:00"));

    expect(findProjectByName(db, "社内ツール")?.id).toBe(project.id);
    expect(findProjectByName(db, "別の名前")).toBeUndefined();
  });

  test("存在しない id は undefined", () => {
    expect(getProject(db, 999)).toBeUndefined();
  });
});

describe("プロジェクトの編集", () => {
  test("値と更新時刻が変わる", () => {
    const project = createProject(db, input, at("09:00:00"));

    const updated = updateProject(
      db,
      project.id,
      { ...input, name: "社内ツール開発", color: "blue" },
      at("10:00:00"),
    );

    expect(updated).toMatchObject({
      name: "社内ツール開発",
      color: "blue",
      createdAt: at("09:00:00"),
      updatedAt: at("10:00:00"),
    });
  });

  test("存在しない id は undefined", () => {
    expect(updateProject(db, 999, input, at("10:00:00"))).toBeUndefined();
  });
});

describe("プロジェクトの削除", () => {
  test("記録が紐づいていなければ削除する", () => {
    const project = createProject(db, input, at("09:00:00"));

    expect(deleteProject(db, project.id)).toBe("deleted");
    expect(getProject(db, project.id)).toBeUndefined();
  });

  test("記録が紐づいていれば削除せず in-use を返す", () => {
    const project = createProject(db, input, at("09:00:00"));
    db.insert(timeEntries)
      .values({
        taskName: "資料作成",
        projectId: project.id,
        startedAt: at("09:00:00"),
        endedAt: at("10:00:00"),
        createdAt: at("09:00:00"),
        updatedAt: at("10:00:00"),
      })
      .run();

    expect(deleteProject(db, project.id)).toBe("in-use");
    expect(getProject(db, project.id)).toBeDefined();
  });

  test("存在しない id は not-found", () => {
    expect(deleteProject(db, 999)).toBe("not-found");
  });
});

describe("プロジェクトのアーカイブ", () => {
  const names = (archived: boolean) =>
    listProjects(db, { archived }).map((p) => p.name);

  test("アーカイブすると、未アーカイブとアーカイブ済みの一覧に登録順で分かれる", () => {
    const a = createProject(db, { ...input, name: "A" }, at("09:00:00"));
    const b = createProject(db, { ...input, name: "B" }, at("09:01:00"));
    const c = createProject(db, { ...input, name: "C" }, at("09:02:00"));

    expect(setProjectArchived(db, c.id, at("10:00:00"), at("10:00:00"))).toBe(
      true,
    );
    setProjectArchived(db, a.id, at("10:05:00"), at("10:05:00"));

    expect(names(false)).toEqual(["B"]);
    expect(names(true)).toEqual(["A", "C"]);
    expect(getProject(db, a.id)).toMatchObject({
      archivedAt: at("10:05:00"),
      updatedAt: at("10:05:00"),
    });
    expect(getProject(db, b.id)?.archivedAt).toBeNull();
  });

  test("解除すると未アーカイブの一覧の登録順の位置に戻る", () => {
    const a = createProject(db, { ...input, name: "A" }, at("09:00:00"));
    createProject(db, { ...input, name: "B" }, at("09:01:00"));
    setProjectArchived(db, a.id, at("10:00:00"), at("10:00:00"));

    expect(setProjectArchived(db, a.id, null, at("11:00:00"))).toBe(true);

    expect(names(false)).toEqual(["A", "B"]);
    expect(names(true)).toEqual([]);
    expect(getProject(db, a.id)?.archivedAt).toBeNull();
  });

  test("存在しない id は false", () => {
    expect(setProjectArchived(db, 999, at("10:00:00"), at("10:00:00"))).toBe(
      false,
    );
  });

  test("アーカイブしたプロジェクトとも名前は重複できない", () => {
    const a = createProject(db, input, at("09:00:00"));
    setProjectArchived(db, a.id, at("10:00:00"), at("10:00:00"));

    expect(findProjectByName(db, input.name)?.id).toBe(a.id);
    expect(() => createProject(db, input, at("11:00:00"))).toThrow(/UNIQUE/);
  });
});
