// @vitest-environment node
import { describe, expect, test } from "vitest";
import { findArchiveTargets } from "./openspec-archive.mjs";

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
