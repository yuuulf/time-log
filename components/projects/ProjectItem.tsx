"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { messages } from "@/lib/messages";
import {
  archiveProjectAction,
  deleteProjectAction,
  unarchiveProjectAction,
} from "@/lib/projects/actions";
import { ProjectIcon } from "./ProjectIcon";
import type { ProjectData } from "./types";

const t = messages.projects;

/**
 * プロジェクト一覧の 1 行。色のアイコン・名前（詳細画面へのリンク）・クライアント名を出す。
 * 編集は詳細画面で行う。「その他の操作」のメニューには、アーカイブ（アーカイブ済みの一覧では解除）と、
 * 確認してからの削除を置く
 */
export function ProjectItem({
  project,
  archived = false,
}: {
  project: Pick<ProjectData, "id" | "name" | "color" | "clientName">;
  /** アーカイブ済みの一覧の行なら true。メニューが「アーカイブ解除」になる */
  archived?: boolean;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  /** 操作を呼び、失敗の理由を行の下に出す */
  const run = (
    action: (id: number) => Promise<{ errors?: { form?: string } }>,
  ) =>
    startTransition(async () => {
      const result = await action(project.id);
      setError(result.errors?.form);
    });

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    run(deleteProjectAction);
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
          disabled={pending}
          items={[
            // アーカイブ・解除は元に戻せるので確認しない
            archived
              ? {
                  label: t.actions.unarchive,
                  icon: ArchiveRestore,
                  onSelect: () => run(unarchiveProjectAction),
                }
              : {
                  label: t.actions.archive,
                  icon: Archive,
                  onSelect: () => run(archiveProjectAction),
                },
            {
              label: t.actions.delete,
              icon: Trash2,
              onSelect: handleDelete,
              variant: "danger",
            },
          ]}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
