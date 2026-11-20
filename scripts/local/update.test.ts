// @vitest-environment node
import { describe, expect, test } from "vitest";
import { localPaths } from "./config.mjs";
import { update } from "./update.mjs";

const paths = localPaths("/Users/someone");
const app = paths.appDir;
const mise = "/opt/homebrew/bin/mise";

/** 偽のコマンド。failOn に一致するコマンドを、その回数だけ失敗させる */
function fake({ failOn = "", failTimes = 0, installed = true } = {}) {
  const commands: string[] = [];
  const backups: string[] = [];
  let failures = 0;
  return {
    commands,
    backups,
    options: {
      run: (
        command: string,
        args: string[],
        options: { cwd?: string } = {},
      ) => {
        const line =
          [command, ...args].join(" ") +
          (options.cwd ? ` @${options.cwd}` : "");
        commands.push(line);
        if (failOn && line.includes(failOn) && failures < failTimes) {
          failures += 1;
          throw new Error(`失敗: ${line}`);
        }
        return {
          status: args[0] === "print" ? 1 : 0,
          stdout: args.includes("rev-parse") ? "abc123\n" : "",
        };
      },
      fs: {
        exists: (path: string) => installed && path === `${app}/.git`,
        mkdir: () => {},
        writeFile: () => {},
      },
      backup: async ({ database }: { database: string }) => {
        backups.push(database);
      },
      waitForApp: async () => true,
      paths,
      branch: "main",
      mise,
      uid: 501,
      log: () => {},
    },
  };
}

describe("更新する", () => {
  test("バックアップ → 最新にする → ビルド → launchd に登録し直す、の順に行う", async () => {
    const f = fake();

    expect(await update(f.options)).toBe(0);
    expect(f.backups).toEqual([paths.database]);
    expect(f.commands).toEqual([
      `git -C ${app} rev-parse HEAD`,
      `git -C ${app} fetch origin`,
      `git -C ${app} checkout -B main origin/main`,
      `${mise} exec -- npm ci @${app}`,
      `${mise} exec -- npm run build @${app}`,
      "launchctl bootout gui/501/local.timelog.app",
      "launchctl print gui/501/local.timelog.app",
      `launchctl bootstrap gui/501 ${paths.launchAgentsDir}/local.timelog.app.plist`,
      "launchctl bootout gui/501/local.timelog.backup",
      "launchctl print gui/501/local.timelog.backup",
      `launchctl bootstrap gui/501 ${paths.launchAgentsDir}/local.timelog.backup.plist`,
    ]);
  });

  test("--branch で別のブランチの最新にできる", async () => {
    const f = fake();
    await update({ ...f.options, branch: "add-local-operation" });

    expect(f.commands).toContain(
      `git -C ${app} checkout -B add-local-operation origin/add-local-operation`,
    );
  });
});

describe("ビルドに失敗する", () => {
  test("更新前の版に戻してビルドし直し、アプリを起動し直して終了コード 1 で終わる", async () => {
    const f = fake({ failOn: "npm run build", failTimes: 1 });

    expect(await update(f.options)).toBe(1);
    expect(f.commands.slice(4)).toEqual([
      `${mise} exec -- npm run build @${app}`,
      `git -C ${app} reset --hard abc123`,
      `${mise} exec -- npm ci @${app}`,
      `${mise} exec -- npm run build @${app}`,
      "launchctl kickstart -k gui/501/local.timelog.app",
    ]);
    expect(f.commands.some((c) => c.includes("bootstrap"))).toBe(false);
  });
});

describe("導入していない", () => {
  test("導入を案内して、何もせずに止める", async () => {
    const f = fake({ installed: false });

    await expect(update(f.options)).rejects.toThrow("npm run local:install");
    expect(f.commands).toEqual([]);
    expect(f.backups).toEqual([]);
  });
});
