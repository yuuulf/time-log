// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { localPaths } from "./config.mjs";
import { launchAgents } from "./launchd.mjs";

const paths = localPaths("/Users/someone");
const [app, backup] = launchAgents({ mise: "/opt/homebrew/bin/mise", paths });
const root = "/Users/someone/Library/Application Support/TimeLog";

test("アプリは自分の Mac だけで 3100 番を開き、ログイン時に起動して止まったら起動し直す", () => {
  expect(app.label).toBe("local.timelog.app");
  expect(app.path).toBe(
    "/Users/someone/Library/LaunchAgents/local.timelog.app.plist",
  );
  const c = app.content;
  expect(c).toContain("<string>/opt/homebrew/bin/mise</string>");
  expect(c).toContain(
    "<string>-H</string>\n    <string>127.0.0.1</string>\n    <string>-p</string>\n    <string>3100</string>",
  );
  expect(c).toContain(
    `<key>WorkingDirectory</key>\n  <string>${root}/app</string>`,
  );
  expect(c).toContain(
    `<key>DATABASE_URL</key>\n    <string>${root}/timelog.db</string>`,
  );
  expect(c).toContain("<key>NODE_ENV</key>\n    <string>production</string>");
  expect(c).toContain("<key>RunAtLoad</key>\n  <true/>");
  expect(c).toContain("<key>KeepAlive</key>\n  <true/>");
  expect(c).toContain("/Users/someone/Library/Logs/TimeLog/app.log");
});

test("バックアップはログイン時と毎日 12:00 に、普段使いの記録で動く", () => {
  expect(backup.label).toBe("local.timelog.backup");
  const c = backup.content;
  expect(c).toContain("<string>scripts/local/backup.mjs</string>");
  expect(c).toContain(
    `<key>DATABASE_URL</key>\n    <string>${root}/timelog.db</string>`,
  );
  expect(c).toContain("<key>RunAtLoad</key>\n  <true/>");
  expect(c).toContain(
    "<key>StartCalendarInterval</key>\n  <dict>\n    <key>Hour</key>\n    <integer>12</integer>\n    <key>Minute</key>\n    <integer>0</integer>\n  </dict>",
  );
  expect(c).not.toContain("KeepAlive");
  expect(c).toContain("/Users/someone/Library/Logs/TimeLog/backup.log");
});

test.runIf(process.platform === "darwin")(
  "macOS の plutil で正しい plist と判定される",
  () => {
    const dir = mkdtempSync(join(tmpdir(), "timelog-plist-"));
    try {
      for (const agent of [app, backup]) {
        const file = join(dir, `${agent.label}.plist`);
        writeFileSync(file, agent.content);
        expect(execFileSync("plutil", ["-lint", file]).toString()).toContain(
          "OK",
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
