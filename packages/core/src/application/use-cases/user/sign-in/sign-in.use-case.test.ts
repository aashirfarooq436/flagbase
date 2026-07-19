import { describe, expect, it } from "vitest";

import { User } from "../../../../domain/user/user.entity";
import { FakePasswordHasher } from "../../../../lib/test-support/fake-password-hasher";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { Email } from "../../../../shared/email.vo";
import {
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../../../../shared/errors";
import { SignInUseCase } from "./sign-in.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function existingUser(): User {
  return User.create({
    id: "user-1",
    email: new Email("aashir@example.com"),
    name: "Aashir",
    // FakePasswordHasher.hash("s3cur3-pass")
    passwordHash: "hashed:s3cur3-pass",
    now: NOW,
  });
}

function setup() {
  const users = new InMemoryUserRepository([existingUser()]);
  return { useCase: new SignInUseCase(users, new FakePasswordHasher()) };
}

describe("SignInUseCase", () => {
  it("returns the user for correct credentials", async () => {
    const { useCase } = setup();
    const user = await useCase.execute({
      email: "aashir@example.com",
      password: "s3cur3-pass",
    });
    expect(user.id).toBe("user-1");
  });

  it("matches by normalized email", async () => {
    const { useCase } = setup();
    const user = await useCase.execute({
      email: "Aashir@Example.com",
      password: "s3cur3-pass",
    });
    expect(user.id).toBe("user-1");
  });

  it("throws UnauthenticatedError for a wrong password", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ email: "aashir@example.com", password: "wrong-pass" }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("throws NotFoundError for an unknown email", async () => {
    const { useCase } = setup();
    // Product decision: a missing account is a distinct 404 (see the use-case's tradeoff note).
    await expect(
      useCase.execute({ email: "nobody@example.com", password: "s3cur3-pass" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a malformed email with a validation error", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ email: "not-an-email", password: "s3cur3-pass" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
