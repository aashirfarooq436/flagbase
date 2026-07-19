import { describe, expect, it } from "vitest";

import { ValidationError } from "./errors";
import { Password } from "./password.vo";

describe("Password", () => {
  it("accepts a password within the length policy", () => {
    expect(new Password("s3cur3-pass").value).toBe("s3cur3-pass");
  });

  it("rejects a password shorter than the minimum", () => {
    expect(() => new Password("short")).toThrow(ValidationError);
  });

  it("rejects a password longer than the maximum", () => {
    expect(() => new Password("x".repeat(129))).toThrow(ValidationError);
  });

  it("preserves the password exactly — no trimming or casing", () => {
    expect(new Password("  MixedCase  ").value).toBe("  MixedCase  ");
  });
});
