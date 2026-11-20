// @vitest-environment node
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { backup, backupFileName, backupsToDelete } from "./backup.mjs";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "timelog-backup-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const silent = () => {};

describe("ファイル名", () => {
  test("日本時間の日付で名前を付ける", () => {
    expect(backupFileName(new Date("2026-11-20T12:00:00+09:00"))).toBe(
      "timelog-2026-11-20.db",
    );
    // UTC では 11月19日 15:00 でも、日本時間では 11月20日 0:00
    expect(backupFileName(new Date("2026-11-19T15:00:00Z"))).toBe(
      "timelog-2026-11-20.db",
    );
  });
});

describe("消すバックアップ", () => {
  test("新しい 3 つを残し、ほかの名前のファイルには触らない", () => {
    expect(
      backupsToDelete([
        "timelog-2026-11-18.db",
        "timelog-2026-11-20.db",
        "memo.txt",
        "timelog-2026-11-17.db",
        "timelog-2026-11-19.db",
        "timelog-2026-11-16.db.tmp",
      ]),
    ).toEqual(["timelog-2026-11-17.db"]);
  });

  test("3 つ以下なら消さない", () => {
    expect(
      backupsToDelete(["timelog-2026-11-19.db", "timelog-2026-11-20.db"]),
    ).toEqual([]);
  });
});

describe("バックアップをとる", () => {
  /** WAL モードの記録を作り、閉じずに返す（書き込み途中の分が WAL に残る） */
  const openDatabase = () => {
    const database = join(dir, "timelog.db");
    const db = new Database(database);
    db.pragma("journal_mode = WAL");
    db.pragma("wal_autocheckpoint = 0");
    db.exec(
      "create table time_entries (id integer primary key, task_name text)",
    );
    db.prepare("insert into time_entries (task_name) values (?)").run(
      "資料作成",
    );
    return { database, db };
  };
  const taskNames = (path: string) => {
    const db = new Database(path, { readonly: true });
    try {
      return db
        .prepare("select task_name from time_entries")
        .all()
        .map((row) => (row as { task_name: string }).task_name);
    } finally {
      db.close();
    }
  };

  test("アプリが開いている間でも、WAL の書き込み途中の分を含めて複製する", async () => {
    const { database, db } = openDatabase();
    const backupsDir = join(dir, "backups");

    const path = await backup({
      database,
      backupsDir,
      now: new Date("2026-11-20T12:00:00+09:00"),
      log: silent,
    });

    expect(path).toBe(join(backupsDir, "timelog-2026-11-20.db"));
    expect(taskNames(path!)).toEqual(["資料作成"]);
    // 開いても -wal・-shm のファイルができない（1 つのファイルで完結している）
    expect(readdirSync(backupsDir)).toEqual(["timelog-2026-11-20.db"]);
    db.close();
  });

  test("同じ日にもう一度とると、その日の分を新しい内容に置き換える", async () => {
    const { database, db } = openDatabase();
    const backupsDir = join(dir, "backups");
    const now = new Date("2026-11-20T09:00:00+09:00");
    await backup({ database, backupsDir, now, log: silent });

    db.prepare("insert into time_entries (task_name) values (?)").run("会議");
    await backup({
      database,
      backupsDir,
      now: new Date("2026-11-20T12:00:00+09:00"),
      log: silent,
    });

    expect(readdirSync(backupsDir)).toEqual(["timelog-2026-11-20.db"]);
    expect(taskNames(join(backupsDir, "timelog-2026-11-20.db"))).toEqual([
      "資料作成",
      "会議",
    ]);
    db.close();
  });

  test("新しい 3 日分だけを残す", async () => {
    const { database, db } = openDatabase();
    const backupsDir = join(dir, "backups");
    for (const day of ["17", "18", "19", "20"]) {
      await backup({
        database,
        backupsDir,
        now: new Date(`2026-11-${day}T12:00:00+09:00`),
        log: silent,
      });
    }
    writeFileSync(join(backupsDir, "memo.txt"), "");

    expect(readdirSync(backupsDir).sort()).toEqual([
      "memo.txt",
      "timelog-2026-11-18.db",
      "timelog-2026-11-19.db",
      "timelog-2026-11-20.db",
    ]);
    db.close();
  });

  test("記録がなければ何もせず、理由を伝える", async () => {
    const messages: string[] = [];
    const backupsDir = join(dir, "backups");

    const path = await backup({
      database: join(dir, "none.db"),
      backupsDir,
      log: (message) => messages.push(message),
    });

    expect(path).toBeNull();
    expect(existsSync(backupsDir)).toBe(false);
    expect(messages[0]).toContain("記録がない");
  });
});
