"use server";

import { refresh } from "next/cache";
import { getDb } from "@/lib/db";
import { messages } from "@/lib/messages";
import {
  deleteEntry,
  getEntry,
  startEntry,
  stopRunningEntry,
  updateEntry,
} from "./repository";
import {
  validateStartInput,
  validateUpdateInput,
  type FieldErrors,
} from "./validation";

/** フォームに返す結果。errors があれば保存していない */
export type ActionState = { ok?: boolean; errors?: FieldErrors };

const notFound: ActionState = {
  errors: { form: messages.timeEntries.errors.notFound },
};

/** クライアントから渡された id を確かめる */
function isValidId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

/** 記録を開始する。記録中の記録は同じ時刻で終了する */
export async function startEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = validateStartInput({ taskName: formData.get("taskName") });
  if (!result.ok) return { errors: result.errors };

  startEntry(getDb(), { taskName: result.value.taskName, now: new Date() });
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

  if (!updateEntry(db, id, result.value, now)) return notFound;
  refresh();
  return { ok: true };
}

/** 記録を削除する */
export async function deleteEntryAction(id: number): Promise<ActionState> {
  if (!isValidId(id) || !deleteEntry(getDb(), id)) return notFound;
  refresh();
  return { ok: true };
}
