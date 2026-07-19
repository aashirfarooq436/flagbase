/**
 * The single source of truth for React Query cache keys. Hooks read from here so a key is
 * never spelled out inline — that's what keeps queries and their invalidations in lockstep
 * (see ./invalidation).
 *
 * Scoped keys are hierarchical and mirror the nested route shape
 * (`organizations/:orgId/projects/:projectId/flags/:flagId`), so invalidating a list key
 * (e.g. `flagKeys.all(org, proj)`) also matches every detail beneath it.
 */
export const authKeys = {
  me: ["auth", "me"] as const,
};

export const organizationKeys = {
  all: ["organizations"] as const,
  mine: ["organizations", "mine"] as const,
  detail: (organizationId: string) =>
    ["organizations", organizationId] as const,
};

export const memberKeys = {
  all: (organizationId: string) =>
    ["organizations", organizationId, "members"] as const,
};

export const invitationKeys = {
  all: (organizationId: string) =>
    ["organizations", organizationId, "invitations"] as const,
};

export const projectKeys = {
  all: (organizationId: string) =>
    ["organizations", organizationId, "projects"] as const,
  detail: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId] as const,
};

export const flagKeys = {
  all: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId, "flags"] as const,
  detail: (organizationId: string, projectId: string, flagId: string) =>
    [
      "organizations",
      organizationId,
      "projects",
      projectId,
      "flags",
      flagId,
    ] as const,
};
