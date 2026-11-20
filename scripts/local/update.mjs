// 普段使いの TimeLog を更新する。開発用のリポジトリで `npm run local:update [-- --branch <名前>]` から実行する。
// バックアップをとってから、普段使い用のアプリをブランチ（既定は main）の最新にしてビルドし、起動し直す。
// ビルドに失敗したら、更新前の版に戻してビルドし直し、動かし続ける。

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { backup } from "./backup.mjs";
import { LABELS, localPaths } from "./config.mjs";
import {
  APP_URL,
  build,
  checkoutLatest,
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
 *   backup: (options: { database: string; backupsDir: string }) => Promise<unknown>;
 *   waitForApp: (url: string) => Promise<boolean>;
 *   paths: ReturnType<typeof localPaths>;
 *   branch: string;
 *   mise: string;
 *   uid: number;
 *   log: (message: string) => void;
 * }} options
 * @returns {Promise<number>} 終了コード。更新できたら 0、ビルドに失敗して前の版に戻したら 1
 */
export async function update({
  run,
  fs,
  backup: takeBackup,
  waitForApp: wait,
  paths,
  branch,
  mise,
  uid,
  log,
}) {
  const appDir = paths.appDir;
  if (!fs.exists(join(appDir, ".git"))) {
    throw new Error(
      "普段使いの TimeLog が導入されていません。先に npm run local:install を実行してください。",
    );
  }

  // 1. 更新の前にバックアップをとる
  await takeBackup({ database: paths.database, backupsDir: paths.backupsDir });

  // 2. ブランチの最新にしてビルドする。失敗したら更新前の版に戻す
  const previous = run("git", [
    "-C",
    appDir,
    "rev-parse",
    "HEAD",
  ]).stdout.trim();
  try {
    checkoutLatest({ run, appDir, branch });
    build({ run, mise, appDir });
  } catch (error) {
    log(
      `更新に失敗しました（${error instanceof Error ? error.message : error}）。更新前の版に戻します。`,
    );
    run("git", ["-C", appDir, "reset", "--hard", previous]);
    build({ run, mise, appDir });
    run("launchctl", ["kickstart", "-k", `gui/${uid}/${LABELS.app}`]);
    log("更新前の版で動かし続けます。");
    return 1;
  }

  // 3. launchd の設定を書き直して登録し直す（アプリも起動し直す）
  registerAgents({ run, fs, mise, paths, uid });
  if (!(await wait(APP_URL))) {
    throw new Error(
      `アプリが応答しません。ログを確認してください: ${join(paths.logsDir, "app.log")}`,
    );
  }
  log(`更新しました: ${APP_URL}`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await update({
      run: runCommand,
      fs: realFs,
      backup,
      waitForApp,
      paths: localPaths(),
      branch: parseBranch(process.argv.slice(2)),
      mise: findMise(),
      uid: process.getuid?.() ?? 0,
      log: console.log,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
