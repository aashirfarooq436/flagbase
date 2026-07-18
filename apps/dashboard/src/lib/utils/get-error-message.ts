import { ApiError } from "../types/api-error";

/** Extracts a human-facing message from any caught value — for a toast or inline error. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}
