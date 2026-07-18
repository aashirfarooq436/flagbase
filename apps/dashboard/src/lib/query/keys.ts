/**
 * The single source of truth for React Query cache keys. Hooks read from here so a key is
 * never spelled out inline — that's what keeps queries and their invalidations in lockstep
 * (see ./invalidation).
 */
export const authKeys = {
  me: ["auth", "me"] as const,
};

export const organizationKeys = {
  all: ["organizations"] as const,
  mine: ["organizations", "mine"] as const,
};
