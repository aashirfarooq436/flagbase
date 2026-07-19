import { describe, expect, it } from "vitest";

import {
  changePasswordRequestSchema,
  signInRequestSchema,
  signUpRequestSchema,
} from "./request";

describe("signUpRequestSchema", () => {
  it("accepts a valid sign-up", () => {
    expect(
      signUpRequestSchema.safeParse({
        email: "aashir@example.com",
        name: "Aashir",
        password: "s3cur3-pass",
      }).success,
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(
      signUpRequestSchema.safeParse({
        email: "not-an-email",
        name: "Aashir",
        password: "s3cur3-pass",
      }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than the policy minimum", () => {
    expect(
      signUpRequestSchema.safeParse({
        email: "aashir@example.com",
        name: "Aashir",
        password: "short",
      }).success,
    ).toBe(false);
  });
});

describe("signInRequestSchema", () => {
  it("accepts any non-empty password (no policy check on login)", () => {
    expect(
      signInRequestSchema.safeParse({
        email: "aashir@example.com",
        password: "x",
      }).success,
    ).toBe(true);
  });
});

describe("changePasswordRequestSchema", () => {
  it("enforces the policy on the new password only", () => {
    expect(
      changePasswordRequestSchema.safeParse({
        currentPassword: "x",
        newPassword: "long-enough-pass",
      }).success,
    ).toBe(true);
    expect(
      changePasswordRequestSchema.safeParse({
        currentPassword: "x",
        newPassword: "short",
      }).success,
    ).toBe(false);
  });
});
