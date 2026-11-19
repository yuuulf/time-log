import { Plus } from "lucide-react";
import { TextLink } from "@/components/ui/TextButton";
import { messages } from "@/lib/messages";
import { ProjectItem } from "./ProjectItem";
import type { ProjectData } from "./types";

const t = messages.projects;

/** プロジェクトのページの中身。登録した順の一覧と、登録画面へ移る「新規作成」を置く */
export function ProjectsContent({ projects }: { projects: ProjectData[] }) {
  return (
    <section aria-labelledby="project-list-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="project-list-heading"
          className="text-lg font-semibold text-foreground"
        >
          {t.listHeading}
        </h2>
        <TextLink href="/projects/new" icon={Plus}>
          {t.actions.add}
        </TextLink>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectItem project={project} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
