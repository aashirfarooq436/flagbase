/**
 * Named HTTP status codes.
 *
 * Routes reference `HttpStatus.Created`, never the magic number `201` — the same way the domain
 * signals failure with `ConflictError` rather than `409`. Framework-agnostic and reusable across
 * apps, so it lives in the shared toolkit.
 */
export const HttpStatus = {
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
