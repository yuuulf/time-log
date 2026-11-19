"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { messages } from "@/lib/messages";
import { deleteProjectAction } from "@/lib/projects/actions";
import { ProjectIcon } from "./ProjectIcon";
import type { ProjectData } from "./types";

const t = messages.projects;

/**
 * プロジェクト一覧の 1 行。色のアイコン・名前（詳細画面へのリンク）・クライアント名を出す。
 * 編集は詳細画面で行い、削除は「その他の操作」のメニューから確認してから行う
 */
export function ProjectItem({
  project,
}: {
  project: Pick<ProjectData, "id" | "name" | "color" | "clientName">;
}) {
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    startDeleting(async () => {
      const result = await deleteProjectAction(project.id);
      setDeleteError(result.errors?.form);
    });
  };

  return (
    <div className="space-y-1 py-2">
      <div className="flex items-center gap-3">
        {/* 名前を文字で出すので、アイコンは読み上げの対象から外す */}
        <ProjectIcon name={project.name} color={project.color} decorative />
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
          <Link
            href={`/projects/${project.id}`}
            className="min-w-0 font-medium break-words text-foreground underline-offset-4 hover:underline"
          >
            {project.name}
          </Link>
          {project.clientName && (
            <p className="min-w-0 text-sm break-words text-muted">
              {project.clientName}
            </p>
          )}
        </div>
        <DropdownMenu
          icon={MoreVertical}
          label={t.actions.more}
          disabled={deleting}
          items={[
            {
              label: t.actions.delete,
              icon: Trash2,
              onSelect: handleDelete,
              variant: "danger",
            },
          ]}
        />
      </div>
      {deleteError && (
        <p role="alert" className="text-sm text-danger">
          {deleteError}
        </p>
      )}
    </div>
  );
}
