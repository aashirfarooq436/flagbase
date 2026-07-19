import "server-only";

import type { ErrorResponse } from "@flagbase/contracts";
import { DomainError, type DomainErrorCode } from "@flagbase/core";
import { ConsoleLogger } from "@flagbase/shared";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { Handler } from "./types";

/** The one place domain error codes become HTTP statuses (BACKEND_ARCHITECTURE §4). */
const STATUS: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FORBIDDEN: 403,
  UNAUTHENTICATED: 401,
};

const logger = new ConsoleLogger({ context: { module: "api" } });

/**
 * Maps any thrown value to the wire `ErrorResponse` and HTTP status. A `DomainError` maps by
 * its `code`; a `ZodError` (request-boundary validation) becomes a 400 with per-field
 * messages; anything else is unexpected — logged server-side with its real cause and returned
 * as an opaque 500 so internals never leak to the client.
 */
function toResponse(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    const body: ErrorResponse = {
      error: { code: error.code, message: error.message },
    };
    return NextResponse.json(body, { status: STATUS[error.code] });
  }

  if (error instanceof ZodError) {
    const body: ErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "The request is invalid.",
        fields: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
    return NextResponse.json(body, { status: 400 });
  }

  logger.error("Unhandled error in route handler", {
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json(
    { error: { message: "Something went wrong." } },
    { status: 500 },
  );
}

/**
 * Outermost decorator: turns any error thrown anywhere in the chain — a domain error from a
 * use-case, a Zod parse failure, a missing-env misconfig in `withDb`, or an unexpected crash —
 * into the mapped HTTP response. Because it wraps everything, the inner decorators just throw.
 */
export function withErrorHandling(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toResponse(error);
    }
  };
}
