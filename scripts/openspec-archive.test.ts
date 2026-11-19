// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
  findArchiveTargets,
  findIncompleteChanges,
  fillPurposes,
  parseNewCapabilities,
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

describe("parseNewCapabilities", () => {
  test("New Capabilities の capability と説明を読み、Modified Capabilities は読まない", () => {
    const proposal = `# Proposal

## Capabilities

### New Capabilities
<!-- - \`example\`: テンプレートの例 -->
- \`projects\`: プロジェクトの一覧・登録・編集・削除
- \`reports\`：  プロジェクトごとの集計  

### Modified Capabilities

- \`time-tracking\`: 記録にプロジェクトを紐づける
`;
    expect([...parseNewCapabilities(proposal)]).toEqual([
      ["projects", "プロジェクトの一覧・登録・編集・削除"],
      ["reports", "プロジェクトごとの集計"],
    ]);
  });

  test("「（なし）」や空の説明、New Capabilities の節がないときは何も返さない", () => {
    expect(
      parseNewCapabilities("### New Capabilities\n\n（なし）\n- `empty`: \n"),
    ).toEqual(new Map());
    expect(parseNewCapabilities("# Proposal\n")).toEqual(new Map());
  });
});

const PLACEHOLDER = (change: string) =>
  `TBD - created by archiving change ${change}. Update Purpose after archive.`;
const spec = (purpose: string) =>
  `# x Specification\n\n## Purpose\n${purpose}\n\n## Requirements\n`;

describe("fillPurposes", () => {
  test("仮の目的だけを説明に置き換え、説明のない capability を返す", () => {
    const files = new Map([
      ["openspec/specs/projects/spec.md", spec(PLACEHOLDER("add-projects"))],
      ["openspec/specs/reports/spec.md", spec(PLACEHOLDER("add-reports"))],
      ["openspec/specs/app-shell/spec.md", spec("全画面に共通する外枠")],
    ]);
    const missing = fillPurposes({
      capabilities: new Map([["projects", "プロジェクトの管理（$& を含む）"]]),
      listSpecFiles: () => [...files.keys()],
      readFile: (path: string) => files.get(path)!,
      writeFile: (path: string, content: string) => files.set(path, content),
    });
    expect(missing).toEqual(["reports"]);
    expect(files.get("openspec/specs/projects/spec.md")).toBe(
      spec("プロジェクトの管理（$& を含む）"),
    );
    expect(files.get("openspec/specs/app-shell/spec.md")).toBe(
      spec("全画面に共通する外枠"),
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
    files: initialFiles = {} as Record<string, string>,
    /** アーカイブしたときにできるファイル（change 名 → パス → 内容） */
    archiveCreates = {} as Record<string, Record<string, string>>,
  }) {
    const files = new Map(Object.entries(initialFiles));
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
      if (line.startsWith("npx openspec archive ")) {
        for (const [path, content] of Object.entries(
          archiveCreates[args[2]] ?? {},
        )) {
          files.set(path, content);
        }
      }
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
      listSpecFiles: () =>
        [...files.keys()].filter((path) => path.startsWith("openspec/specs/")),
      readFile: (path: string) => {
        const content = files.get(path);
        if (content === undefined) throw new Error(`ENOENT: ${path}`);
        return content;
      },
      writeFile: (path: string, content: string) => files.set(path, content),
      baseRef: "main",
      headRef: "feature",
      prNumber: "12",
    });
    const committed = calls.some((c) => c.startsWith("git commit"));
    return { result, calls, comments, committed, files };
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

  test("新しい spec の仮の目的を proposal の説明に置き換えてからコミットする", () => {
    const { result, calls, files } = setup({
      diff: ["openspec/changes/add-projects/tasks.md"],
      changes: [done("add-projects")],
      files: {
        "openspec/changes/add-projects/proposal.md":
          "### New Capabilities\n\n- `projects`: プロジェクトの一覧・登録・編集・削除\n",
        "openspec/specs/app-shell/spec.md": spec("全画面に共通する外枠"),
      },
      archiveCreates: {
        "add-projects": {
          "openspec/specs/projects/spec.md": spec(PLACEHOLDER("add-projects")),
        },
      },
    });
    expect(result.status).toBe("archived");
    expect(files.get("openspec/specs/projects/spec.md")).toBe(
      spec("プロジェクトの一覧・登録・編集・削除"),
    );
    expect(files.get("openspec/specs/app-shell/spec.md")).toBe(
      spec("全画面に共通する外枠"),
    );
    expect(calls).toContain("git commit -m add-projects をアーカイブ");
  });

  test("新しい spec の説明が proposal にないときはコミットせず、作業ツリーを戻してコメントする", () => {
    const { result, calls, committed, comments } = setup({
      diff: ["openspec/changes/add-reports/tasks.md"],
      changes: [done("add-reports")],
      files: {
        "openspec/changes/add-reports/proposal.md":
          "### New Capabilities\n\n（なし）\n",
      },
      archiveCreates: {
        "add-reports": {
          "openspec/specs/reports/spec.md": spec(PLACEHOLDER("add-reports")),
        },
      },
    });
    expect(result.status).toBe("failed");
    expect(committed).toBe(false);
    expect(calls).toContain("git reset --hard HEAD");
    expect(comments[0]).toContain("- `reports`");
    expect(comments[0]).toContain("### New Capabilities");
  });

  test("既存の capability だけを変更する change では spec の目的を変えない", () => {
    const before = spec("全画面に共通する外枠");
    const { result, files } = setup({
      diff: ["openspec/changes/tweak-shell/tasks.md"],
      changes: [done("tweak-shell")],
      files: {
        "openspec/changes/tweak-shell/proposal.md":
          "### New Capabilities\n\n（なし）\n",
        "openspec/specs/app-shell/spec.md": before,
      },
    });
    expect(result.status).toBe("archived");
    expect(files.get("openspec/specs/app-shell/spec.md")).toBe(before);
  });
});
