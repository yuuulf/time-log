import type { Metadata } from "next";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { messages } from "@/lib/messages";

export const metadata: Metadata = {
  title: messages.projects.formHeading,
};

/** プロジェクトの登録画面。詳細画面と同じ並びで入力し、「プロジェクトを作成」で作成する */
export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-12">
      <ProjectForm />
    </main>
  );
}
