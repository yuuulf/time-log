// 普段使いの TimeLog を launchd で動かすための設定ファイル（plist）の中身を作る。

import { join } from "node:path";
import { BACKUP_TIME, HOST, LABELS, PORT } from "./config.mjs";

/** @param {string} value */
function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * plist の値を XML にする。文字列・数・真偽値・配列・オブジェクト（dict）に対応する。
 *
 * @param {unknown} value
 * @param {string} indent
 * @returns {string}
 */
function toXml(value, indent) {
  const inner = `${indent}  `;
  if (typeof value === "string")
    return `${indent}<string>${escapeXml(value)}</string>`;
  if (typeof value === "number") return `${indent}<integer>${value}</integer>`;
  if (typeof value === "boolean") return `${indent}<${value}/>`;
  if (Array.isArray(value)) {
    return [
      `${indent}<array>`,
      ...value.map((v) => toXml(v, inner)),
      `${indent}</array>`,
    ].join("\n");
  }
  const entries = Object.entries(
    /** @type {Record<string, unknown>} */ (value),
  );
  return [
    `${indent}<dict>`,
    ...entries.flatMap(([key, v]) => [
      `${inner}<key>${escapeXml(key)}</key>`,
      toXml(v, inner),
    ]),
    `${indent}</dict>`,
  ].join("\n");
}

/** @param {Record<string, unknown>} dict */
function plist(dict) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    toXml(dict, ""),
    "</plist>",
    "",
  ].join("\n");
}

/**
 * アプリとバックアップの launchd の設定。
 * launchd ではシェルの設定（mise の PATH）が効かないため、mise は絶対パスで呼ぶ。
 *
 * @param {{ mise: string; paths: ReturnType<typeof import("./config.mjs").localPaths> }} options
 * @returns {{ label: string; path: string; content: string }[]}
 */
export function launchAgents({ mise, paths }) {
  const environment = {
    DATABASE_URL: paths.database,
    NODE_ENV: "production",
  };
  const app = {
    Label: LABELS.app,
    ProgramArguments: [
      mise,
      "exec",
      "--",
      "node_modules/.bin/next",
      "start",
      "-H",
      HOST,
      "-p",
      String(PORT),
    ],
    WorkingDirectory: paths.appDir,
    EnvironmentVariables: environment,
    // ログインしたときに起動し、止まったら起動し直す
    RunAtLoad: true,
    KeepAlive: true,
    StandardOutPath: join(paths.logsDir, "app.log"),
    StandardErrorPath: join(paths.logsDir, "app.log"),
  };
  const backup = {
    Label: LABELS.backup,
    ProgramArguments: [mise, "exec", "--", "node", "scripts/local/backup.mjs"],
    WorkingDirectory: paths.appDir,
    EnvironmentVariables: environment,
    // ログインしたときと毎日決まった時刻。スリープ中に過ぎた時刻の分は、起きたときに実行される
    RunAtLoad: true,
    StartCalendarInterval: {
      Hour: BACKUP_TIME.hour,
      Minute: BACKUP_TIME.minute,
    },
    StandardOutPath: join(paths.logsDir, "backup.log"),
    StandardErrorPath: join(paths.logsDir, "backup.log"),
  };
  return [app, backup].map((dict) => ({
    label: dict.Label,
    path: join(paths.launchAgentsDir, `${dict.Label}.plist`),
    content: plist(dict),
  }));
}
