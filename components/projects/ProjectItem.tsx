"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { messages } from "@/lib/messages";
import { deleteProjectAction } from "@/lib/projects/actions";
import { ProjectForm } from "./ProjectForm";
import { ProjectIcon } from "./ProjectIcon";
import type { ProjectData } from "./types";

const t = messages.projects;

/** プロジェクト 1 件の表示。編集ボタンでその場にフォームを開き、削除ボタンは確認してから削除する */
export function ProjectItem({ project }: { project: ProjectData }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();

  if (editing) {
    return (
      <div className="py-3">
        <ProjectForm project={project} onClose={() => setEditing(false)} />
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm(t.confirmDelete)) return;
    startDeleting(async () => {
      const result = await deleteProjectAction(project.id);
      setDeleteError(result.errors?.form);
    });
  };

  return (
    <div className="space-y-1 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-1.5">
          <ProjectIcon name={project.name} color={project.color} decorative />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium break-words text-foreground">
            {project.name}
          </p>
          {project.clientName && (
            <p className="text-sm break-words text-muted">
              {project.clientName}
            </p>
          )}
          {project.description && (
            <p className="text-sm break-words whitespace-pre-wrap text-muted">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <IconButton
            icon={Pencil}
            label={t.actions.edit}
            onClick={() => setEditing(true)}
          />
          <IconButton
            variant="danger"
            icon={Trash2}
            label={t.actions.delete}
            onClick={handleDelete}
            disabled={deleting}
          />
        </div>
      </div>
      {deleteError && (
        <p role="alert" className="text-sm text-danger">
          {deleteError}
        </p>
      )}
    </div>
  );
}
