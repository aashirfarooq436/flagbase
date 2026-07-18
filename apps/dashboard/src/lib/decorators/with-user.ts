import "server-only";

import { composition } from "@flagbase/composition";
import { UnauthenticatedError } from "@flagbase/core";

import type { AuthedHandler, UserHandler } from "./types";

/**
 * Loads the authenticated `User` entity onto the context. Runs after `withAuth` (it needs the
 * resolved `userId`). A valid session whose user no longer exists is a stale session — treated
 * as unauthenticated so `withErrorHandling` maps it to 401 and the client clears the cookie.
 */
export function withUser(handler: UserHandler): AuthedHandler {
  return async (request, context) => {
    const user = await composition.user.getCurrent.execute({
      userId: context.userId,
    });
    if (user === null) {
      throw new UnauthenticatedError("Your session is no longer valid.");
    }
    return handler(request, { ...context, user });
  };
}
