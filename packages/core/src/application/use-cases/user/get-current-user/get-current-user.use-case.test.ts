import { describe, expect, it } from "vitest";

import { User } from "../../../../domain/user/user.entity";
import { InMemoryUserRepository } from "../../../../lib/test-support/in-memory-user.repository";
import { Email } from "../../../../shared/email.vo";
import { GetCurrentUserUseCase } from "./get-current-user.use-case";

const NOW = new Date("2026-07-17T00:00:00.000Z");

function user(id: string): User {
  return User.create({
    id,
    email: new Email(`${id}@example.com`),
    name: "Aashir",
    passwordHash: "hash",
    now: NOW,
  });
}

describe("GetCurrentUserUseCase", () => {
  it("returns the user for a known id", async () => {
    const users = new InMemoryUserRepository([user("user-1")]);
    const useCase = new GetCurrentUserUseCase(users);

    const found = await useCase.execute({ userId: "user-1" });

    expect(found?.id).toBe("user-1");
  });

  it("returns null for an unknown id (stale session), not an error", async () => {
    const useCase = new GetCurrentUserUseCase(new InMemoryUserRepository());

    expect(await useCase.execute({ userId: "ghost" })).toBeNull();
  });
});
