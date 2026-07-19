/** MongoDB's duplicate-key error code. */
export const DUPLICATE_KEY = 11000;

/**
 * Whether an error is a unique-index violation. Repositories translate these into
 * domain ConflictErrors so callers above never have to know Mongo error codes.
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === DUPLICATE_KEY
  );
}
