// PR に `archive` ラベルが付いたときに、PR が含む OpenSpec change をアーカイブする。
// .github/workflows/openspec-archive.yml から実行する。

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CHANGES_DIR = "openspec/changes/";

/**
 * PR の差分に含まれるパスから、アーカイブ対象の change 名を求める。
 * `archive/` 配下と、作業ツリーに存在しない（アーカイブ済みの）change は対象にしない。
 *
 * @param {string[]} diffPaths `git diff --name-only` の結果
 * @param {(name: string) => boolean} changeExists `openspec/changes/<name>/` が存在するか
 * @returns {string[]} 名前順に並べた change 名
 */
export function findArchiveTargets(diffPaths, changeExists) {
  const names = new Set();
  for (const path of diffPaths) {
    if (!path.startsWith(CHANGES_DIR)) continue;
    const [name, ...rest] = path.slice(CHANGES_DIR.length).split("/");
    if (!name || rest.length === 0 || name === "archive") continue;
    names.add(name);
  }
  return [...names].filter((name) => changeExists(name)).sort();
}

/**
 * `openspec list --json` の結果から、未完了タスクのある change を求める。
 * 完了の判定は OpenSpec CLI の集計（completedTasks / totalTasks）に従う。
 *
 * @param {{ changes: { name: string, completedTasks: number, totalTasks: number }[] }} list
 * @param {string[]} targets アーカイブ対象の change 名
 * @returns {{ name: string, remaining: number }[]}
 */
export function findIncompleteChanges(list, targets) {
  return targets.flatMap((name) => {
    const change = list.changes.find((c) => c.name === name);
    if (!change) {
      throw new Error(`change「${name}」のタスクの状況を取得できませんでした`);
    }
    const remaining = change.totalTasks - change.completedTasks;
    return remaining > 0 ? [{ name, remaining }] : [];
  });
}

/** PR コメントに載せるコマンド出力の最大文字数 */
const MAX_OUTPUT_LENGTH = 3000;

/**
 * @typedef {{ code: number, stdout: string, stderr: string }} ExecResult
 * @typedef {(command: string, args: string[]) => ExecResult} Exec
 * @typedef {"archived" | "no-targets" | "incomplete" | "failed"} RunStatus
 */

/** @param {ExecResult} result */
function formatOutput(result) {
  const output = `${result.stdout}\n${result.stderr}`.trim();
  const tail =
    output.length > MAX_OUTPUT_LENGTH
      ? `…${output.slice(-MAX_OUTPUT_LENGTH)}`
      : output;
  return `\`\`\`\n${tail}\n\`\`\``;
}

/**
 * PR が含む change を確認し、すべてアーカイブできるときだけコミットして push する。
 * 失敗したとき・対象がないとき・未完了タスクがあるときは PR ブランチを変更せず PR にコメントする。
 *
 * @param {{
 *   exec: Exec,
 *   changeExists: (name: string) => boolean,
 *   baseRef: string,
 *   headRef: string,
 *   prNumber: string,
 * }} deps
 * @returns {{ status: RunStatus, archived: string[] }}
 */
export function run({ exec, changeExists, baseRef, headRef, prNumber }) {
  /** @param {string} body */
  const comment = (body) => {
    exec("gh", ["pr", "comment", prNumber, "--body", body]);
  };
  /** @param {RunStatus} status */
  const done = (status, archived = []) => ({ status, archived });

  const diff = exec("git", [
    "diff",
    "--name-only",
    `origin/${baseRef}...HEAD`,
    "--",
    CHANGES_DIR,
  ]);
  if (diff.code !== 0) {
    comment(
      `PR の差分を取得できなかったため、アーカイブしませんでした。\n\n${formatOutput(diff)}`,
    );
    return done("failed");
  }
  const targets = findArchiveTargets(
    diff.stdout.split("\n").filter(Boolean),
    changeExists,
  );
  if (targets.length === 0) {
    comment("この PR にはアーカイブ対象の OpenSpec change がありません。");
    return done("no-targets");
  }

  const list = exec("npx", ["openspec", "list", "--json"]);
  let incomplete;
  try {
    if (list.code !== 0) throw new Error(formatOutput(list));
    incomplete = findIncompleteChanges(JSON.parse(list.stdout), targets);
  } catch (error) {
    comment(
      `タスクの状況を確認できなかったため、アーカイブしませんでした。\n\n${error instanceof Error ? error.message : String(error)}`,
    );
    return done("failed");
  }
  if (incomplete.length > 0) {
    const lines = incomplete.map(
      ({ name, remaining }) => `- \`${name}\`: 未完了 ${remaining} 件`,
    );
    comment(
      `tasks.md に未完了のタスクがあるため、アーカイブしませんでした。タスクを完了させてから \`archive\` ラベルを付け直してください。\n\n${lines.join("\n")}`,
    );
    return done("incomplete");
  }

  for (const name of targets) {
    const result = exec("npx", ["openspec", "archive", name, "--yes"]);
    if (result.code !== 0) {
      exec("git", ["reset", "--hard", "HEAD"]);
      exec("git", ["clean", "-fd", "--", "openspec"]);
      comment(
        `change \`${name}\` のアーカイブに失敗したため、どの change もアーカイブしませんでした。\n\n${formatOutput(result)}`,
      );
      return done("failed");
    }
  }

  const message = `${targets.join("、")} をアーカイブ`;
  for (const args of [
    ["add", "--all", "--", "openspec"],
    ["commit", "-m", message],
    ["push", "origin", `HEAD:${headRef}`],
  ]) {
    const result = exec("git", args);
    if (result.code !== 0) {
      comment(
        `アーカイブ結果をコミット・push できませんでした（\`git ${args[0]}\`）。\n\n${formatOutput(result)}`,
      );
      return done("failed");
    }
  }

  // GITHUB_TOKEN での push では CI が起動しないため、明示的に起動する
  const ci = exec("gh", ["workflow", "run", "ci.yml", "--ref", headRef]);
  if (ci.code !== 0) {
    comment(
      `アーカイブしましたが、CI を起動できませんでした。Actions から CI を手動で実行してください。\n\n${formatOutput(ci)}`,
    );
  }
  return done("archived", targets);
}

/** @type {Exec} */
function exec(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? String(result.error ?? ""),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { BASE_REF, HEAD_REF, PR_NUMBER } = process.env;
  if (!BASE_REF || !HEAD_REF || !PR_NUMBER) {
    console.error("BASE_REF・HEAD_REF・PR_NUMBER を指定してください");
    process.exit(1);
  }
  const { status, archived } = run({
    exec,
    changeExists: (name) => existsSync(`${CHANGES_DIR}${name}`),
    baseRef: BASE_REF,
    headRef: HEAD_REF,
    prNumber: PR_NUMBER,
  });
  console.log(
    `結果: ${status}${archived.length ? `（${archived.join("、")}）` : ""}`,
  );
  process.exit(status === "archived" || status === "no-targets" ? 0 : 1);
}
