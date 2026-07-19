import { ValidationError } from "../../shared/errors";

const MAX_LENGTH = 100;

/** Lowercase alphanumerics in hyphen-separated groups: `acme`, `acme-inc`, `team-42`. */
const PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * An organization's URL slug — its address in the dashboard (`/{slug}/...`).
 *
 * Immutable and unique across the system: it is derived once from the name at creation via
 * `Slug.fromName`, and renaming the organization does NOT change it, so URLs stay stable.
 * Uniqueness is a cross-row invariant, enforced in the create use-case and backstopped by a
 * DB unique index (like the unique-email rule for users).
 */
export class Slug {
  readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toLowerCase();

    if (normalized.length === 0) {
      throw new ValidationError("Slug must not be empty");
    }

    if (normalized.length > MAX_LENGTH) {
      throw new ValidationError(
        `Slug must be at most ${MAX_LENGTH} characters, received ${normalized.length}`,
      );
    }

    if (!PATTERN.test(normalized)) {
      throw new ValidationError(`Slug is not URL-safe: ${input}`);
    }

    this.value = normalized;
  }

  /**
   * Derives a slug from a display name: lowercase, each run of non-alphanumerics becomes a
   * single hyphen, leading/trailing hyphens trimmed (`"Acme Inc!" → "acme-inc"`). Throws if
   * nothing usable remains (a name of only punctuation) — the caller surfaces it as a
   * validation error.
   */
  static fromName(name: string): Slug {
    const slugified = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (slugified.length === 0) {
      throw new ValidationError(
        "Cannot derive a URL from this name — use letters or numbers",
      );
    }

    return new Slug(slugified);
  }

  equals(other: Slug): boolean {
    return other.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
