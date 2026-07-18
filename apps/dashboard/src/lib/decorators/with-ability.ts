import "server-only";

import { ForbiddenError } from "@flagbase/core";

import type { AppAction, AppSubject } from "../abilities";
import type { OrgHandler } from "./types";

/**
 * Asserts the actor's ability permits `action` on `subject`; throws `ForbiddenError` (→ 403)
 * otherwise. Requires `withOrganization` first (it reads `context.ability`).
 */
export function withAbility(action: AppAction, subject: AppSubject) {
  return (handler: OrgHandler): OrgHandler => {
    return async (request, context) => {
      if (context.ability.cannot(action, subject)) {
        throw new ForbiddenError(
          `You are not allowed to ${action} ${subject}.`,
        );
      }
      return handler(request, context);
    };
  };
}
