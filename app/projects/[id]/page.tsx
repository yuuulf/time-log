import { Suspense } from "react";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { messages } from "@/lib/messages";

/** プロジェクトの詳細。全項目を表示し、その場で編集する */
export default function ProjectDetailPage({
  params,
}: PageProps<"/projects/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-6">
      {/* params はリクエストごとに決まるので、<Suspense> の中で待つ */}
      <Suspense
        fallback={
          <p className="text-sm text-muted">
            {messages.projects.detail.loading}
          </p>
        }
      >
        <ProjectDetailView params={params} />
      </Suspense>
    </main>
  );
}
