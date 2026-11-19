import { messages } from "@/lib/messages";
import { ProjectForm } from "./ProjectForm";
import { ProjectItem } from "./ProjectItem";
import type { ProjectData } from "./types";

const t = messages.projects;

/** プロジェクトのページの中身。登録欄と、登録した順の一覧を並べる */
export function ProjectsContent({ projects }: { projects: ProjectData[] }) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="project-form-heading" className="space-y-3">
        <h2
          id="project-form-heading"
          className="text-lg font-semibold text-foreground"
        >
          {t.formHeading}
        </h2>
        <ProjectForm />
      </section>
      <section aria-labelledby="project-list-heading" className="space-y-2">
        <h2
          id="project-list-heading"
          className="text-lg font-semibold text-foreground"
        >
          {t.listHeading}
        </h2>
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
    </div>
  );
}
