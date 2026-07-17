import { describe, expect, it } from "vitest";

import { Email } from "../../shared/email.vo";
import { ValidationError } from "../../shared/errors";
import { User } from "./user.entity";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function makeUser(): User {
  return User.create({
    id: "user-1",
    email: new Email("aashir@example.com"),
    name: "Aashir",
    passwordHash: "hashed-secret",
    now: NOW,
  });
}

describe("User", () => {
  describe("create", () => {
    it("creates a user with a password", () => {
      const user = makeUser();
      expect(user.email.value).toBe("aashir@example.com");
      expect(user.name).toBe("Aashir");
      expect(user.passwordHash).toBe("hashed-secret");
      expect(user.createdAt).toBe(NOW);
    });

    it("rejects an empty name", () => {
      expect(() =>
        User.create({
          id: "user-1",
          email: new Email("a@b.co"),
          name: "   ",
          passwordHash: "hashed-secret",
          now: NOW,
        }),
      ).toThrow(ValidationError);
    });

    it("rejects an empty password hash", () => {
      expect(() =>
        User.create({
          id: "user-1",
          email: new Email("a@b.co"),
          name: "Aashir",
          passwordHash: "",
          now: NOW,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe("setPassword", () => {
    it("replaces the password hash", () => {
      const user = makeUser();
      user.setPassword("new-hash");
      expect(user.passwordHash).toBe("new-hash");
    });

    it("rejects an empty password hash", () => {
      expect(() => makeUser().setPassword("")).toThrow(ValidationError);
    });
  });

  describe("changeName", () => {
    it("updates the name", () => {
      const user = makeUser();
      user.changeName("Aashir Farooq");
      expect(user.name).toBe("Aashir Farooq");
    });

    it("rejects an empty name", () => {
      expect(() => makeUser().changeName("  ")).toThrow(ValidationError);
    });

    it("rejects a name beyond the length limit", () => {
      expect(() => makeUser().changeName("x".repeat(101))).toThrow(
        ValidationError,
      );
    });
  });
});
