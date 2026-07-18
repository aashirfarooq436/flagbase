import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Role } from "@flagbase/core";

import type { AppAbility } from "./ability";

/**
 * Builds a member's CASL ability from their role — the delivery layer's authorization policy,
 * defined explicitly per role. `manage` is a wildcard (implies `read`); listing only `read`
 * grants view-only access.
 */
export function buildAbilityFor(role: Role): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (role) {
    case Role.Owner:
      // Full control of the whole organization.
      can("manage", "Organization");
      can("manage", "Project");
      can("manage", "Flag");
      can("manage", "Member");
      break;

    case Role.Admin:
      // Runs projects and flags; can see the org and team, but not rename the org or manage members.
      can("read", "Organization");
      can("manage", "Project");
      can("manage", "Flag");
      can("read", "Member");
      break;

    case Role.Member:
      // View-only across the organization.
      can("read", "Organization");
      can("read", "Project");
      can("read", "Flag");
      can("read", "Member");
      break;
  }

  return build();
}
