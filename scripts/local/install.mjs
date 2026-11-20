// 普段使いの TimeLog を導入する。開発用のリポジトリで `npm run local:install [-- --branch <名前>]` から実行する。
// 普段使い用のアプリを別の場所に用意してビルドし、記録を移し、launchd に登録する。何度実行しても同じ状態になる。

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { localPaths } from "./config.mjs";
import {
  APP_URL,
  build,
  checkoutLatest,
  copyDatabase,
  findMise,
  parseBranch,
  realFs,
  registerAgents,
  runCommand,
  waitForApp,
} from "./common.mjs";

/**
 * @param {{
 *   run: import("./common.mjs").Run;
 *   fs: import("./common.mjs").Fs;
 *   copy: (from: string, to: string) => Promise<void>;
 *   waitForApp: (url: string) => Promise<boolean>;
 *   paths: ReturnType<typeof localPaths>;
 *   devDir: string;
 *   branch: string;
 *   mise: string;
 *   uid: number;
 *   platform: string;
 *   log: (message: string) => void;
 * }} options
 */
export async function install({
  run,
  fs,
  copy,
  waitForApp: wait,
  paths,
  devDir,
  branch,
  mise,
  uid,
  platform,
  log,
}) {
  if (platform !== "darwin") {
    throw new Error("普段使いの導入は macOS だけに対応しています。");
  }

  // 1. 普段使い用のアプリを用意する（開発用のリポジトリの origin から clone）
  if (fs.exists(join(paths.appDir, ".git"))) {
    log(`普段使い用のアプリを ${branch} の最新にします: ${paths.appDir}`);
    checkoutLatest({ run, appDir: paths.appDir, branch });
  } else {
    const origin = run("git", [
      "-C",
      devDir,
      "remote",
      "get-url",
      "origin",
    ]).stdout.trim();
    log(`普段使い用のアプリを用意します: ${paths.appDir}`);
    fs.mkdir(paths.root);
    run("git", ["clone", "--branch", branch, origin, paths.appDir]);
  }

  // 2. 依存のインストールとビルド
  run(mise, ["trust"], { cwd: paths.appDir });
  run(mise, ["install"], { cwd: paths.appDir });
  build({ run, mise, appDir: paths.appDir });

  // 3. 記録を移す（普段使い用の記録がまだないときだけ）
  const devDatabase = join(devDir, "data", "timelog.db");
  if (fs.exists(paths.database)) {
    log(`普段使い用の記録はそのまま使います: ${paths.database}`);
  } else if (fs.exists(devDatabase)) {
    log(`開発用の記録を移します: ${devDatabase} → ${paths.database}`);
    await copy(devDatabase, paths.database);
  } else {
    log("開発用の記録がないため、空の記録で始めます。");
  }

  // 4. launchd に登録して、起動を待つ
  registerAgents({ run, fs, mise, paths, uid });
  if (await wait(APP_URL)) {
    log(`普段使いの TimeLog を開けます: ${APP_URL}`);
  } else {
    throw new Error(
      `アプリが応答しません。ログを確認してください: ${join(paths.logsDir, "app.log")}`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await install({
      run: runCommand,
      fs: realFs,
      copy: copyDatabase,
      waitForApp,
      paths: localPaths(),
      devDir: process.cwd(),
      branch: parseBranch(process.argv.slice(2)),
      mise: findMise(),
      uid: process.getuid?.() ?? 0,
      platform: process.platform,
      log: console.log,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
