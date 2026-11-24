import { ProjectForm } from "@/components/projects/ProjectForm";

/** プロジェクトの登録画面。詳細画面と同じ並びで入力し、「作成」で作成する */
export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 px-4 py-6">
      <ProjectForm />
    </main>
  );
}
