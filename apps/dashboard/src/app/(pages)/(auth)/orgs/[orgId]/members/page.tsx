import { MemberTable } from "@/components/member/member-table";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          People in this organization.
        </p>
      </div>
      <MemberTable organizationId={orgId} />
    </div>
  );
}
