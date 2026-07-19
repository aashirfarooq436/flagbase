import { describe, expect, it } from "vitest";

import { Email } from "./email.vo";
import { ValidationError } from "./errors";

describe("Email", () => {
  describe("normalization", () => {
    it("lowercases the address", () => {
      expect(new Email("Aashir@Example.com").value).toBe("aashir@example.com");
    });

    it("trims surrounding whitespace", () => {
      expect(new Email("  aashir@example.com  ").value).toBe(
        "aashir@example.com",
      );
    });

    it("normalizes so the account-linking key compares equal regardless of casing", () => {
      // The property account linking depends on (docs/DOMAIN_MODEL.md §4.3).
      expect(
        new Email("Victim@Example.com").equals(new Email("victim@example.com")),
      ).toBe(true);
    });
  });

  describe("validation", () => {
    it("rejects an empty or whitespace-only address", () => {
      expect(() => new Email("")).toThrow(ValidationError);
      expect(() => new Email("   ")).toThrow(ValidationError);
    });

    it("rejects addresses without a single @", () => {
      for (const bad of ["plainaddress", "a@@b.com", "a b@example.com"]) {
        expect(() => new Email(bad), bad).toThrow(ValidationError);
      }
    });

    it("rejects addresses without a dotted domain", () => {
      expect(() => new Email("aashir@localhost")).toThrow(ValidationError);
    });

    it("rejects addresses beyond the 254-character limit", () => {
      const huge = `${"a".repeat(250)}@x.com`;
      expect(() => new Email(huge)).toThrow(ValidationError);
    });

    it("accepts ordinary addresses", () => {
      for (const ok of [
        "a@b.co",
        "first.last@example.com",
        "user+tag@sub.example.org",
      ]) {
        expect(() => new Email(ok), ok).not.toThrow();
      }
    });
  });

  it("renders back to its string value", () => {
    expect(new Email("aashir@example.com").toString()).toBe(
      "aashir@example.com",
    );
  });
});
