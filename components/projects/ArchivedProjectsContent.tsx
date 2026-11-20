import { messages } from "@/lib/messages";
import { ProjectItem } from "./ProjectItem";
import type { ProjectData } from "./types";

const t = messages.projects.archived;

/** アーカイブしたプロジェクトの一覧。行のメニューは「アーカイブ解除」と「削除」 */
export function ArchivedProjectsContent({
  projects,
}: {
  projects: Pick<ProjectData, "id" | "name" | "color" | "clientName">[];
}) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted">{t.empty}</p>;
  }
  return (
    <ul
      aria-label={t.title}
      className="divide-y divide-border border-t border-border"
    >
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectItem project={project} archived />
        </li>
      ))}
    </ul>
  );
}
