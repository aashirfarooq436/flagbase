import type { Member, User } from "@flagbase/core";

import type { NextRequest } from "next/server";

import type { AppAbility } from "../abilities";

/** Route params, as Next resolves them (a promise of the dynamic segments). */
export type RouteContext = {
  params: Promise<Record<string, string>>;
};

export type Handler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<Response>;

/** After `withAuth`, the resolved user id is on the context. */
export type AuthedContext = RouteContext & {
  userId: string;
};

export type AuthedHandler = (
  request: NextRequest,
  context: AuthedContext,
) => Promise<Response>;

/** After `withUser`, the loaded User entity is on the context (in addition to `userId`). */
export type UserContext = AuthedContext & {
  user: User;
};

export type UserHandler = (
  request: NextRequest,
  context: UserContext,
) => Promise<Response>;

/** After `withOrganization`, the actor's membership + built CASL ability are on the context. */
export type OrgContext = UserContext & {
  organizationId: string;
  membership: Member;
  ability: AppAbility;
};

export type OrgHandler = (
  request: NextRequest,
  context: OrgContext,
) => Promise<Response>;
