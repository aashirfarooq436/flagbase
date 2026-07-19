import { ValidationError } from "../../shared/errors";

const MAX_LENGTH = 100;

/**
 * Lowercase alphanumeric words separated by single dashes: `dark-mode`, `new-checkout`.
 *
 * Constrained tightly because the key is what customers type into their own source
 * code. A restrictive, predictable shape keeps it copy-pasteable and case-unambiguous
 * — no surprises about whether `DarkMode` and `darkmode` are the same flag.
 */
const PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The stable identifier customers reference in their code, e.g.
 * `isEnabled('dark-mode')`.
 *
 * Immutability is enforced at the Flag level (there is no setter for it): renaming a
 * key would silently break the customer's app at runtime, so a rename is a
 * delete-and-recreate, not an edit.
 */
export class FlagKey {
  readonly value: string;

  constructor(input: string) {
    if (input.length === 0) {
      throw new ValidationError("Flag key must not be empty");
    }

    if (input.length > MAX_LENGTH) {
      throw new ValidationError(
        `Flag key must be at most ${MAX_LENGTH} characters, received ${input.length}`,
      );
    }

    if (!PATTERN.test(input)) {
      throw new ValidationError(
        `Flag key must be lowercase alphanumeric words separated by dashes, received "${input}"`,
      );
    }

    this.value = input;
  }

  equals(other: FlagKey): boolean {
    return other.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
