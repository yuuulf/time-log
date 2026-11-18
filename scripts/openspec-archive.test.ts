// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  findArchiveTargets,
  findIncompleteChanges,
  run,
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

describe("run", () => {
  type Result = { code: number; stdout: string; stderr: string };
  const ok = (stdout = ""): Result => ({ code: 0, stdout, stderr: "" });
  const ng = (stderr: string): Result => ({ code: 1, stdout: "", stderr });

  /** 外部コマンドを差し替え、呼び出しを記録する */
  function setup({
    diff = [] as string[],
    changes = [] as {
      name: string;
      completedTasks: number;
      totalTasks: number;
    }[],
    fail = {} as Record<string, string>,
  }) {
    const calls: string[] = [];
    const comments: string[] = [];
    const exec = (command: string, args: string[]): Result => {
      const line = [command, ...args].join(" ");
      calls.push(line);
      if (command === "gh" && args[0] === "pr") {
        comments.push(args[4]);
        return ok();
      }
      const failure = Object.entries(fail).find(([prefix]) =>
        line.startsWith(prefix),
      );
      if (failure) return ng(failure[1]);
      if (line.startsWith("git diff")) return ok(diff.join("\n"));
      if (line === "npx openspec list --json") {
        return ok(JSON.stringify({ changes }));
      }
      return ok();
    };
    const names = new Set(
      diff.map((path) => path.split("/")[2]).filter((n) => n !== "archive"),
    );
    const result = run({
      exec,
      changeExists: (name: string) => names.has(name),
      baseRef: "main",
      headRef: "feature",
      prNumber: "12",
    });
    const committed = calls.some((c) => c.startsWith("git commit"));
    return { result, calls, comments, committed };
  }

  const done = (name: string) => ({ name, completedTasks: 2, totalTasks: 2 });

  test("change を 1 つアーカイブしてコミット・push し、CI を起動する", () => {
    const { result, calls, comments } = setup({
      diff: ["openspec/changes/add-timer/tasks.md"],
      changes: [done("add-timer")],
    });
    expect(result).toEqual({ status: "archived", archived: ["add-timer"] });
    expect(calls).toContain("npx openspec archive add-timer --yes");
    expect(calls).toContain("git commit -m add-timer をアーカイブ");
    expect(calls).toContain("git push origin HEAD:feature");
    expect(calls).toContain("gh workflow run ci.yml --ref feature");
    expect(comments).toEqual([]);
  });

  test("change を複数含むときはすべてアーカイブして 1 コミットにする", () => {
    const { result, calls } = setup({
      diff: [
        "openspec/changes/b-change/tasks.md",
        "openspec/changes/a-change/tasks.md",
      ],
      changes: [done("a-change"), done("b-change")],
    });
    expect(result.archived).toEqual(["a-change", "b-change"]);
    expect(calls.filter((c) => c.startsWith("git commit"))).toEqual([
      "git commit -m a-change、b-change をアーカイブ",
    ]);
  });

  test("対象の change がないときはコミットせずコメントする", () => {
    const { result, committed, comments } = setup({ diff: ["app/page.tsx"] });
    expect(result.status).toBe("no-targets");
    expect(committed).toBe(false);
    expect(comments[0]).toContain(
      "アーカイブ対象の OpenSpec change がありません",
    );
  });

  test("未完了タスクがあるときはアーカイブもコミットもせずコメントする", () => {
    const { result, calls, committed, comments } = setup({
      diff: [
        "openspec/changes/a-change/tasks.md",
        "openspec/changes/b-change/tasks.md",
      ],
      changes: [
        done("a-change"),
        { name: "b-change", completedTasks: 1, totalTasks: 4 },
      ],
    });
    expect(result.status).toBe("incomplete");
    expect(calls.some((c) => c.startsWith("npx openspec archive"))).toBe(false);
    expect(committed).toBe(false);
    expect(comments[0]).toContain("`b-change`: 未完了 3 件");
    expect(comments[0]).not.toContain("a-change");
  });

  test("アーカイブに失敗したときはコミットせず、作業ツリーを戻してコメントする", () => {
    const { result, calls, committed, comments } = setup({
      diff: [
        "openspec/changes/a-change/tasks.md",
        "openspec/changes/b-change/tasks.md",
      ],
      changes: [done("a-change"), done("b-change")],
      fail: { "npx openspec archive b-change": "Validation failed: spec.md" },
    });
    expect(result.status).toBe("failed");
    expect(committed).toBe(false);
    expect(calls).toContain("git reset --hard HEAD");
    expect(comments[0]).toContain("`b-change`");
    expect(comments[0]).toContain("Validation failed: spec.md");
  });

  test("push に失敗したときはコメントし、CI は起動しない", () => {
    const { result, calls, comments } = setup({
      diff: ["openspec/changes/a-change/tasks.md"],
      changes: [done("a-change")],
      fail: { "git push": "rejected" },
    });
    expect(result.status).toBe("failed");
    expect(comments[0]).toContain("rejected");
    expect(calls.some((c) => c.startsWith("gh workflow run"))).toBe(false);
  });
});
