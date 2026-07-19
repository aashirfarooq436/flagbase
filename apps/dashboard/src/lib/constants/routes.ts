/**
 * Every in-app path in one place — string constants and builders for dynamic segments — so a
 * route rename is a single edit and no path is hand-spelled at a call site.
 */
export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  onboarding: "/onboarding",
  account: "/account",
  acceptInvitation: "/invitations/accept",
  // Organizations live at the URL root, addressed by their slug (`/acme-inc/members`).
  organization: (slug: string) => `/${slug}`,
  members: (slug: string) => `/${slug}/members`,
  invitations: (slug: string) => `/${slug}/invitations`,
  settings: (slug: string) => `/${slug}/settings`,
  projects: (slug: string) => `/${slug}/projects`,
  project: (slug: string, projectId: string) =>
    `/${slug}/projects/${projectId}`,
  flag: (slug: string, projectId: string, flagId: string) =>
    `/${slug}/projects/${projectId}/flags/${flagId}`,
} as const;

/**
 * Slugs an org can't take because a static root route already owns that path (Next resolves
 * static routes before the dynamic `[orgSlug]`, so these would be unreachable as an org). The
 * create-organization route rejects a name that slugifies to one of these.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "sign-in",
  "sign-up",
  "onboarding",
  "account",
  "invitations",
  "api",
]);
