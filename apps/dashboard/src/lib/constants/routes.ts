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
  organization: (orgId: string) => `/orgs/${orgId}`,
  members: (orgId: string) => `/orgs/${orgId}/members`,
  invitations: (orgId: string) => `/orgs/${orgId}/invitations`,
  settings: (orgId: string) => `/orgs/${orgId}/settings`,
  projects: (orgId: string) => `/orgs/${orgId}/projects`,
  project: (orgId: string, projectId: string) =>
    `/orgs/${orgId}/projects/${projectId}`,
  flag: (orgId: string, projectId: string, flagId: string) =>
    `/orgs/${orgId}/projects/${projectId}/flags/${flagId}`,
} as const;
