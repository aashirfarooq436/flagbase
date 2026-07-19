import { composition, ensureConnection } from "@flagbase/composition";

import { redirect } from "next/navigation";

import { sessionManager } from "@/lib/auth/session-manager";
import { routes } from "@/lib/constants/routes";
import { serverEnv } from "@/lib/env";

/**
 * The entry point. Routes by session state: no session → sign in; signed in with no org →
 * onboarding; otherwise → the first organization's dashboard. Lives outside `(pages)` because
 * it only redirects (no UI, no client providers needed).
 */
export default async function RootPage() {
  const session = await sessionManager.resolve();
  if (!session) {
    redirect(routes.signIn);
  }

  await ensureConnection(serverEnv().MONGODB_URI);
  const organizations = await composition.organization.listMine.execute({
    userId: session.userId,
  });

  const [first] = organizations;
  if (!first) {
    redirect(routes.onboarding);
  }
  redirect(routes.organization(first.slug.value));
}
