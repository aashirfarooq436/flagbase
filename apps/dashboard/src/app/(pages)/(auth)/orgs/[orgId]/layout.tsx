import { composition, ensureConnection } from "@flagbase/composition";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { sessionManager } from "@/lib/auth/session-manager";
import { routes } from "@/lib/constants/routes";
import { serverEnv } from "@/lib/env";

/**
 * The authenticated app shell for an organization. Also the tenant gate: a signed-in user who
 * is not a member of this org is bounced to the root (which re-routes them). The `withAuth`
 * parent layout already ensured a session; this adds the per-org membership check.
 */
export default async function OrgLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}>) {
  const { orgId } = await params;

  const session = await sessionManager.resolve();
  if (!session) {
    redirect(routes.signIn);
  }

  await ensureConnection(serverEnv().MONGODB_URI);
  const membership = await composition.member.getMembership.execute({
    organizationId: orgId,
    userId: session.userId,
  });
  if (!membership) {
    redirect(routes.home);
  }

  return (
    <div className="flex h-screen flex-col">
      <AppTopbar orgId={orgId} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar orgId={orgId} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
