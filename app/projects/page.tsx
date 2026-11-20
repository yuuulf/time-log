import { Suspense } from "react";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { messages } from "@/lib/messages";

/** プロジェクト。一覧と登録・編集・削除 */
export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">
        {messages.projects.title}
      </h1>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-sm text-muted">{messages.projects.loading}</p>
          }
        >
          <ProjectsView />
        </Suspense>
      </div>
    </main>
  );
}
