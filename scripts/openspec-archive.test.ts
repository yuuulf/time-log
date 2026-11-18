// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  findArchiveTargets,
  findIncompleteChanges,
} from "./openspec-archive.mjs";

const exists =
  (...names: string[]) =>
  (name: string) =>
    names.includes(name);

describe("findArchiveTargets", () => {
  test("change を 1 つ含む", () => {
    const paths = [
      "openspec/changes/add-timer/proposal.md",
      "openspec/changes/add-timer/specs/timer/spec.md",
      "app/page.tsx",
    ];
    expect(findArchiveTargets(paths, exists("add-timer"))).toEqual([
      "add-timer",
    ]);
  });

  test("change を複数含む", () => {
    const paths = [
      "openspec/changes/b-change/tasks.md",
      "openspec/changes/a-change/tasks.md",
    ];
    expect(findArchiveTargets(paths, exists("a-change", "b-change"))).toEqual([
      "a-change",
      "b-change",
    ]);
  });

  test("change を含まない", () => {
    const paths = ["app/page.tsx", "openspec/specs/app-shell/spec.md"];
    expect(findArchiveTargets(paths, exists())).toEqual([]);
  });

  test("archive/ 配下だけの変更は対象にしない", () => {
    const paths = [
      "openspec/changes/archive/2026-11-18-add-timer/proposal.md",
      "openspec/changes/archive/.gitkeep",
    ];
    expect(findArchiveTargets(paths, exists("archive"))).toEqual([]);
  });

  test("アーカイブ済み（ディレクトリが存在しない）change は対象にしない", () => {
    const paths = [
      "openspec/changes/add-timer/tasks.md",
      "openspec/changes/archive/2026-11-18-add-timer/tasks.md",
    ];
    expect(findArchiveTargets(paths, exists())).toEqual([]);
  });
});

describe("findIncompleteChanges", () => {
  const change = (
    name: string,
    completedTasks: number,
    totalTasks: number,
  ) => ({
    name,
    completedTasks,
    totalTasks,
  });

  test("すべて完了している", () => {
    const list = { changes: [change("a", 3, 3), change("b", 5, 5)] };
    expect(findIncompleteChanges(list, ["a", "b"])).toEqual([]);
  });

  test("未完了のタスクが残っている", () => {
    const list = { changes: [change("a", 1, 4)] };
    expect(findIncompleteChanges(list, ["a"])).toEqual([
      { name: "a", remaining: 3 },
    ]);
  });

  test("複数のうち 1 つだけ未完了", () => {
    const list = { changes: [change("a", 3, 3), change("b", 4, 5)] };
    expect(findIncompleteChanges(list, ["a", "b"])).toEqual([
      { name: "b", remaining: 1 },
    ]);
  });

  test("対象でない change の未完了は無視する", () => {
    const list = { changes: [change("a", 3, 3), change("other", 0, 2)] };
    expect(findIncompleteChanges(list, ["a"])).toEqual([]);
  });

  test("対象の change が一覧にないとエラーにする", () => {
    expect(() => findIncompleteChanges({ changes: [] }, ["a"])).toThrow(
      "change「a」のタスクの状況を取得できませんでした",
    );
  });
});
