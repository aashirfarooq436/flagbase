import { describe, expect, it } from "vitest";

import { Email } from "../../shared/email.vo";
import { ValidationError } from "../../shared/errors";
import { User } from "./user.entity";

const NOW = new Date("2026-07-17T00:00:00.000Z");
const LATER = new Date("2026-07-17T01:00:00.000Z");

function makePasswordUser(): User {
  return User.create({
    id: "user-1",
    email: new Email("aashir@example.com"),
    name: "Aashir",
    passwordHash: "hashed-secret",
    emailVerifiedAt: null,
    now: NOW,
  });
}

function makeOAuthUser(): User {
  return User.create({
    id: "user-2",
    email: new Email("oauth@example.com"),
    name: "OAuth User",
    passwordHash: null,
    emailVerifiedAt: NOW, // OAuth proves ownership at creation
    now: NOW,
  });
}

describe("User", () => {
  describe("create", () => {
    it("starts a password signup unverified", () => {
      const user = makePasswordUser();
      expect(user.isEmailVerified).toBe(false);
      expect(user.hasPassword).toBe(true);
    });

    it("allows an OAuth-only account with no password", () => {
      const user = makeOAuthUser();
      expect(user.hasPassword).toBe(false);
      expect(user.isEmailVerified).toBe(true);
    });

    it("rejects an empty name", () => {
      expect(() =>
        User.create({
          id: "user-1",
          email: new Email("a@b.co"),
          name: "   ",
          passwordHash: null,
          emailVerifiedAt: null,
          now: NOW,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("email verification", () => {
    it("records the verification time", () => {
      const user = makePasswordUser();
      user.verifyEmail(LATER);

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBe(LATER);
    });

    it("is idempotent — verifying twice keeps the original timestamp", () => {
      const user = makePasswordUser();
      user.verifyEmail(NOW);
      user.verifyEmail(LATER);

      expect(user.emailVerifiedAt).toBe(NOW);
    });
  });

  describe("password lifecycle", () => {
    it("sets a password hash", () => {
      const user = makeOAuthUser();
      user.setPassword("new-hash");
      expect(user.hasPassword).toBe(true);
      expect(user.passwordHash).toBe("new-hash");
    });

    it("rejects an empty password hash", () => {
      expect(() => makeOAuthUser().setPassword("")).toThrow(ValidationError);
    });

    it("removes a password", () => {
      const user = makePasswordUser();
      user.removePassword();
      expect(user.hasPassword).toBe(false);
    });
  });

  describe("changeName", () => {
    it("updates the name", () => {
      const user = makePasswordUser();
      user.changeName("Aashir Farooq");
      expect(user.name).toBe("Aashir Farooq");
    });

    it("rejects an empty name", () => {
      expect(() => makePasswordUser().changeName("  ")).toThrow(
        ValidationError,
      );
    });

    it("rejects a name beyond the length limit", () => {
      expect(() => makePasswordUser().changeName("x".repeat(101))).toThrow(
        ValidationError,
      );
    });
  });
});
