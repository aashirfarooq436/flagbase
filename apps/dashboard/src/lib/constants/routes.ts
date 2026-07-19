/**
 * Every in-app path in one place — string constants and builders for dynamic segments — so a
 * route rename is a single edit and no path is hand-spelled at a call site.
 */
export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  onboarding: "/onboarding",
  organization: (orgId: string) => `/orgs/${orgId}`,
  members: (orgId: string) => `/orgs/${orgId}/members`,
  invitations: (orgId: string) => `/orgs/${orgId}/invitations`,
  settings: (orgId: string) => `/orgs/${orgId}/settings`,
} as const;
