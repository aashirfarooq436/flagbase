import "server-only";

import type { Handler, UserHandler } from "./types";
import { withAuth } from "./with-auth";
import { withDb } from "./with-db";
import { withErrorHandling } from "./with-error-handling";
import { withUser } from "./with-user";

/**
 * A public route: error handling + DB connection, no session. For sign-up / sign-in, where
 * there is no session yet.
 */
export function withPublicHandlers<P>(handler: Handler<P>): Handler<P> {
  return withErrorHandling(withDb(handler));
}

/**
 * An authenticated route — the full stack: error handling ∘ DB ∘ session ∘ user. The handler
 * receives both `userId` and the loaded `user` on its context. Org-scoped RBAC
 * (`withOrganization` / `withAbility`) will layer on top of this once org-scoped routes exist.
 */
export function withAppHandlers<P>(handler: UserHandler<P>): Handler<P> {
  return withErrorHandling(withDb(withAuth(withUser(handler))));
}
