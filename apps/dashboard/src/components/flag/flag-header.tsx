"use client";

import { Badge } from "@flagbase/ui/components/badge";
import { Button } from "@flagbase/ui/components/button";
import { ConfirmDialog } from "@flagbase/ui/components/confirm-dialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { routes } from "@/lib/constants/routes";
import {
  useDeleteFlag,
  useFlag,
  useMyRole,
  useSetFlagEnabled,
} from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function FlagHeader({
  projectId,
  flagId,
}: {
  projectId: string;
  flagId: string;
}) {
  const router = useRouter();
  const { id: organizationId, slug } = useCurrentOrganization();
  const { data: flag } = useFlag(organizationId, projectId, flagId);
  const setEnabled = useSetFlagEnabled(organizationId, projectId);
  const deleteFlag = useDeleteFlag(organizationId, projectId);
  const role = useMyRole(organizationId);
  const canManage = role === "owner" || role === "admin";

  function onToggle() {
    if (!flag) {
      return;
    }
    setEnabled.mutate(
      { flagId, body: { enabled: !flag.enabled } },
      {
        onSuccess: () =>
          toast.success(flag.enabled ? "Flag disabled." : "Flag enabled."),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onDelete() {
    deleteFlag.mutate(flagId, {
      onSuccess: () => {
        toast.success("Flag deleted.");
        router.push(routes.project(slug, projectId));
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="space-y-3">
      <Link
        href={routes.project(slug, projectId)}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Project
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {flag?.key ?? "…"}
          </h1>
          {flag?.description ? (
            <p className="text-muted-foreground text-sm">{flag.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={flag?.enabled ? "default" : "outline"}>
            {flag?.enabled ? "Enabled" : "Disabled"}
          </Badge>
          {canManage && flag ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              disabled={setEnabled.isPending}
            >
              {flag.enabled ? "Disable" : "Enable"}
            </Button>
          ) : null}
          {canManage ? (
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm">
                  Delete
                </Button>
              }
              title="Delete flag?"
              description="This permanently deletes the flag."
              confirmLabel="Delete"
              pending={deleteFlag.isPending}
              onConfirm={onDelete}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
