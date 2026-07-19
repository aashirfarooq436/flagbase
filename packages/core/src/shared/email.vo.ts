import { ValidationError } from "./errors";

/** RFC 5321 caps the whole address at 254 characters. */
const MAX_LENGTH = 254;

/**
 * Pragmatic rather than RFC-complete. A fully correct RFC 5322 pattern is famously
 * enormous and still accepts addresses no mail server would deliver to. Format is a
 * sanity gate, not a proof of deliverability.
 */
const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An email address, normalized.
 *
 * Normalization is load-bearing, not cosmetic. Email is the unique account key and the
 * login identifier: a user who registered as `Aashir@Example.com` must sign in as
 * `aashir@example.com` and land on the same account, and the uniqueness check must treat
 * those as one address. If they compared as different values, one person could register
 * twice. Normalizing here, in the constructor, makes that impossible to forget at a call site.
 */
export class Email {
  readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toLowerCase();

    if (normalized.length === 0) {
      throw new ValidationError("Email must not be empty");
    }

    if (normalized.length > MAX_LENGTH) {
      throw new ValidationError(
        `Email must be at most ${MAX_LENGTH} characters, received ${normalized.length}`,
      );
    }

    if (!PATTERN.test(normalized)) {
      throw new ValidationError(`Email is not a valid address: ${input}`);
    }

    this.value = normalized;
  }

  equals(other: Email): boolean {
    return other.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
