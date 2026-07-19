import type { ErrorCode, FieldError } from "@flagbase/contracts";

/**
 * The client-side error thrown by the API service when a response is not ok. Carries the
 * server's `ErrorResponse` fields so callers (toasts, forms) can react to `code` and attach
 * per-field messages. `code` is undefined for an unexpected 500 (opaque server error).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode | undefined,
    message: string,
    readonly fields?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
