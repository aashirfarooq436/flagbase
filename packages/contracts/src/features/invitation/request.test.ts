import { describe, expect, it } from "vitest";

import {
  invitationTokenRequestSchema,
  inviteMemberRequestSchema,
} from "./request";

describe("inviteMemberRequestSchema", () => {
  it("accepts a valid invite", () => {
    expect(
      inviteMemberRequestSchema.safeParse({
        email: "invitee@example.com",
        role: "member",
      }).success,
    ).toBe(true);
  });

  it("rejects inviting as owner", () => {
    expect(
      inviteMemberRequestSchema.safeParse({
        email: "invitee@example.com",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(
      inviteMemberRequestSchema.safeParse({ email: "nope", role: "member" })
        .success,
    ).toBe(false);
  });
});

describe("invitationTokenRequestSchema", () => {
  it("requires a non-empty token", () => {
    expect(
      invitationTokenRequestSchema.safeParse({ token: "abc" }).success,
    ).toBe(true);
    expect(invitationTokenRequestSchema.safeParse({ token: "" }).success).toBe(
      false,
    );
  });
});
