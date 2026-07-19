import { InvitationTable } from "@/components/invitation/invitation-table";
import { InviteMemberDialog } from "@/components/invitation/invite-member-dialog";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground text-sm">
            Pending and past invitations.
          </p>
        </div>
        <InviteMemberDialog organizationId={orgId} />
      </div>
      <InvitationTable organizationId={orgId} />
    </div>
  );
}
