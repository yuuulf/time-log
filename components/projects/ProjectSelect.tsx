import type { ComponentProps } from "react";
import { messages } from "@/lib/messages";
import type { EntryProject } from "./types";

type Props = Omit<ComponentProps<"select">, "name" | "children"> & {
  /** 選択肢のプロジェクト（登録順） */
  projects: Pick<EntryProject, "id" | "name">[];
};

/**
 * 記録のプロジェクトの選択。先頭は「プロジェクトなし」（値は空）。
 * ラベルは使う側で id に結び付ける
 */
export function ProjectSelect({ projects, className = "", ...props }: Props) {
  return (
    <select
      name="projectId"
      className={`rounded-md border border-border bg-background px-3 py-2 text-foreground ${className}`}
      {...props}
    >
      <option value="">{messages.timeEntries.noProject}</option>
      {projects.map((project) => (
        <option key={project.id} value={String(project.id)}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
