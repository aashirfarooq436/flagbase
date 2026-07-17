import { ValidationError } from "./errors";

/** RFC 5321 caps the whole address at 254 characters. */
const MAX_LENGTH = 254;

/**
 * Pragmatic rather than RFC-complete. A fully correct RFC 5322 pattern is famously
 * enormous and still accepts addresses no mail server would deliver to. The real
 * proof that an address exists is the verification email we send to it.
 */
const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An email address, normalized.
 *
 * Normalization is load-bearing, not cosmetic. Email is the account-linking key: a
 * user who signed up as `Aashir@Example.com` and later signs in with Google as
 * `aashir@example.com` must land on the same account. If those compare as different
 * values, linking silently fails and the same person ends up with two accounts.
 * Normalizing here, in the constructor, makes that impossible to forget at a call site.
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
