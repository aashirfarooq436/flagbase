import { describe, expect, it } from "vitest";

import { User } from "../../../../domain/user/user.entity";
import { Email } from "../../../../shared/email.vo";
import { NotFoundError, ValidationError } from "../../../../shared/errors";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { UpdateProfileUseCase } from "./update-profile.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function setup() {
  const users = new InMemoryUserRepository([
    User.create({
      id: "user-1",
      email: new Email("aashir@example.com"),
      name: "Aashir",
      passwordHash: "hashed:pw",
      now: NOW,
    }),
  ]);
  return { useCase: new UpdateProfileUseCase(users), users };
}

describe("UpdateProfileUseCase", () => {
  it("updates the display name", async () => {
    const { useCase, users } = setup();
    const user = await useCase.execute({
      userId: "user-1",
      name: "Aashir Farooq",
    });

    expect(user.name).toBe("Aashir Farooq");
    expect((await users.findById("user-1"))!.name).toBe("Aashir Farooq");
  });

  it("throws NotFoundError for an unknown user", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ userId: "nope", name: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects an empty name", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ userId: "user-1", name: "  " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
