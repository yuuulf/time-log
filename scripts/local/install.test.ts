// @vitest-environment node
import { describe, expect, test } from "vitest";
import { localPaths } from "./config.mjs";
import { install } from "./install.mjs";

const paths = localPaths("/Users/someone");
const devDir = "/Users/someone/dev/time-log";
const devDatabase = `${devDir}/data/timelog.db`;
const mise = "/opt/homebrew/bin/mise";

/** 偽のコマンドとファイル。実行したコマンドと書いたファイルを記録する */
function fake(existing: string[] = []) {
  const files = new Set(existing);
  const commands: string[] = [];
  const copies: string[] = [];
  const written: string[] = [];
  return {
    commands,
    copies,
    written,
    options: {
      run: (
        command: string,
        args: string[],
        options: { cwd?: string } = {},
      ) => {
        commands.push(
          [command, ...args].join(" ") +
            (options.cwd ? ` @${options.cwd}` : ""),
        );
        return {
          status: 0,
          stdout: args.includes("get-url")
            ? "https://github.com/yuuulf/time-log.git\n"
            : "",
        };
      },
      fs: {
        exists: (path: string) => files.has(path),
        mkdir: () => {},
        writeFile: (path: string) => {
          written.push(path);
        },
      },
      copy: async (from: string, to: string) => {
        copies.push(`${from} → ${to}`);
      },
      waitForApp: async () => true,
      paths,
      devDir,
      branch: "main",
      mise,
      uid: 501,
      platform: "darwin",
      log: () => {},
    },
  };
}

describe("初めての導入", () => {
  test("clone → ビルド → 記録を移す → launchd に登録する、の順に行う", async () => {
    const f = fake([devDatabase]);
    await install(f.options);

    const app = paths.appDir;
    expect(f.commands).toEqual([
      `git -C ${devDir} remote get-url origin`,
      `git clone --branch main https://github.com/yuuulf/time-log.git ${app}`,
      `${mise} trust @${app}`,
      `${mise} install @${app}`,
      `${mise} exec -- npm ci @${app}`,
      `${mise} exec -- npm run build @${app}`,
      "launchctl bootout gui/501/local.timelog.app",
      `launchctl bootstrap gui/501 ${paths.launchAgentsDir}/local.timelog.app.plist`,
      "launchctl bootout gui/501/local.timelog.backup",
      `launchctl bootstrap gui/501 ${paths.launchAgentsDir}/local.timelog.backup.plist`,
    ]);
    expect(f.copies).toEqual([`${devDatabase} → ${paths.database}`]);
    expect(f.written).toEqual([
      `${paths.launchAgentsDir}/local.timelog.app.plist`,
      `${paths.launchAgentsDir}/local.timelog.backup.plist`,
    ]);
  });

  test("開発用の記録がなければ写さない", async () => {
    const f = fake([]);
    await install(f.options);

    expect(f.copies).toEqual([]);
  });

  test("--branch で別のブランチから用意できる", async () => {
    const f = fake([]);
    await install({ ...f.options, branch: "add-local-operation" });

    expect(f.commands[1]).toBe(
      `git clone --branch add-local-operation https://github.com/yuuulf/time-log.git ${paths.appDir}`,
    );
  });
});

describe("導入済みでもう一度実行する", () => {
  test("clone せずブランチの最新にし、普段使い用の記録は上書きしない", async () => {
    const f = fake([`${paths.appDir}/.git`, paths.database, devDatabase]);
    await install(f.options);

    expect(f.commands.slice(0, 2)).toEqual([
      `git -C ${paths.appDir} fetch origin`,
      `git -C ${paths.appDir} checkout -B main origin/main`,
    ]);
    expect(f.commands.some((c) => c.startsWith("git clone"))).toBe(false);
    expect(f.copies).toEqual([]);
  });
});

describe("失敗するとき", () => {
  test("macOS でなければ何もせずに止める", async () => {
    const f = fake([]);
    await expect(install({ ...f.options, platform: "linux" })).rejects.toThrow(
      "macOS",
    );
    expect(f.commands).toEqual([]);
  });

  test("アプリが応答しなければ、ログの場所を伝えて失敗する", async () => {
    const f = fake([]);
    await expect(
      install({ ...f.options, waitForApp: async () => false }),
    ).rejects.toThrow(`${paths.logsDir}/app.log`);
  });
});
