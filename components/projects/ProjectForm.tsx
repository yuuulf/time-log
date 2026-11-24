"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { TextButton } from "@/components/ui/TextButton";
import { messages } from "@/lib/messages";
import {
  createProjectAction,
  type ProjectActionState,
} from "@/lib/projects/actions";
import { DEFAULT_PROJECT_COLOR } from "@/lib/projects/colors";
import {
  BackLink,
  ProjectFields,
  type ProjectFieldValues,
} from "./ProjectFields";

const t = messages.projects;

const emptyValues: ProjectFieldValues = {
  name: "",
  color: DEFAULT_PROJECT_COLOR,
  clientName: "",
  description: "",
};

/**
 * プロジェクトの登録画面のフォーム。詳細画面と同じ並びで、「作成」で作成して一覧に戻る。
 * 入力エラーのときは作成せず、入力した値を残す
 */
export function ProjectForm() {
  const id = useId();
  const router = useRouter();
  const [values, setValues] = useState(emptyValues);
  const [state, action, saving] = useActionState(
    async (prev: ProjectActionState, formData: FormData) => {
      const result = await createProjectAction(prev, formData);
      // 作成で一覧は読み直されているので、そのまま一覧に戻る
      if (result.ok) router.push("/projects");
      return result;
    },
    {},
  );
  const errors = state.errors ?? {};

  return (
    // <form action> は送信後にフォームをリセットし、選んだ色（ラジオボタン）が先頭に戻ってしまう。
    // 入力エラーのときに値を残すため、送信は onSubmit で受けて action を呼ぶ
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <BackLink />
        <h1 className="text-xl font-bold text-foreground">{t.formHeading}</h1>
      </div>
      <ProjectFields
        idPrefix={id}
        values={values}
        errors={errors}
        onChange={(field, value) => setValues({ ...values, [field]: value })}
        onColorChange={(color) => setValues({ ...values, color })}
        named
      />
      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}
      {/* 作成ボタンは各項目の下の右端に置く */}
      <div className="flex justify-end">
        <TextButton type="submit" variant="primary" disabled={saving}>
          {t.actions.createSubmit}
        </TextButton>
      </div>
    </form>
  );
}
