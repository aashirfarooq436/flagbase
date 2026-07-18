import type { User } from "@flagbase/core";
import type { NextRequest } from "next/server";

/** Next App Router passes route params as a promise in the handler's second argument. */
export type RouteContext<P = Record<string, string>> = {
  params: Promise<P>;
};

export type Handler<P = Record<string, string>> = (
  req: NextRequest,
  ctx: RouteContext<P>,
) => Promise<Response>;

/** After `withAuth`, the resolved user id is on the context. */
export type AuthedContext<P = Record<string, string>> = RouteContext<P> & {
  userId: string;
};

export type AuthedHandler<P = Record<string, string>> = (
  req: NextRequest,
  ctx: AuthedContext<P>,
) => Promise<Response>;

/** After `withUser`, the loaded User entity is on the context (in addition to `userId`). */
export type UserContext<P = Record<string, string>> = AuthedContext<P> & {
  user: User;
};

export type UserHandler<P = Record<string, string>> = (
  req: NextRequest,
  ctx: UserContext<P>,
) => Promise<Response>;
