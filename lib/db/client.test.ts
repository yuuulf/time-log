// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { afterEach, expect, test } from "vitest";
import { createDb } from "./client";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("一時ファイルの DB に接続してクエリを実行できる", () => {
  const dir = mkdtempSync(join(tmpdir(), "timelog-db-"));
  tempDirs.push(dir);
  const path = join(dir, "nested", "test.db");

  const db = createDb(path);
  const row = db.get<{ value: number }>(sql`select 1 as value`);

  expect(row).toEqual({ value: 1 });
  expect(existsSync(path)).toBe(true);
  db.$client.close();
});

test("接続するとマイグレーションが適用され、time_entries テーブルができている", () => {
  const db = createDb(":memory:");
  const table = db.get<{ name: string }>(
    sql`select name from sqlite_master where type = 'table' and name = 'time_entries'`,
  );

  expect(table).toEqual({ name: "time_entries" });
  db.$client.close();
});
