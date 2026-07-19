"use client";

import { Button } from "@flagbase/ui/components/button";
import { ConfirmDialog } from "@flagbase/ui/components/confirm-dialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { routes } from "@/lib/constants/routes";
import { useDeleteProject, useMyRole, useProject } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function ProjectHeader({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const router = useRouter();
  const { data: project } = useProject(organizationId, projectId);
  const deleteProject = useDeleteProject(organizationId);
  const role = useMyRole(organizationId);
  const canManage = role === "owner" || role === "admin";

  function onDelete() {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        toast.success("Project deleted.");
        router.push(routes.projects(organizationId));
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Link
          href={routes.projects(organizationId)}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project?.name ?? "…"}
        </h1>
      </div>
      {canManage ? (
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm">
              Delete project
            </Button>
          }
          title="Delete project?"
          description="This permanently deletes the project and all of its flags."
          confirmLabel="Delete"
          pending={deleteProject.isPending}
          onConfirm={onDelete}
        />
      ) : null}
    </div>
  );
}
