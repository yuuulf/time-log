// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { afterEach, expect, test } from "vitest";
import { createDb } from "./client";
import { projects, timeEntries } from "./schema";

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

test("接続するとマイグレーションが適用され、projects テーブルができている", () => {
  const db = createDb(":memory:");
  const table = db.get<{ name: string }>(
    sql`select name from sqlite_master where type = 'table' and name = 'projects'`,
  );

  expect(table).toEqual({ name: "projects" });
  db.$client.close();
});

test("記録が紐づいたプロジェクトは DB でも削除できない", () => {
  const db = createDb(":memory:");
  const now = new Date("2026-11-19T09:00:00+09:00");
  const project = db
    .insert(projects)
    .values({
      name: "社内ツール",
      color: "teal",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();
  db.insert(timeEntries)
    .values({
      taskName: "資料作成",
      projectId: project.id,
      startedAt: now,
      endedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  expect(() =>
    db.delete(projects).where(eq(projects.id, project.id)).run(),
  ).toThrow(/FOREIGN KEY/);
  db.$client.close();
});
