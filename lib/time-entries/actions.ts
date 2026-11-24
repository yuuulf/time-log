"use server";

import { refresh } from "next/cache";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/messages";
import { getProject } from "@/lib/projects/repository";
import { parseProjectId } from "@/lib/projects/validation";
import type { Db } from "@/lib/db/client";
import {
  createEntry,
  deleteEntry,
  getEntry,
  startEntry,
  stopRunningEntry,
  updateEntry,
} from "./repository";
import {
  validateCreateInput,
  validateStartInput,
  validateUpdateInput,
  type FieldErrors,
} from "./validation";

/** フォームに返す結果。errors があれば保存していない */
export type ActionState = { ok?: boolean; errors?: FieldErrors };

const notFound: ActionState = {
  errors: { form: messages.timeEntries.errors.notFound },
};

/**
 * フォームで選んだプロジェクトを読む。空ならプロジェクトなし（null）。
 * 値が不正、またはプロジェクトが削除されていれば undefined
 */
function readProjectId(db: Db, value: FormDataEntryValue | null) {
  const parsed = parseProjectId(value);
  if (!parsed.ok) return undefined;
  if (parsed.projectId !== null && !getProject(db, parsed.projectId)) {
    return undefined;
  }
  return parsed.projectId;
}

const projectNotFound: ActionState = {
  errors: { projectId: messages.projects.errors.notFound },
};

/** クライアントから渡された id を確かめる */
function isValidId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

/** 記録を開始する。記録中の記録は同じ時刻で終了する。プロジェクトは選んでいなければなし */
export async function startEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = validateStartInput({ taskName: formData.get("taskName") });
  if (!result.ok) return { errors: result.errors };
  const db = getDb();
  const projectId = readProjectId(db, formData.get("projectId"));
  if (projectId === undefined) return projectNotFound;

  startEntry(db, {
    taskName: result.value.taskName,
    projectId,
    now: new Date(),
  });
  refresh();
  return { ok: true };
}

/** 終了済みの記録を追加する（タイムラインの入力欄から）。記録中の記録は変えない */
export async function createEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const now = new Date();
  const result = validateCreateInput(
    {
      taskName: formData.get("taskName"),
      startedAt: formData.get("startedAt"),
      endedAt: formData.get("endedAt"),
    },
    now,
  );
  if (!result.ok) return { errors: result.errors };
  const db = getDb();
  const projectId = readProjectId(db, formData.get("projectId"));
  if (projectId === undefined) return projectNotFound;

  createEntry(db, { ...result.value, projectId }, now);
  refresh();
  return { ok: true };
}

/** 記録中の記録を終了する */
export async function stopEntryAction(): Promise<void> {
  stopRunningEntry(getDb(), new Date());
  refresh();
}

/** 記録を修正する。`updateEntryAction.bind(null, id)` の形で使う */
export async function updateEntryAction(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isValidId(id)) return notFound;
  const db = getDb();
  const entry = getEntry(db, id);
  if (!entry) return notFound;

  const now = new Date();
  const result = validateUpdateInput(
    {
      taskName: formData.get("taskName"),
      startedAt: formData.get("startedAt"),
      endedAt: formData.get("endedAt"),
    },
    { isRunning: entry.endedAt === null, now },
  );
  if (!result.ok) return { errors: result.errors };
  const projectId = readProjectId(db, formData.get("projectId"));
  if (projectId === undefined) return projectNotFound;

  if (!updateEntry(db, id, { ...result.value, projectId }, now)) {
    return notFound;
  }
  refresh();
  return { ok: true };
}

/** 記録を削除する */
export async function deleteEntryAction(id: number): Promise<ActionState> {
  if (!isValidId(id) || !deleteEntry(getDb(), id)) return notFound;
  refresh();
  return { ok: true };
}
