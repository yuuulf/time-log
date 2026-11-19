import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects/repository";
import { ArchivedProjectsContent } from "./ArchivedProjectsContent";

/** アーカイブしたプロジェクトを読んで表示する。リクエストごとに読むため、<Suspense> の中に置く */
export async function ArchivedProjectsView() {
  // better-sqlite3 は同期 API のため、プリレンダーではなくリクエスト時に読むよう明示する
  await connection();
  const projects = listProjects(getDb(), { archived: true }).map(
    ({ id, name, color, clientName }) => ({ id, name, color, clientName }),
  );
  return <ArchivedProjectsContent projects={projects} />;
}
