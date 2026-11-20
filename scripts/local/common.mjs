// 普段使いの導入と更新で共通の処理。コマンドの実行やファイルの操作は差し替えられるようにして、テストでは偽物を渡す。

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { parseArgs } from "node:util";
import Database from "better-sqlite3";
import { DEFAULT_BRANCH, HOST, PORT } from "./config.mjs";
import { launchAgents } from "./launchd.mjs";

/** 普段使いのアプリの URL */
export const APP_URL = `http://${HOST}:${PORT}`;

/**
 * @typedef {{ cwd?: string; allowFailure?: boolean }} RunOptions
 * @typedef {(command: string, args: string[], options?: RunOptions) => { status: number; stdout: string }} Run
 * @typedef {{ exists: (path: string) => boolean; mkdir: (path: string) => void; writeFile: (path: string, content: string) => void }} Fs
 */

/**
 * コマンドを実行し、出力をそのまま表示する。失敗したら例外を投げる。
 * allowFailure なら失敗しても投げず、エラー出力も表示しない（失敗してよい確認のためのコマンド）。
 *
 * @type {Run}
 */
export function runCommand(command, args, { cwd, allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: ["ignore", "pipe", allowFailure ? "ignore" : "inherit"],
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  const status = result.status ?? 1;
  if (status !== 0 && !allowFailure) {
    throw new Error(`コマンドが失敗しました: ${command} ${args.join(" ")}`);
  }
  return { status, stdout: result.stdout ?? "" };
}

/**
 * SQLite のオンラインバックアップで記録を写す（WAL の書き込み途中の分も含む）
 *
 * @param {string} from
 * @param {string} to
 */
export async function copyDatabase(from, to) {
  const db = new Database(from, { readonly: true, fileMustExist: true });
  try {
    await db.backup(to);
  } finally {
    db.close();
  }
}

/** PATH から mise の絶対パスを探す。launchd ではシェルの設定が効かないため、設定には絶対パスを書く */
export function findMise(env = process.env) {
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    const candidate = join(dir, "mise");
    if (dir && existsSync(candidate)) return candidate;
  }
  throw new Error(
    "mise が見つかりません。mise をインストールしてから実行してください。",
  );
}

/**
 * アプリが応答するまで待つ。
 *
 * @param {string} url
 * @param {number} [timeoutMs]
 */
export async function waitForApp(url, timeoutMs = 60_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // まだ起動していない
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/** 本物のファイル操作 @type {Fs} */
export const realFs = {
  exists: (path) => existsSync(path),
  mkdir: (path) => {
    mkdirSync(path, { recursive: true });
  },
  writeFile: (path, content) => writeFileSync(path, content),
};

/**
 * 普段使い用のアプリを指定のブランチの最新にする（変更は残さない前提で、origin に合わせる）
 *
 * @param {{ run: Run; appDir: string; branch: string }} options
 */
export function checkoutLatest({ run, appDir, branch }) {
  run("git", ["-C", appDir, "fetch", "origin"]);
  run("git", ["-C", appDir, "checkout", "-B", branch, `origin/${branch}`]);
}

/**
 * 普段使い用のアプリの中で、依存のインストールとビルドをする
 *
 * @param {{ run: Run; mise: string; appDir: string }} options
 */
export function build({ run, mise, appDir }) {
  run(mise, ["exec", "--", "npm", "ci"], { cwd: appDir });
  run(mise, ["exec", "--", "npm", "run", "build"], { cwd: appDir });
}

/** @param {number} ms */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * launchd の設定を書いて登録し直す（登録済みなら外してから登録する。アプリも起動し直す）。
 * 登録を外す処理（bootout）は裏で続くため、外し終わるまで待ってから登録する。
 *
 * @param {{ run: Run; fs: Fs; mise: string; paths: ReturnType<typeof import("./config.mjs").localPaths>; uid: number; sleep?: (ms: number) => void }} options
 */
export function registerAgents({
  run,
  fs,
  mise,
  paths,
  uid,
  sleep = sleepSync,
}) {
  fs.mkdir(paths.launchAgentsDir);
  fs.mkdir(paths.logsDir);
  for (const agent of launchAgents({ mise, paths })) {
    fs.writeFile(agent.path, agent.content);
    const service = `gui/${uid}/${agent.label}`;
    run("launchctl", ["bootout", service], { allowFailure: true });
    // 外し終わる（print で見つからなくなる）まで、最大 10 秒待つ
    for (let i = 0; i < 20; i += 1) {
      if (
        run("launchctl", ["print", service], { allowFailure: true }).status !==
        0
      )
        break;
      sleep(500);
    }
    run("launchctl", ["bootstrap", `gui/${uid}`, agent.path]);
  }
}

/**
 * コマンドラインの `--branch <名前>` を読む
 *
 * @param {string[]} argv
 */
export function parseBranch(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { branch: { type: "string", default: DEFAULT_BRANCH } },
  });
  return /** @type {string} */ (values.branch);
}
