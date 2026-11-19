import { messages } from "@/lib/messages";
import { isProjectColor, type ProjectColor } from "./colors";

/** プロジェクト名の最大文字数 */
export const PROJECT_NAME_MAX_LENGTH = 100;
/** クライアント名の最大文字数 */
export const CLIENT_NAME_MAX_LENGTH = 100;
/** 説明の最大文字数 */
export const DESCRIPTION_MAX_LENGTH = 1000;

const errors = messages.projects.errors;

export type ProjectFieldErrors = Partial<
  Record<"name" | "color" | "clientName" | "description" | "form", string>
>;

export type ProjectInput = {
  name: string;
  color: ProjectColor;
  clientName: string;
  description: string;
};

export type ProjectValidationResult =
  { ok: true; value: ProjectInput } | { ok: false; errors: ProjectFieldErrors };

/** FormData などから受け取る値（未入力なら null） */
type RawValue = FormDataEntryValue | null | undefined;

function asText(value: RawValue): string {
  return typeof value === "string" ? value.trim() : "";
}

/** 絵文字などを 1 文字と数えるため、コードポイント単位で数える */
function length(text: string): number {
  return [...text].length;
}

/** プロジェクトの登録・編集の入力をチェックする。名前・クライアント名・説明の前後の空白は除く */
export function validateProjectInput(input: {
  name: RawValue;
  color: RawValue;
  clientName: RawValue;
  description: RawValue;
}): ProjectValidationResult {
  const fieldErrors: ProjectFieldErrors = {};

  const name = asText(input.name);
  if (name === "") fieldErrors.name = errors.nameRequired;
  else if (length(name) > PROJECT_NAME_MAX_LENGTH)
    fieldErrors.name = errors.nameTooLong;

  const color = input.color;
  if (!isProjectColor(color)) fieldErrors.color = errors.colorRequired;

  const clientName = asText(input.clientName);
  if (length(clientName) > CLIENT_NAME_MAX_LENGTH)
    fieldErrors.clientName = errors.clientNameTooLong;

  const description = asText(input.description);
  if (length(description) > DESCRIPTION_MAX_LENGTH)
    fieldErrors.description = errors.descriptionTooLong;

  if (Object.keys(fieldErrors).length > 0 || !isProjectColor(color)) {
    return { ok: false, errors: fieldErrors };
  }
  return { ok: true, value: { name, color, clientName, description } };
}

/**
 * 記録のフォームで選んだプロジェクトの値を読む。
 * 空なら「プロジェクトなし」（null）、正の整数ならその id、それ以外は不正
 */
export function parseProjectId(
  value: RawValue,
): { ok: true; projectId: number | null } | { ok: false } {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return { ok: true, projectId: null };
  if (!/^[1-9]\d*$/.test(text)) return { ok: false };
  const projectId = Number(text);
  if (!Number.isSafeInteger(projectId)) return { ok: false };
  return { ok: true, projectId };
}
