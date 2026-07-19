/**
 * The shape of every error response the API returns.
 *
 * `code` mirrors core's `DomainError` codes — duplicated here rather than imported so
 * `contracts` stays free of `core` (it's shared with the frontend, which must not pull the
 * domain in). The delivery layer maps `DomainError.code` → HTTP status and this body.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNAUTHENTICATED";

/** A single field-level validation failure, from Zod, for a form to attach to an input. */
export type FieldError = {
  path: string;
  message: string;
};

export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    /** Present only for VALIDATION_ERROR raised at the request boundary (Zod). */
    fields?: FieldError[];
  };
};
