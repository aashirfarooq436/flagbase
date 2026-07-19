import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { Slug } from "./slug.vo";

describe("Slug", () => {
  describe("fromName", () => {
    it("slugifies a display name", () => {
      expect(Slug.fromName("Acme Inc").value).toBe("acme-inc");
    });

    it("lowercases and collapses non-alphanumeric runs into single hyphens", () => {
      expect(Slug.fromName("  Hello,  World!! ").value).toBe("hello-world");
    });

    it("trims leading and trailing hyphens", () => {
      expect(Slug.fromName("--Acme--").value).toBe("acme");
    });

    it("keeps digits", () => {
      expect(Slug.fromName("Team 42").value).toBe("team-42");
    });

    it("throws when nothing usable remains", () => {
      expect(() => Slug.fromName("!!!")).toThrow(ValidationError);
    });
  });

  describe("constructor", () => {
    it("accepts a valid slug", () => {
      expect(new Slug("acme-inc").value).toBe("acme-inc");
    });

    it("normalizes case and surrounding whitespace", () => {
      expect(new Slug("  ACME  ").value).toBe("acme");
    });

    it("rejects spaces and underscores", () => {
      expect(() => new Slug("acme inc")).toThrow(ValidationError);
      expect(() => new Slug("acme_inc")).toThrow(ValidationError);
    });

    it("rejects leading, trailing, or doubled hyphens", () => {
      expect(() => new Slug("-acme")).toThrow(ValidationError);
      expect(() => new Slug("acme-")).toThrow(ValidationError);
      expect(() => new Slug("acme--inc")).toThrow(ValidationError);
    });

    it("rejects an empty value", () => {
      expect(() => new Slug("   ")).toThrow(ValidationError);
    });
  });

  it("compares by value", () => {
    expect(new Slug("acme").equals(new Slug("acme"))).toBe(true);
    expect(new Slug("acme").equals(new Slug("other"))).toBe(false);
  });
});
