import { describe, expect, it } from "vitest";

import { Email } from "../../../../shared/email.vo";
import { ConflictError, ValidationError } from "../../../../shared/errors";
import { User } from "../../../../domain/user/user.entity";
import { FakeClock } from "../../../../lib/test-support/fake-clock";
import { FakeIdGenerator } from "../../../../lib/test-support/fake-id-generator";
import { FakePasswordHasher } from "../../../../lib/test-support/fake-password-hasher";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { SignUpUseCase } from "./sign-up.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup(seed: User[] = []) {
  const users = new InMemoryUserRepository(seed);
  const useCase = new SignUpUseCase(
    users,
    new FakePasswordHasher(),
    new FakeIdGenerator("user"),
    new FakeClock(NOW),
  );
  return { useCase, users };
}

const validInput = {
  email: "aashir@example.com",
  name: "Aashir",
  password: "s3cur3-pass",
};

describe("SignUpUseCase", () => {
  it("creates a user with a hashed password and no organization", async () => {
    const { useCase, users } = setup();

    const user = await useCase.execute(validInput);

    expect(user.id).toBe("user-1");
    expect(user.email.value).toBe("aashir@example.com");
    expect(user.name).toBe("Aashir");
    expect(user.passwordHash).toBe("hashed:s3cur3-pass"); // hashed, never plaintext
    expect(
      await users.findByEmail(new Email("aashir@example.com")),
    ).not.toBeNull();
  });

  it("normalizes the email before storing", async () => {
    const { useCase } = setup();
    const user = await useCase.execute({
      ...validInput,
      email: "Aashir@Example.COM",
    });
    expect(user.email.value).toBe("aashir@example.com");
  });

  it("throws ConflictError when the email is already registered", async () => {
    const { useCase } = setup();
    await useCase.execute(validInput);

    await expect(useCase.execute(validInput)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects a malformed email", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, email: "not-an-email" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a password that violates the policy", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...validInput, password: "short" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
