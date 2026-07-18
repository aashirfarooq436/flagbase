import "server-only";

import { UnauthenticatedError } from "@flagbase/core";

import { sessionManager } from "../auth/session-manager";
import type { AuthedHandler, Handler } from "./types";

/**
 * Resolves the session identity and puts `userId` on the context; throws
 * `UnauthenticatedError` (→ 401 via `withErrorHandling`) if there is no valid session.
 * Everything an authenticated route needs about *who* is acting comes from here — never from
 * the request body.
 */
export function withAuth<P>(handler: AuthedHandler<P>): Handler<P> {
  return async (req, ctx) => {
    const session = await sessionManager.resolve();
    if (session === null) {
      throw new UnauthenticatedError("You must be signed in.");
    }
    return handler(req, { ...ctx, userId: session.userId });
  };
}
