import { ValidationError } from "./errors";

const MIN_LENGTH = 8;
// bcrypt/argon2 both truncate very long inputs; cap well below any such limit and
// bound the work an attacker can force by submitting huge strings.
const MAX_LENGTH = 128;

/**
 * A plaintext password that satisfies the account's password policy.
 *
 * Holds the raw password transiently — it exists only long enough to be handed to
 * IPasswordHasher, then discarded; it is never persisted. Modeling it as a value object
 * keeps the policy in one place (the constructor), so both sign-up and a future
 * change-password use the exact same rule rather than re-checking length ad hoc.
 *
 * Deliberately NOT trimmed or lowercased — every character of a password is significant.
 */
export class Password {
  readonly value: string;

  constructor(input: string) {
    if (input.length < MIN_LENGTH) {
      throw new ValidationError(
        `Password must be at least ${MIN_LENGTH} characters`,
      );
    }

    if (input.length > MAX_LENGTH) {
      throw new ValidationError(
        `Password must be at most ${MAX_LENGTH} characters`,
      );
    }

    this.value = input;
  }
}
