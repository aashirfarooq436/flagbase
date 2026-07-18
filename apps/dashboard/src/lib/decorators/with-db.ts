import "server-only";

import { ensureConnection } from "@flagbase/composition";

import { serverEnv } from "../env";
import type { Handler } from "./types";

/**
 * Ensures a Mongo connection before the handler runs. The connection is cached and reused
 * across invocations (serverless-safe), so this is cheap on a warm process.
 */
export function withDb<P>(handler: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    await ensureConnection(serverEnv().MONGODB_URI);
    return handler(req, ctx);
  };
}
