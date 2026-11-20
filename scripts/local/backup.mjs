// 普段使いの記録のバックアップ。日付（日本時間）ごとに 1 つ作り、新しい BACKUP_KEEP 個だけを残す。
// launchd（ログイン時と毎日 12:00）と `npm run local:backup` から実行する。

import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { BACKUP_KEEP, localPaths } from "./config.mjs";

const NAME = /^timelog-(\d{4}-\d{2}-\d{2})\.db$/;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * その日（日本時間）のバックアップのファイル名（「timelog-2026-11-20.db」）
 *
 * @param {Date} date
 */
export function backupFileName(date) {
  return `timelog-${dateFormatter.format(date)}.db`;
}

/**
 * 消すバックアップのファイル名。バックアップの形の名前のものを日付の新しい順に並べ、keep 個より後ろを返す。
 * ほかの名前のファイルは対象にしない。
 *
 * @param {string[]} names ディレクトリにあるファイル名
 * @param {number} [keep]
 */
export function backupsToDelete(names, keep = BACKUP_KEEP) {
  return names
    .filter((name) => NAME.test(name))
    .sort()
    .reverse()
    .slice(keep);
}

/**
 * SQLite のオンラインバックアップで記録を複製し、古いバックアップを消す。
 * WAL に残っている書き込み途中の分も含め、アプリが動いている間でも壊れていない複製を作る。
 * 一時ファイルに書いてから名前を変えるので、途中で止まっても同じ日の前の分は壊れない。
 *
 * @param {{ database: string; backupsDir: string; now?: Date; keep?: number; log?: (message: string) => void }} options
 * @returns {Promise<string | null>} 作ったバックアップのパス。記録がなければ null
 */
export async function backup({
  database,
  backupsDir,
  now = new Date(),
  keep = BACKUP_KEEP,
  log = console.log,
}) {
  if (!existsSync(database)) {
    log(`記録がないため、バックアップをとりませんでした: ${database}`);
    return null;
  }
  mkdirSync(backupsDir, { recursive: true });
  const target = join(backupsDir, backupFileName(now));
  const temp = `${target}.tmp`;
  rmSync(temp, { force: true });
  const db = new Database(database, { readonly: true, fileMustExist: true });
  try {
    await db.backup(temp);
  } finally {
    db.close();
  }
  // 複製は元の WAL モードを引き継ぐ。開いたときに -wal・-shm のファイルができないよう、1 つのファイルで完結させる
  const copy = new Database(temp);
  try {
    copy.pragma("journal_mode = DELETE");
  } finally {
    copy.close();
  }
  renameSync(temp, target);
  for (const name of backupsToDelete(readdirSync(backupsDir), keep)) {
    rmSync(join(backupsDir, name), { force: true });
  }
  log(`バックアップをとりました: ${target}`);
  return target;
}

// `node scripts/local/backup.mjs` で実行したとき。記録の場所は DATABASE_URL があればそれを使う
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const paths = localPaths();
  await backup({
    database: process.env.DATABASE_URL ?? paths.database,
    backupsDir: paths.backupsDir,
  });
}
