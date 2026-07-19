"use client";

import type { AssignableRole } from "@flagbase/contracts";
import { Badge } from "@flagbase/ui/components/badge";
import { Button } from "@flagbase/ui/components/button";
import { ConfirmDialog } from "@flagbase/ui/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flagbase/ui/components/select";
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

import {
  useChangeMemberRole,
  useMembers,
  useMyRole,
  useRemoveMember,
  useUser,
} from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function MemberTable() {
  const { id: organizationId } = useCurrentOrganization();
  const { data: user } = useUser();
  const { data: members, isLoading } = useMembers(organizationId);
  const changeRole = useChangeMemberRole(organizationId);
  const removeMember = useRemoveMember(organizationId);
  const isOwner = useMyRole(organizationId) === "owner";

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (!members?.length) {
    return <p className="text-muted-foreground text-sm">No members yet.</p>;
  }

  function onChangeRole(memberId: string, role: AssignableRole) {
    changeRole.mutate(
      { memberId, body: { role } },
      {
        onSuccess: () => toast.success("Role updated."),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onRemove(memberId: string) {
    removeMember.mutate(memberId, {
      onSuccess: () => toast.success("Member removed."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isSelf = member.userId === user?.id;
          const editable = isOwner && member.role !== "owner" && !isSelf;
          return (
            <TableRow key={member.id}>
              <TableCell className="font-mono text-xs">
                {member.userId}
                {isSelf ? (
                  <Badge variant="secondary" className="ml-2">
                    You
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>
                {editable ? (
                  <Select
                    defaultValue={member.role}
                    onValueChange={(value) =>
                      onChangeRole(member.id, value as AssignableRole)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="member">member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant={member.role === "owner" ? "default" : "outline"}
                  >
                    {member.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editable ? (
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    }
                    title="Remove member?"
                    description="They will lose access to this organization."
                    confirmLabel="Remove"
                    pending={removeMember.isPending}
                    onConfirm={() => onRemove(member.id)}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
