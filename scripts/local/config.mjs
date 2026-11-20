// 普段使いの TimeLog の置き場所と設定。テストでは home を差し替える。

import { homedir } from "node:os";
import { join } from "node:path";

/** 普段使いのアプリを開くポート。開発用の 3000 と重ならないもの */
export const PORT = 3100;

/** 自分の Mac からの接続だけを受けるアドレス */
export const HOST = "127.0.0.1";

/** launchd に登録する名前 */
export const LABELS = {
  app: "local.timelog.app",
  backup: "local.timelog.backup",
};

/** 残すバックアップの数（日数） */
export const BACKUP_KEEP = 3;

/** 毎日バックアップをとる時刻 */
export const BACKUP_TIME = { hour: 12, minute: 0 };

/** 普段使い用のアプリの既定のブランチ */
export const DEFAULT_BRANCH = "main";

/**
 * 普段使いの TimeLog の置き場所。
 *
 * @param {string} [home] ホームディレクトリ
 */
export function localPaths(home = homedir()) {
  const root = join(home, "Library", "Application Support", "TimeLog");
  return {
    root,
    appDir: join(root, "app"),
    database: join(root, "timelog.db"),
    backupsDir: join(root, "backups"),
    logsDir: join(home, "Library", "Logs", "TimeLog"),
    launchAgentsDir: join(home, "Library", "LaunchAgents"),
  };
}
