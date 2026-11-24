import { Suspense } from "react";
import { ArchivedProjectsView } from "@/components/projects/ArchivedProjectsView";
import { BackLink } from "@/components/projects/ProjectFields";
import { messages } from "@/lib/messages";

const t = messages.projects.archived;

/** アーカイブ済みのプロジェクト。アーカイブの解除と削除ができる */
export default function ArchivedProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-6">
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-xl font-bold text-foreground">{t.title}</h1>
      </div>
      <div className="mt-4">
        <Suspense fallback={<p className="text-sm text-muted">{t.loading}</p>}>
          <ArchivedProjectsView />
        </Suspense>
      </div>
    </main>
  );
}
