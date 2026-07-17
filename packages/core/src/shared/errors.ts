/**
 * Domain errors.
 *
 * `core` signals failure by throwing these. Nothing here knows about HTTP —
 * mapping `code` to a status belongs to the delivery layer, in exactly one place.
 *
 * The `code` discriminator exists so that mapping can be a lookup rather than
 * `instanceof` chains or, worse, matching on message strings.
 */

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  protected constructor(message: string) {
    super(message);
    // Without this, `error.name` reports "Error" for every subclass.
    this.name = new.target.name;
  }
}

export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN";

/** An invariant was violated — a value object rejected its input, or an entity rejected a transition. */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
  }
}

/** A referenced entity does not exist. */
export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;

  constructor(message: string) {
    super(message);
  }
}

/** The operation collides with existing state — a duplicate key, a taken email. */
export class ConflictError extends DomainError {
  readonly code = "CONFLICT" as const;

  constructor(message: string) {
    super(message);
  }
}

/**
 * The actor is not permitted to perform this operation.
 *
 * Distinct from the CASL check at the route boundary: this is for rules the domain
 * itself owns, such as "the last owner of an organization cannot be demoted."
 */
export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN" as const;

  constructor(message: string) {
    super(message);
  }
}
