import { asc, count, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { projects, timeEntries, type Project } from "@/lib/db/schema";
import type { ProjectInput } from "./validation";

/** プロジェクトを登録した順に返す */
export function listProjects(db: Db): Project[] {
  return db.select().from(projects).orderBy(asc(projects.id)).all();
}

/** プロジェクトを 1 件返す。なければ undefined */
export function getProject(db: Db, id: number): Project | undefined {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

/** 名前が一致するプロジェクトを返す。なければ undefined */
export function findProjectByName(db: Db, name: string): Project | undefined {
  return db.select().from(projects).where(eq(projects.name, name)).get();
}

/** プロジェクトを登録する。入力チェック済みの値を渡す */
export function createProject(db: Db, input: ProjectInput, now: Date): Project {
  return db
    .insert(projects)
    .values({ ...input, createdAt: now, updatedAt: now })
    .returning()
    .get();
}

/** プロジェクトを編集する。入力チェック済みの値を渡す。存在しなければ undefined を返す */
export function updateProject(
  db: Db,
  id: number,
  input: ProjectInput,
  now: Date,
): Project | undefined {
  return db
    .update(projects)
    .set({ ...input, updatedAt: now })
    .where(eq(projects.id, id))
    .returning()
    .get();
}

/**
 * プロジェクトを削除する。記録が 1 件でも紐づいていれば削除せず "in-use" を返す
 * （DB の外部キーでも削除は禁止している）
 */
export function deleteProject(
  db: Db,
  id: number,
): "deleted" | "in-use" | "not-found" {
  return db.transaction((tx) => {
    const linked = tx
      .select({ value: count() })
      .from(timeEntries)
      .where(eq(timeEntries.projectId, id))
      .get();
    if ((linked?.value ?? 0) > 0) return "in-use";
    const deleted = tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id })
      .get();
    return deleted ? "deleted" : "not-found";
  });
}
