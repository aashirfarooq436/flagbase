import { describe, expect, it } from "vitest";

import { User } from "../../../../domain/user/user.entity";
import { Email } from "../../../../shared/email.vo";
import {
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../../../../shared/errors";
import { FakePasswordHasher } from "../../../../lib/test-support/fake-password-hasher";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { ChangePasswordUseCase } from "./change-password.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const users = new InMemoryUserRepository([
    User.create({
      id: "user-1",
      email: new Email("aashir@example.com"),
      name: "Aashir",
      passwordHash: "hashed:current-pass", // FakePasswordHasher.hash("current-pass")
      now: NOW,
    }),
  ]);
  return {
    useCase: new ChangePasswordUseCase(users, new FakePasswordHasher()),
    users,
  };
}

const input = {
  userId: "user-1",
  currentPassword: "current-pass",
  newPassword: "brand-new-pass",
};

describe("ChangePasswordUseCase", () => {
  it("replaces the password when the current one matches", async () => {
    const { useCase, users } = setup();
    await useCase.execute(input);

    expect((await users.findById("user-1"))!.passwordHash).toBe(
      "hashed:brand-new-pass",
    );
  });

  it("throws UnauthenticatedError when the current password is wrong", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...input, currentPassword: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("rejects a new password that violates the policy", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...input, newPassword: "short" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws NotFoundError for an unknown user", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...input, userId: "nope" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
