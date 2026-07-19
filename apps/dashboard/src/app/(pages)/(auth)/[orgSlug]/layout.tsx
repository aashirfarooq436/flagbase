import { composition, ensureConnection } from "@flagbase/composition";

import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { sessionManager } from "@/lib/auth/session-manager";
import { routes } from "@/lib/constants/routes";
import { serverEnv } from "@/lib/env";
import { OrgProvider } from "@/lib/providers";

/**
 * The authenticated app shell for an organization, addressed by its URL slug. Resolves the slug
 * to an organization, then gates on membership (a signed-in user who isn't a member is bounced
 * to the root, which re-routes them). The resolved org is provided via `OrgProvider` so nested
 * client components have both its id (for the API) and its slug (for links).
 */
export default async function OrgLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}>) {
  const { orgSlug } = await params;

  const session = await sessionManager.resolve();
  if (!session) {
    redirect(routes.signIn);
  }

  await ensureConnection(serverEnv().MONGODB_URI);

  const organization = await composition.organization.getBySlug
    .execute({ slug: orgSlug })
    .catch(() => null);
  if (!organization) {
    redirect(routes.home);
  }

  const membership = await composition.member.getMembership.execute({
    organizationId: organization.id,
    userId: session.userId,
  });
  if (!membership) {
    redirect(routes.home);
  }

  return (
    <OrgProvider
      organization={{
        id: organization.id,
        slug: organization.slug.value,
        name: organization.name,
      }}
    >
      <div className="flex h-screen flex-col">
        <AppTopbar />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}
