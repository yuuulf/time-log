"use server";

import { refresh } from "next/cache";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/messages";
import {
  createProject,
  deleteProject,
  findProjectByName,
  getProject,
  updateProject,
} from "./repository";
import { validateProjectInput, type ProjectFieldErrors } from "./validation";

/** フォームに返す結果。errors があれば保存していない */
export type ProjectActionState = { ok?: boolean; errors?: ProjectFieldErrors };

const errors = messages.projects.errors;
const notFound: ProjectActionState = { errors: { form: errors.notFound } };
const nameTaken: ProjectActionState = { errors: { name: errors.nameTaken } };

/** クライアントから渡された id を確かめる */
function isValidId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

function readInput(formData: FormData) {
  return validateProjectInput({
    name: formData.get("name"),
    color: formData.get("color"),
    clientName: formData.get("clientName"),
    description: formData.get("description"),
  });
}

/** 名前の一意インデックスに当たったか（確かめてから保存するまでの間に同じ名前が登録された場合） */
function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE") {
      return true;
    }
  }
  return false;
}

/**
 * 保存する。write は保存できたら true、対象が見つからなければ false を返す。
 * 名前の重複は一意インデックスでも守り、同じ文言を返す
 */
function save(write: () => boolean): ProjectActionState {
  try {
    if (!write()) return notFound;
  } catch (error) {
    if (isUniqueViolation(error)) return nameTaken;
    throw error;
  }
  refresh();
  return { ok: true };
}

/** プロジェクトを登録する */
export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const result = readInput(formData);
  if (!result.ok) return { errors: result.errors };
  const db = getDb();
  if (findProjectByName(db, result.value.name)) return nameTaken;
  return save(() => {
    createProject(db, result.value, new Date());
    return true;
  });
}

/** プロジェクトを編集する。`updateProjectAction.bind(null, id)` の形で使う */
export async function updateProjectAction(
  id: number,
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  if (!isValidId(id)) return notFound;
  const db = getDb();
  if (!getProject(db, id)) return notFound;
  const result = readInput(formData);
  if (!result.ok) return { errors: result.errors };
  const sameName = findProjectByName(db, result.value.name);
  if (sameName && sameName.id !== id) return nameTaken;
  return save(
    () => updateProject(db, id, result.value, new Date()) !== undefined,
  );
}

/** プロジェクトを削除する。記録が紐づいていれば削除しない */
export async function deleteProjectAction(
  id: number,
): Promise<ProjectActionState> {
  if (!isValidId(id)) return notFound;
  const result = deleteProject(getDb(), id);
  if (result === "not-found") return notFound;
  if (result === "in-use") return { errors: { form: errors.inUse } };
  refresh();
  return { ok: true };
}
