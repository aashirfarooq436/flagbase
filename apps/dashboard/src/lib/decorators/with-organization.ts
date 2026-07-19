import "server-only";

import { composition } from "@flagbase/composition";
import { ForbiddenError } from "@flagbase/core";

import { buildAbilityFor } from "../abilities";
import type { OrgHandler, UserHandler } from "./types";

/**
 * Org-scoped gate. Loads the actor's membership in the `[organizationId]` route param and builds
 * their CASL ability onto the context. A signed-in user who is not a member is bounced with
 * `ForbiddenError` (→ 403) — the tenant boundary at the delivery layer. Runs after `withUser`.
 */
export function withOrganization(handler: OrgHandler): UserHandler {
  return async (request, context) => {
    const { organizationId } = (await context.params) as {
      organizationId: string;
    };
    const membership = await composition.member.getMembership.execute({
      organizationId,
      userId: context.userId,
    });
    if (membership === null) {
      throw new ForbiddenError("You are not a member of this organization.");
    }

    const ability = buildAbilityFor(membership.role);
    return handler(request, {
      ...context,
      organizationId,
      membership,
      ability,
    });
  };
}
