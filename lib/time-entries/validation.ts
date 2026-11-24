import { messages } from "@/lib/messages";
import { parseDateTimeLocalValue } from "@/lib/time";

/** タスク名の最大文字数 */
export const TASK_NAME_MAX_LENGTH = 200;

const errors = messages.timeEntries.errors;

export type FieldErrors = Partial<
  Record<"taskName" | "projectId" | "startedAt" | "endedAt" | "form", string>
>;

export type ValidationResult<T> =
  { ok: true; value: T } | { ok: false; errors: FieldErrors };

/** FormData などから受け取る値（未入力なら null） */
type RawValue = FormDataEntryValue | null | undefined;

function asText(value: RawValue): string {
  return typeof value === "string" ? value : "";
}

/** タスク名の前後の空白を除き、長さを確かめる。エラーなら文言を返す */
function checkTaskName(value: RawValue): { taskName: string; error?: string } {
  const taskName = asText(value).trim();
  // 絵文字などを 1 文字と数えるため、コードポイント単位で数える
  if ([...taskName].length > TASK_NAME_MAX_LENGTH) {
    return { taskName, error: errors.taskNameTooLong };
  }
  return { taskName };
}

/** datetime-local の値を日時にし、未来でないことを確かめる */
function checkTime(
  value: RawValue,
  now: Date,
): { date?: Date; error?: string } {
  const text = asText(value).trim();
  if (text === "") return { error: errors.timeRequired };
  const date = parseDateTimeLocalValue(text);
  if (!date) return { error: errors.timeInvalid };
  if (date.getTime() > now.getTime()) return { error: errors.timeInFuture };
  return { date };
}

/** 記録の開始の入力をチェックする */
export function validateStartInput(input: {
  taskName: RawValue;
}): ValidationResult<{ taskName: string }> {
  const { taskName, error } = checkTaskName(input.taskName);
  if (error) return { ok: false, errors: { taskName: error } };
  return { ok: true, value: { taskName } };
}

/**
 * 記録の修正の入力をチェックする。
 * 記録中の記録では終了時刻を受け付けず、終了した記録では終了時刻を必須にする。
 */
export function validateUpdateInput(
  input: { taskName: RawValue; startedAt: RawValue; endedAt: RawValue },
  { isRunning, now }: { isRunning: boolean; now: Date },
): ValidationResult<{ taskName: string; startedAt: Date; endedAt?: Date }> {
  const fieldErrors: FieldErrors = {};

  const taskName = checkTaskName(input.taskName);
  if (taskName.error) fieldErrors.taskName = taskName.error;

  const started = checkTime(input.startedAt, now);
  if (started.error) fieldErrors.startedAt = started.error;

  let endedAt: Date | undefined;
  if (isRunning) {
    if (asText(input.endedAt).trim() !== "") {
      fieldErrors.endedAt = errors.endWhileRunning;
    }
  } else {
    const ended = checkTime(input.endedAt, now);
    if (ended.error) {
      fieldErrors.endedAt = ended.error;
    } else if (
      started.date &&
      ended.date &&
      ended.date.getTime() <= started.date.getTime()
    ) {
      fieldErrors.endedAt = errors.endBeforeStart;
    }
    endedAt = ended.date;
  }

  if (Object.keys(fieldErrors).length > 0 || !started.date) {
    return { ok: false, errors: fieldErrors };
  }
  return {
    ok: true,
    value: { taskName: taskName.taskName, startedAt: started.date, endedAt },
  };
}

/** 終了済みの記録の追加の入力をチェックする。確かめ方は終了した記録の修正と同じ */
export function validateCreateInput(
  input: { taskName: RawValue; startedAt: RawValue; endedAt: RawValue },
  now: Date,
): ValidationResult<{ taskName: string; startedAt: Date; endedAt: Date }> {
  const result = validateUpdateInput(input, { isRunning: false, now });
  if (!result.ok) return result;
  const { taskName, startedAt, endedAt } = result.value;
  // 終了した記録として確かめたので、endedAt は必ずある
  return { ok: true, value: { taskName, startedAt, endedAt: endedAt! } };
}
