import "server-only";

import type { Member, User } from "@flagbase/core";
import { HttpStatus } from "@flagbase/shared/http";
import { type NextRequest, NextResponse } from "next/server";
import type { z, ZodType } from "zod";

import type { AppAbility, AppAction, AppSubject } from "../abilities";
import type { Handler, OrgContext, OrgHandler, UserHandler } from "./types";
import { withAbility } from "./with-ability";
import { withAuth } from "./with-auth";
import { withDb } from "./with-db";
import { withErrorHandling } from "./with-error-handling";
import { withOrganization } from "./with-organization";
import { withUser } from "./with-user";

type Access = "public" | "user" | "organization";

/** The context surface a handler receives, per access level. */
type HandlerContext = {
  public: Record<never, never>;
  user: { userId: string; user: User };
  organization: {
    userId: string;
    user: User;
    organizationId: string;
    membership: Member;
    ability: AppAbility;
  };
};

type Schema = ZodType | undefined;

/** The *parsed* type of a schema (defaults/transforms applied), or a fallback when absent. */
type Parsed<S extends Schema, Fallback> = S extends ZodType
  ? z.output<S>
  : Fallback;

type RouteInput<
  A extends Access,
  TBody extends Schema,
  TQuery extends Schema,
  TParams extends Schema,
> = {
  body: Parsed<TBody, undefined>;
  query: Parsed<TQuery, undefined>;
  params: Parsed<TParams, Record<string, string>>;
  request: NextRequest;
  context: HandlerContext[A];
};

type RouteConfig<
  A extends Access,
  TBody extends Schema,
  TQuery extends Schema,
  TParams extends Schema,
  TResult,
> = {
  /** Who may call this route: `public` · a signed-in `user` · a member of the `organization` in the path. */
  access: A;
  /** Zod schema for the JSON body — parsed and handed over as `body` (routes never parse inline). */
  body?: TBody;
  /** Zod schema for the query string. */
  query?: TQuery;
  /** Zod schema for the route params (`[organizationId]`, `[projectId]`, …). */
  params?: TParams;
  /** Success status — a named `HttpStatus`. Defaults to `Ok`; a `void`/`null` result → `NoContent`. */
  status?: HttpStatus;
  /** For `access: "organization"`, the CASL permission to assert before running. */
  action?: AppAction;
  subject?: AppSubject;
  /** The essential logic: parsed input in, response DTO out. No HTTP plumbing. */
  handle: (input: RouteInput<A, TBody, TQuery, TParams>) => Promise<TResult>;
};

/**
 * Declarative route definition — the single building block for every API route.
 *
 * Declare the access level, the input schemas, and the success status; the handler receives
 * already-parsed `body` / `query` / `params` plus a typed `context`, and returns a DTO. `route`
 * does the parsing, the decorator chain (db · session · membership · ability · error mapping),
 * and the `NextResponse` — so route files stay free of inline plumbing and magic numbers.
 */
export function route<
  A extends Access,
  TBody extends Schema = undefined,
  TQuery extends Schema = undefined,
  TParams extends Schema = undefined,
  TResult = unknown,
>(config: RouteConfig<A, TBody, TQuery, TParams, TResult>): Handler {
  type Input = RouteInput<A, TBody, TQuery, TParams>;

  const core: Handler = async (request, context) => {
    const body = (
      config.body ? config.body.parse(await request.json()) : undefined
    ) as Input["body"];
    const query = (
      config.query
        ? config.query.parse(Object.fromEntries(request.nextUrl.searchParams))
        : undefined
    ) as Input["query"];
    const rawParams = await context.params;
    const params = (
      config.params ? config.params.parse(rawParams) : rawParams
    ) as Input["params"];

    const result = await config.handle({
      body,
      query,
      params,
      request,
      context: toHandlerContext(
        config.access,
        context as unknown as OrgContext,
      ) as HandlerContext[A],
    });

    if (result === undefined || result === null) {
      return new NextResponse(null, { status: HttpStatus.NoContent });
    }
    return NextResponse.json(result, {
      status: config.status ?? HttpStatus.Ok,
    });
  };

  return compose(config, core);
}

/** Extracts the clean per-access context from the decorated route context. */
function toHandlerContext(
  access: Access,
  context: OrgContext,
): HandlerContext[Access] {
  if (access === "public") {
    return {};
  }
  if (access === "user") {
    return { userId: context.userId, user: context.user };
  }
  return {
    userId: context.userId,
    user: context.user,
    organizationId: context.organizationId,
    membership: context.membership,
    ability: context.ability,
  };
}

/** Wraps `core` in the decorator chain the access level requires. */
function compose(
  config: { access: Access; action?: AppAction; subject?: AppSubject },
  core: Handler,
): Handler {
  switch (config.access) {
    case "public":
      return withErrorHandling(withDb(core));
    case "user":
      return withErrorHandling(
        withDb(withAuth(withUser(core as unknown as UserHandler))),
      );
    case "organization": {
      let organizationHandler = core as unknown as OrgHandler;
      if (config.action && config.subject) {
        organizationHandler = withAbility(
          config.action,
          config.subject,
        )(organizationHandler);
      }
      return withErrorHandling(
        withDb(withAuth(withUser(withOrganization(organizationHandler)))),
      );
    }
  }
}

export type { Access };
