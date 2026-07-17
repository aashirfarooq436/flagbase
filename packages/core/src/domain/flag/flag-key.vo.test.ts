import { describe, expect, it } from "vitest";

import { ValidationError } from "../../shared/errors";
import { FlagKey } from "./flag-key.vo";

describe("FlagKey", () => {
  it("accepts lowercase alphanumeric words separated by single dashes", () => {
    for (const ok of [
      "dark-mode",
      "new-checkout",
      "feature1",
      "a",
      "a-b-c",
      "v2-beta",
    ]) {
      expect(() => new FlagKey(ok), ok).not.toThrow();
    }
  });

  it("rejects empty keys", () => {
    expect(() => new FlagKey("")).toThrow(ValidationError);
  });

  it("rejects uppercase — the key must be case-unambiguous", () => {
    expect(() => new FlagKey("DarkMode")).toThrow(ValidationError);
    expect(() => new FlagKey("dark-Mode")).toThrow(ValidationError);
  });

  it("rejects spaces, underscores, and other punctuation", () => {
    for (const bad of [
      "dark mode",
      "dark_mode",
      "dark.mode",
      "dark/mode",
      "dark:mode",
    ]) {
      expect(() => new FlagKey(bad), bad).toThrow(ValidationError);
    }
  });

  it("rejects leading, trailing, or doubled dashes", () => {
    for (const bad of ["-dark", "dark-", "dark--mode"]) {
      expect(() => new FlagKey(bad), bad).toThrow(ValidationError);
    }
  });

  it("rejects keys beyond the length limit", () => {
    expect(() => new FlagKey("a".repeat(101))).toThrow(ValidationError);
  });

  it("compares by value", () => {
    expect(new FlagKey("dark-mode").equals(new FlagKey("dark-mode"))).toBe(
      true,
    );
    expect(new FlagKey("dark-mode").equals(new FlagKey("light-mode"))).toBe(
      false,
    );
  });
});
