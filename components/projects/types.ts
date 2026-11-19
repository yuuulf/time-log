import type { Project } from "@/lib/db/schema";

/** 画面に渡すプロジェクト */
export type ProjectData = Pick<
  Project,
  "id" | "name" | "color" | "clientName" | "description"
>;

/** 記録に付けて表示するプロジェクト */
export type { EntryProject } from "@/lib/time-entries/repository";
