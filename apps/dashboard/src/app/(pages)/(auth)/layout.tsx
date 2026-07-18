import { redirect } from "next/navigation";

import { sessionManager } from "@/lib/auth/session-manager";
import { routes } from "@/lib/constants/routes";

/**
 * The gate for the authenticated area: no valid session → redirect to sign-in. Runs on the
 * server before any child renders. Sub-routes bring their own chrome (onboarding is centered;
 * orgs/[orgId] has the app shell).
 */
export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await sessionManager.resolve();
  if (!session) {
    redirect(routes.signIn);
  }
  return <>{children}</>;
}
