import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects/repository";
import { ProjectDetail, ProjectNotFound } from "./ProjectDetail";

/** URL の id のプロジェクトを読んで詳細を表示する。リクエストごとに読むため、<Suspense> の中に置く */
export async function ProjectDetailView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const { id } = await params;
  const projectId = /^[1-9]\d*$/.test(id) ? Number(id) : null;
  const project =
    projectId === null ? undefined : getProject(getDb(), projectId);
  if (!project) return <ProjectNotFound />;
  const { name, color, clientName, description } = project;
  return (
    <ProjectDetail
      project={{ id: project.id, name, color, clientName, description }}
    />
  );
}
