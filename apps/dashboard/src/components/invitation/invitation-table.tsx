"use client";

import type { InvitationStatusDto } from "@flagbase/contracts";
import { Badge } from "@flagbase/ui/components/badge";
import { Button } from "@flagbase/ui/components/button";
import { ConfirmDialog } from "@flagbase/ui/components/confirm-dialog";
import { Skeleton } from "@flagbase/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flagbase/ui/components/table";

import { toast } from "sonner";

import { useInvitations, useMyRole, useRevokeInvitation } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

const statusVariant: Record<
  InvitationStatusDto,
  "default" | "secondary" | "outline"
> = {
  pending: "secondary",
  accepted: "default",
  revoked: "outline",
  rejected: "outline",
};

export function InvitationTable({
  organizationId,
}: {
  organizationId: string;
}) {
  const { data: invitations, isLoading } = useInvitations(organizationId);
  const revoke = useRevokeInvitation(organizationId);
  const isOwner = useMyRole(organizationId) === "owner";

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (!invitations?.length) {
    return <p className="text-muted-foreground text-sm">No invitations yet.</p>;
  }

  function onRevoke(invitationId: string) {
    revoke.mutate(invitationId, {
      onSuccess: () => toast.success("Invitation revoked."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell>{invitation.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{invitation.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[invitation.status]}>
                {invitation.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {isOwner && invitation.status === "pending" ? (
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm">
                      Revoke
                    </Button>
                  }
                  title="Revoke invitation?"
                  description="The link in the email will stop working."
                  confirmLabel="Revoke"
                  pending={revoke.isPending}
                  onConfirm={() => onRevoke(invitation.id)}
                />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
