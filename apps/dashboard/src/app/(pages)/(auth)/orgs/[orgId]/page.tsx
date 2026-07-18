export default async function OrganizationOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="text-muted-foreground text-sm">
        Organization <span className="font-mono">{orgId}</span>. Members,
        projects, and flags land here next.
      </p>
    </div>
  );
}
