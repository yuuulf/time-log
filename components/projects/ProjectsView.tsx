import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import { ProjectsContent } from "./ProjectsContent";

/** プロジェクトを読んで表示する。リクエストごとに読むため、<Suspense> の中に置く */
export async function ProjectsView() {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const projects = listProjects(getDb()).map(
    ({ id, name, color, clientName, description }) => ({
      id,
      name,
      color,
      clientName,
      description,
    }),
  );
  return <ProjectsContent projects={projects} />;
}
